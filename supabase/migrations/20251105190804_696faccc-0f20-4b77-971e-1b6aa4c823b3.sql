-- Adicionar coluna nome na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nome TEXT;

-- Criar ou substituir função para processar novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Vendedor'),
    'Vendedor'::user_role
  );
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();