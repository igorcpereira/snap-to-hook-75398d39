

## Corrigir Validacao de Ficha Duplicada

### O que muda
Quando o usuario clica em "Salvar" e o codigo da ficha ja existe em outra ficha no sistema, em vez de simplesmente bloquear o save, vamos mostrar um **dialog de aviso** com:
- Mensagem informando que a ficha ja foi lancada anteriormente
- A **data** em que foi lancada
- Dois botoes: **"Salvar mesmo assim"** (permite duplicacao) e **"Descartar"** (deleta a ficha pendente atual e volta para a lista)

### Detalhes Tecnicos

**Arquivo:** `src/pages/EditarFicha.tsx`

1. **Importar AlertDialog** do shadcn/ui (AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel)

2. **Novo state** para controlar o dialog:
   ```text
   const [fichaDuplicada, setFichaDuplicada] = useState<{ id: string; created_at: string } | null>(null);
   ```

3. **Alterar a query de verificacao** (linhas 446-451) para buscar tambem `created_at` alem de `id`:
   ```text
   .select('id, created_at')
   ```

4. **Alterar o bloco de duplicata** (linhas 453-461): em vez de mostrar toast e retornar, setar `setFichaDuplicada(fichaExistente)` e retornar. Isso abre o dialog.

5. **Nova funcao `handleDescartarFicha`**: deleta a ficha pendente atual do banco e navega de volta para `/pre-cadastro`

6. **Nova funcao `handleSalvarMesmoAssim`**: fecha o dialog, pula a validacao de duplicata e executa o save normalmente (chama o restante do handleSave)

7. **Adicionar o AlertDialog no JSX** com:
   - Titulo: "Ficha ja lancada"
   - Descricao: "Esta ficha (codigo X) ja foi lancada no sistema em DD/MM/YYYY. Deseja salvar novamente (pode gerar duplicacao) ou descartar este lancamento?"
   - Botao "Descartar" (variant outline) - chama handleDescartarFicha
   - Botao "Salvar mesmo assim" (variant default) - chama handleSalvarMesmoAssim

### Refatoracao do handleSave

O `handleSave` sera dividido em duas partes:
- **Parte 1 (validacao)**: verifica codigo obrigatorio e duplicata. Se duplicata, abre dialog e para.
- **Parte 2 (execucao)**: uma funcao `executeSave()` que faz todo o trabalho de salvar (cliente, ficha, tags, navegacao). Chamada tanto pelo handleSave normal quanto pelo "Salvar mesmo assim".

Isso evita duplicar codigo entre o fluxo normal e o fluxo de "salvar mesmo assim".

### Fluxo do usuario

```text
Usuario clica Salvar
       |
  Codigo existe?
   /         \
  Nao         Sim
   |            |
 Salva      Abre dialog com data
 normalmente   /          \
          Descartar    Salvar mesmo assim
              |              |
         Deleta ficha    Salva normalmente
         pendente e      (ignora duplicata)
         volta para
         lista
```
