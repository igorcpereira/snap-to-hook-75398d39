-- Habilitar REPLICA IDENTITY FULL para capturar dados completos nos updates
ALTER TABLE public.fichas REPLICA IDENTITY FULL;

-- Adicionar tabela fichas à publicação supabase_realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fichas;