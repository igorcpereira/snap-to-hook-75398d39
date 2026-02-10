
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
