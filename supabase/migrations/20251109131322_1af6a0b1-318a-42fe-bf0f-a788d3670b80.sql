-- Remover todas as políticas existentes na tabela webhooks
DROP POLICY IF EXISTS "Allow public read access to webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Apenas gestores e admins podem ver webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Apenas gestores podem criar webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Apenas gestores podem atualizar webhooks" ON public.webhooks;
DROP POLICY IF EXISTS "Apenas gestores podem deletar webhooks" ON public.webhooks;

-- Criar novas políticas seguras
CREATE POLICY "Gestores e admins veem webhooks"
ON public.webhooks
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestores e admins criam webhooks"
ON public.webhooks
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestores e admins atualizam webhooks"
ON public.webhooks
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Gestores e admins deletam webhooks"
ON public.webhooks
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);