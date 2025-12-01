-- Adicionar colunas para valores individuais das peças na tabela fichas
ALTER TABLE fichas 
ADD COLUMN valor_paleto numeric,
ADD COLUMN valor_calca numeric,
ADD COLUMN valor_camisa numeric;