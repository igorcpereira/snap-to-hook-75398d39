
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
