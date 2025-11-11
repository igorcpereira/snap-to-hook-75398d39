-- Remover política pública insegura
DROP POLICY IF EXISTS "Allow public read access to webhooks" ON public.webhooks;

-- Política SELECT: Apenas gestores/admins/masters podem ver webhooks
CREATE POLICY "Apenas gestores e admins podem ver webhooks"
ON public.webhooks
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Política INSERT: Apenas gestores/admins/masters podem criar webhooks
CREATE POLICY "Apenas gestores podem criar webhooks"
ON public.webhooks
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Política UPDATE: Apenas gestores/admins/masters podem atualizar webhooks
CREATE POLICY "Apenas gestores podem atualizar webhooks"
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

-- Política DELETE: Apenas gestores/admins/masters podem deletar webhooks
CREATE POLICY "Apenas gestores podem deletar webhooks"
ON public.webhooks
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'gestor'::app_role) OR 
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);