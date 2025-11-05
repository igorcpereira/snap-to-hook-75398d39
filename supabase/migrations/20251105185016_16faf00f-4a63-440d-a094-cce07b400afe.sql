-- Migration: Adicionar sistema de autenticação por vendedor

-- 1. TABELA FICHAS: Adicionar vendedor_id e remover vendedor_responsavel
ALTER TABLE fichas 
ADD COLUMN vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX idx_fichas_vendedor_id ON fichas(vendedor_id);

-- Remover política RLS antiga
DROP POLICY IF EXISTS "Allow public access to all fichas" ON fichas;

-- Criar novas políticas RLS
ALTER TABLE fichas ENABLE ROW LEVEL SECURITY;

-- Vendedores podem ver apenas suas fichas
CREATE POLICY "Vendedores veem apenas suas fichas"
ON fichas FOR SELECT
TO authenticated
USING (auth.uid() = vendedor_id);

-- Vendedores podem inserir apenas fichas para si mesmos
CREATE POLICY "Vendedores criam fichas para si"
ON fichas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = vendedor_id);

-- Vendedores podem atualizar apenas suas fichas
CREATE POLICY "Vendedores atualizam suas fichas"
ON fichas FOR UPDATE
TO authenticated
USING (auth.uid() = vendedor_id)
WITH CHECK (auth.uid() = vendedor_id);

-- Vendedores podem deletar apenas suas fichas
CREATE POLICY "Vendedores deletam suas fichas"
ON fichas FOR DELETE
TO authenticated
USING (auth.uid() = vendedor_id);

-- 2. TABELA CLIENTES: Adicionar vendedor_id
ALTER TABLE clientes 
ADD COLUMN vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Criar índice
CREATE INDEX idx_clientes_vendedor_id ON clientes(vendedor_id);

-- Remover política antiga
DROP POLICY IF EXISTS "Allow public access to all clientes" ON clientes;

-- Criar novas políticas RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Vendedores veem apenas seus clientes
CREATE POLICY "Vendedores veem apenas seus clientes"
ON clientes FOR SELECT
TO authenticated
USING (auth.uid() = vendedor_id);

-- Vendedores criam clientes para si
CREATE POLICY "Vendedores criam seus clientes"
ON clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = vendedor_id);

-- Vendedores atualizam seus clientes
CREATE POLICY "Vendedores atualizam seus clientes"
ON clientes FOR UPDATE
TO authenticated
USING (auth.uid() = vendedor_id)
WITH CHECK (auth.uid() = vendedor_id);

-- 3. TABELA PROFILES: Atualizar políticas RLS
DROP POLICY IF EXISTS "Allow public access to all profiles" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seu próprio perfil
CREATE POLICY "Usuários veem seu perfil"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Usuários podem atualizar apenas seu perfil
CREATE POLICY "Usuários atualizam seu perfil"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);