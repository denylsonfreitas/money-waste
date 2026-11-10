# ADR 0003 — Contrato da API de gastos: categorias em código e erros em *problem details*

**Status:** Aceita · **Data:** 2026-11-09 · **História:** MW-001

## Contexto
A história define 8 categorias fixas com rótulos em português e deixa para o Dev como
representá-las. O CLAUDE.md pede identificadores em inglês e mensagens ao usuário em português.
Os erros de validação precisam de mensagem em português por campo.

## Decisão
- **Categorias** trafegam como códigos em inglês, minúsculos: `food`, `transport`, `housing`,
  `health`, `leisure`, `education`, `shopping`, `other`. A comparação é exata (`StringComparer.Ordinal`):
  `"Food"`, `" food"` ou `"Alimentação"` são inválidos. Os rótulos em português existem só no
  front (`web/src/app/expenses/expense.model.ts`).
- **Erros de validação** usam `Results.ValidationProblem` (*problem details*, RFC 9110):
  `status` 400, `title` "Dados do gasto inválidos." e `errors` com as mensagens em português por campo
  (`amount`, `description`, `category`, `date`).

## Consequências
- Mudar um rótulo não quebra o contrato nem dados gravados.
- Clientes precisam saber os códigos; a tabela está em `docs/api.md`.
- O front junta as mensagens de `errors` e mostra ao usuário.
- JSON malformado ou com tipo errado é rejeitado pelo ASP.NET antes da validação e volta 400
  **sem** *problem details* (corpo vazio em Production). Ponto aberto no relatório do QA.
