

## Tabela de Log de Timestamps do Processo de Fichas

### O Fluxo Atual (do botao ate o salvamento)

```text
1. Usuario clica "Tirar Foto" ou "Carregar Imagem" (NewRegistration.tsx)
2. Seleciona/tira foto -> preview aparece
3. Confirma envio -> chama Edge Function "processar-ficha"
4. Edge Function:
   a. Cria ficha no banco (status: pendente)
   b. Upload da imagem no Storage
   c. Retorna ficha_id imediatamente
   d. Em background: envia para webhook externo
5. App navega para EditarFicha com o ficha_id
6. EditarFicha: escuta via Realtime as atualizacoes do webhook
7. Webhook retorna dados -> ficha atualizada via Realtime
8. Usuario confere/edita os campos
9. Auto-save a cada 5 segundos (se houve mudanca)
10. Usuario clica "Salvar" -> executeSave() -> status muda para "ativa"
11. Notificacao WhatsApp enviada em background
```

### Nova tabela: `log_processo_ficha`

Vamos criar uma tabela para registrar cada etapa do processo com timestamp preciso.

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid (PK) | Identificador unico |
| ficha_id | uuid | Referencia a ficha |
| etapa | text | Nome da etapa (ex: "foto_capturada", "envio_edge_function", etc.) |
| timestamp | timestamptz | Momento exato do evento |
| detalhes | jsonb | Dados extras opcionais (ex: tempo de resposta do webhook) |
| created_at | timestamptz | Default now() |

### Etapas que vamos registrar

1. **foto_selecionada** - usuario selecionou/tirou a foto
2. **envio_confirmado** - usuario confirmou o envio no dialog
3. **edge_function_inicio** - Edge Function recebeu a requisicao
4. **ficha_criada** - ficha inserida no banco
5. **upload_concluido** - imagem salva no Storage
6. **webhook_enviado** - requisicao enviada ao webhook externo
7. **webhook_resposta** - resposta recebida do webhook
8. **ficha_processada** - dados do webhook salvos na ficha
9. **salvamento_manual** - usuario clicou "Salvar" (executeSave)

### Alteracoes necessarias

**1. Migration SQL** - Criar tabela `log_processo_ficha` com RLS

**2. `src/pages/NewRegistration.tsx`** - Inserir logs nas etapas:
- `foto_selecionada` quando handleFileSelect e chamado
- `envio_confirmado` quando handleConfirmSend e chamado
- Passar ficha_id para os logs apos retorno da Edge Function

**3. `supabase/functions/processar-ficha/index.ts`** - Inserir logs nas etapas:
- `edge_function_inicio`
- `ficha_criada`
- `upload_concluido`
- `webhook_enviado`
- `webhook_resposta`
- `ficha_processada`

**4. `src/pages/EditarFicha.tsx`** - Inserir log na etapa:
- `salvamento_manual` dentro do executeSave()

### Detalhes tecnicos

**Migration SQL:**
```sql
CREATE TABLE log_processo_ficha (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ficha_id uuid NOT NULL,
  etapa text NOT NULL,
  timestamp timestamptz NOT NULL DEFAULT now(),
  detalhes jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE log_processo_ficha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem inserir logs"
  ON log_processo_ficha FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Gestores e admins veem logs"
  ON log_processo_ficha FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

**Funcao helper para inserir log (usada no frontend):**
```typescript
const logEtapa = async (fichaId: string, etapa: string, detalhes?: any) => {
  await supabase.from('log_processo_ficha').insert({
    ficha_id: fichaId,
    etapa,
    detalhes: detalhes || {},
  });
};
```

**Na Edge Function, logs inseridos diretamente via supabaseClient.**

