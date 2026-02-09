

## Adicionar botao de editar nome e telefone do cliente

### O que muda
Na pagina de detalhes do cliente (`ClienteDetalhes.tsx`), vamos adicionar um botao de edicao (icone de lapis) ao lado do nome do cliente. Ao clicar, abre um **Dialog** inline onde o usuario pode editar o **nome** e o **telefone**, salvar e ver a atualizacao imediatamente.

### Alteracoes no arquivo `src/pages/ClienteDetalhes.tsx`

1. **Novos imports**:
   - `Pencil` do lucide-react
   - `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` do shadcn/ui
   - `Input` e `Label` dos componentes ui
   - `useToast` para feedback

2. **Novos states**:
   - `editando` (boolean) - controla se o dialog esta aberto
   - `editNome` (string) - valor do campo nome em edicao
   - `editTelefone` (string) - valor do campo telefone em edicao
   - `salvandoEdicao` (boolean) - loading do botao salvar

3. **Funcao `handleSalvarEdicao`**:
   - Faz UPDATE na tabela `clientes` com o novo nome e telefone
   - Atualiza o state `cliente` localmente
   - Mostra toast de sucesso
   - Fecha o dialog

4. **Botao de editar no JSX**:
   - Icone de lapis ao lado do nome do cliente (linha 152)
   - Ao clicar, preenche `editNome` e `editTelefone` com valores atuais e abre o dialog

5. **Dialog de edicao**:
   - Titulo: "Editar Cliente"
   - Campo Input para Nome
   - Campo Input para Telefone
   - Botoes "Cancelar" e "Salvar"

### Layout do card atualizado

```text
+------------------------------------+
| Nome do Cliente          [icone ✏] |
| Cliente desde: 01/01/2025          |
| Tags: [tag1] [tag2]               |
| ---------------------------------- |
| Telefone: (44) 99999-9999         |
| LTV Total: R$ 1.500,00            |
+------------------------------------+
```

