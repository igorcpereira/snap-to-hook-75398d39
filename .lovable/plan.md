

## Reestruturar tabela `log_processo_ficha` para abordagem de coluna por etapa

### Conceito

Em vez de multiplas linhas por ficha, teremos **uma unica linha por ficha** onde cada coluna representa o timestamp de uma etapa do processo. Isso facilita calculos de latencia e permite que o webhook externo atualize colunas diretamente.

### Nova estrutura da tabela

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| ficha_id | uuid (PK) | ID da ficha (chave primaria, sem auto-generate) |
| edge_function_inicio | timestamptz | Edge Function recebeu a requisicao |
| ficha_criada | timestamptz | Ficha inserida no banco |
| upload_concluido | timestamptz | Imagem salva no Storage |
| webhook_enviado | timestamptz | Requisicao enviada ao webhook externo |
| webhook_extract | timestamptz | Webhook: extracao da imagem |
| webhook_bucket | timestamptz | Webhook: processamento do bucket |
| webhook_atualiza | timestamptz | Webhook: atualizacao de dados |
| webhook_gpt | timestamptz | Webhook: chamada ao GPT |
| webhook_parser_dados | timestamptz | Webhook: parsing dos dados extraidos |
| webhook_return | timestamptz | Webhook: retorno preparado |
| webhook_resposta | timestamptz | Edge Function recebeu resposta do webhook |
| ficha_processada | timestamptz | Dados do webhook salvos na ficha |
| created_at | timestamptz | Default now() |

### Alteracoes necessarias

**1. Migration SQL**
- Dropar a tabela `log_processo_ficha` atual (que usa o modelo multi-linha)
- Criar nova tabela com a estrutura acima, usando `ficha_id` como PK
- RLS: INSERT e UPDATE para autenticados, SELECT para gestores/admins
- Politica de UPDATE necessaria (antes nao tinha) pois agora o webhook externo precisa atualizar colunas

**2. Edge Function `processar-ficha/index.ts`**
- Na criacao da ficha: INSERT na `log_processo_ficha` com `ficha_id`, `edge_function_inicio` e `ficha_criada`
- Apos upload: UPDATE setando `upload_concluido`
- Antes de chamar webhook: UPDATE setando `webhook_enviado`
- Ao receber resposta: UPDATE setando `webhook_resposta`
- Apos salvar dados: UPDATE setando `ficha_processada`

**3. Webhook externo (feito por voce)**
- O webhook externo pode fazer UPDATE diretamente na tabela via API do Supabase, preenchendo as colunas:
  - `webhook_extract`, `webhook_bucket`, `webhook_atualiza`, `webhook_gpt`, `webhook_parser_dados`, `webhook_return`
- Para isso, basta chamar a API REST do Supabase com a service role key ou anon key com o token adequado

**4. Remover logs antigos do frontend**
- Remover as chamadas de `logEtapa` que foram adicionadas em `NewRegistration.tsx` e `EditarFicha.tsx` (as etapas `foto_selecionada`, `envio_confirmado` e `salvamento_manual` nao estao mais no escopo)

### Detalhes tecnicos

**Migration SQL:**
```sql
DROP TABLE IF EXISTS log_processo_ficha;

CREATE TABLE log_processo_ficha (
  ficha_id uuid PRIMARY KEY,
  edge_function_inicio timestamptz,
  ficha_criada timestamptz,
  upload_concluido timestamptz,
  webhook_enviado timestamptz,
  webhook_extract timestamptz,
  webhook_bucket timestamptz,
  webhook_atualiza timestamptz,
  webhook_gpt timestamptz,
  webhook_parser_dados timestamptz,
  webhook_return timestamptz,
  webhook_resposta timestamptz,
  ficha_processada timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE log_processo_ficha ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem inserir logs"
  ON log_processo_ficha FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios autenticados podem atualizar logs"
  ON log_processo_ficha FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Gestores e admins veem logs"
  ON log_processo_ficha FOR SELECT
  USING (
    has_role(auth.uid(), 'gestor'::app_role)
    OR has_role(auth.uid(), 'master'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  );
```

**Edge Function - exemplo de uso:**
```typescript
// INSERT ao iniciar
await supabaseClient.from('log_processo_ficha').insert({
  ficha_id: ficha.id,
  edge_function_inicio: new Date().toISOString(),
  ficha_criada: new Date().toISOString(),
});

// UPDATE ao completar upload
await supabaseClient.from('log_processo_ficha')
  .update({ upload_concluido: new Date().toISOString() })
  .eq('ficha_id', ficha.id);
```

**Webhook externo - exemplo de chamada (HTTP):**
```text
PATCH https://pukcbqfjzswqmjkhwzfk.supabase.co/rest/v1/log_processo_ficha?ficha_id=eq.<ID>
Headers: apikey, Authorization
Body: { "webhook_extract": "2026-02-10T12:00:00Z" }
```

