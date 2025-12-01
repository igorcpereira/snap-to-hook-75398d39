-- Vincular tag "noivo" aos clientes que têm noivo='sim' na importação
INSERT INTO relacao_cliente_tag (id_cliente, id_tag)
SELECT DISTINCT c.id, '97b0b06e-73d7-49af-967a-3e0c2e067eb2'::uuid
FROM clientes c
INNER JOIN clientes_import ci ON 
  REPLACE(REPLACE(REPLACE(REPLACE(c.telefone, '(', ''), ')', ''), '-', ''), ' ', '') 
  LIKE '%' || REPLACE(REPLACE(REPLACE(REPLACE(ci.telefone, '(', ''), ')', ''), '-', ''), ' ', '') || '%'
WHERE LOWER(ci.noivo) = 'sim'
AND NOT EXISTS (
  SELECT 1 FROM relacao_cliente_tag rct 
  WHERE rct.id_cliente = c.id 
  AND rct.id_tag = '97b0b06e-73d7-49af-967a-3e0c2e067eb2'::uuid
);