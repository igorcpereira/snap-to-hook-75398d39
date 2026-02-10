

# Remover toasts de erro repetidos

## O que muda

Remover os toasts que aparecem quando a ficha tem erro, mantendo apenas o banner visual com o botao "Tentar novamente" como unico feedback.

## Detalhes tecnicos

### Arquivo: `src/pages/EditarFicha.tsx`

**1. Remover toast da subscricao realtime (linhas 277-281):**

Manter apenas o `setIsProcessing(false)`, removendo o bloco do toast.

**2. Remover toast do timeout (linhas 310-314):**

Manter o `setIsProcessing(false)` e o update do status, removendo o toast de "Tempo esgotado".

**3. Manter toasts de erro no `handleReprocessar` (linhas 341 e 346):**

Esses sao diferentes -- so aparecem uma vez quando o usuario clica no botao e da erro na chamada. Podem ficar.

### Resumo

| Local | Acao |
|-------|------|
| Subscricao realtime (linha 277-281) | Remover toast |
| Timeout useEffect (linha 310-314) | Remover toast |
| handleReprocessar (linhas 341, 346) | Manter (erro pontual) |

O banner vermelho com o botao "Tentar novamente" continua sendo o feedback principal para o usuario.
