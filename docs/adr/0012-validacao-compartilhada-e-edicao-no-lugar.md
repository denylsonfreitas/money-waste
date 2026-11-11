# ADR 0012 — Validação compartilhada entre criação e edição, e edição no lugar

**Status:** Aceita · **Data:** 2026-11-11 · **História:** MW-005

## Contexto
A MW-005 permite editar e excluir um gasto. A edição precisa ter **exatamente** as mesmas
regras e mensagens da criação (MW-001). A validação morava dentro de `CreateExpense`. A edição
também não pode mudar a ordem de registro, que é o desempate da lista por data (ADR 0007).
A exclusão é definitiva e a tela pede confirmação.

## Decisão
- Rotas: `PUT /api/expenses/{id:guid}` (200 com o gasto, 400, 404) e
  `DELETE /api/expenses/{id:guid}` (204, 404). Id que não é Guid não casa com a rota e dá 404.
- A validação saiu de `CreateExpense` para `ExpenseRequest.Validate(TimeProvider)`, usada pelo
  `POST` e pelo `PUT`. Ela devolve os erros por campo e a data efetiva. `CreateExpenseRequest`
  virou `ExpenseRequest`. As mensagens são constantes do próprio `ExpenseRequest`.
- Sem `date` na edição vale hoje, como na criação.
- `ExpenseStore.Update` troca o gasto **no mesmo índice** da lista. `Remove` apaga por id.
- No front, o título "Novo gasto"/"Editar gasto" passou para dentro do `ExpenseForm`. O `App`
  centraliza o recarregamento de total, categorias e lista em `refreshMonth()`. A confirmação
  da exclusão usa `window.confirm`.
- Sem dependência nova.

## Consequências
- Criação e edição não têm como divergir em regra ou mensagem: o código é um só. Mudanças da
  MW-009 valem para os dois.
- A validação roda antes da busca do gasto: corpo inválido com id inexistente dá 400, não 404.
- Como a posição na lista não muda, a ordem de registro se mantém sem campo extra. Isso
  depende do store em lista; a persistência (MW-007) vai precisar guardar essa ordem.
- A regra "sem data vale hoje" na edição pode trocar a data de um gasto antigo se o campo for
  apagado. Fica como candidato à MW-009.
- `window.confirm` é simples e testável com `spyOn`, mas não é estilizável.
