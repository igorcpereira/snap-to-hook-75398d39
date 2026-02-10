

# Timeout e deteccao de erro para fichas presas

## Problema

Quando o webhook falha silenciosamente (sem retornar erro), a ficha fica com status "pendente" indefinidamente. O usuario fica vendo "Processando..." para sempre, sem feedback.

## Solucao

Duas camadas de protecao:

### 1. Timeout no frontend (EditarFicha)

Quando o usuario abre uma ficha que esta "processando" (sem `codigo_ficha` e status `pendente`), iniciar um timer de **2 minutos**. Se apos esse tempo a ficha ainda nao foi atualizada:

- Parar o indicador de processamento
- Mostrar um toast informando que nao foi possivel ler a ficha automaticamente
- Atualizar o status da ficha para `erro` no banco
- Permitir que o usuario preencha manualmente

### 2. Deteccao de fichas antigas na carga inicial

Ao carregar uma ficha, verificar se ela esta "pendente" **ha mais de 3 minutos** (comparando `created_at` com agora). Se sim:

- Nao ativar o indicador de processamento
- Marcar automaticamente como `erro`
- Mostrar mensagem: "A leitura automatica desta ficha expirou. Preencha manualmente."

### 3. Botao de reprocessar

Na tela de edicao, quando a ficha estiver com status `erro`, exibir um botao "Tentar ler novamente" que:

- Reenvia a imagem do bucket para a edge function
- Reseta o status para `pendente`
- Reinicia o timer de timeout

---

## Detalhes tecnicos

### Arquivo: `src/pages/EditarFicha.tsx`

**Mudanca 1 - Deteccao de ficha expirada no carregamento (dentro do `loadFicha`):**

```typescript
// Apos carregar fichaData, antes de setar isProcessing:
const tempoDecorrido = Date.now() - new Date(fichaData.created_at).getTime();
const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

if (!fichaData.codigo_ficha && fichaData.status === 'pendente') {
  if (tempoDecorrido > TIMEOUT_MS) {
    // Ficha expirou - marcar como erro
    await supabase
      .from('fichas')
      .update({ status: 'erro' })
      .eq('id', id);
    fichaData.status = 'erro';
    toast({
      title: "Leitura expirada",
      description: "Nao foi possivel ler esta ficha automaticamente. Preencha manualmente ou tente novamente.",
      variant: "destructive"
    });
  } else {
    setIsProcessing(true);
  }
}
```

**Mudanca 2 - Timer de timeout enquanto processa:**

```typescript
// Novo useEffect para timeout de processamento
useEffect(() => {
  if (!isProcessing || !ficha?.created_at) return;

  const tempoDecorrido = Date.now() - new Date(ficha.created_at).getTime();
  const TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos
  const tempoRestante = Math.max(TIMEOUT_MS - tempoDecorrido, 0);

  const timer = setTimeout(async () => {
    setIsProcessing(false);
    await supabase
      .from('fichas')
      .update({ status: 'erro' })
      .eq('id', id);

    toast({
      title: "Tempo esgotado",
      description: "Nao foi possivel processar a ficha. Preencha manualmente.",
      variant: "destructive"
    });
  }, tempoRestante);

  return () => clearTimeout(timer);
}, [isProcessing, ficha?.created_at, id]);
```

**Mudanca 3 - Indicador visual de erro e botao de reprocessar:**

Na area onde aparece o indicador de "Processando...", adicionar condicao para status `erro`:

```typescript
{ficha?.status === 'erro' && (
  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex items-center justify-between">
    <p className="text-sm text-destructive">
      Nao foi possivel ler esta ficha automaticamente.
    </p>
    <Button size="sm" variant="outline" onClick={handleReprocessar}>
      Tentar novamente
    </Button>
  </div>
)}
```

**Mudanca 4 - Funcao de reprocessamento:**

```typescript
const handleReprocessar = async () => {
  if (!id || !ficha?.url_bucket) return;

  setIsProcessing(true);

  // Baixa a imagem do bucket
  const { data: fileData } = await supabase.storage
    .from('fichas')
    .download(ficha.url_bucket);

  if (!fileData) {
    toast({ title: "Imagem nao encontrada no storage", variant: "destructive" });
    setIsProcessing(false);
    return;
  }

  // Reseta status
  await supabase
    .from('fichas')
    .update({ status: 'pendente' })
    .eq('id', id);

  // Reenvia para a edge function de processamento via webhook direto
  // (reutiliza a logica existente de processWebhookInBackground)
  const formData = new FormData();
  const file = new File([fileData], ficha.url_bucket, { type: 'image/jpeg' });
  formData.append('image', file);
  formData.append('ficha_id', id);

  // Chama o webhook diretamente
  // Ou alternativamente, cria uma edge function dedicada para reprocessar
};
```

### Resumo das alteracoes

| Arquivo | O que muda |
|---------|-----------|
| `src/pages/EditarFicha.tsx` | Adiciona timeout de 2min, deteccao de fichas expiradas (3min), botao de reprocessar, feedback visual de erro |

Nenhuma edge function nova e necessaria. O reprocessamento pode reutilizar o fluxo existente chamando a edge function `processar-ficha` novamente com a imagem do bucket.
