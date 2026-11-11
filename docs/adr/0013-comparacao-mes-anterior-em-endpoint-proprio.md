# ADR 0013 — Comparação com o mês anterior em endpoint próprio

**Status:** Aceita · **Data:** 2026-11-11 · **História:** MW-006

## Contexto
A MW-006 mostra o total do mês anterior e quanto o mês atual está gastando a mais ou a menos.
A história pede que a API calcule (mesma fonte de verdade das ADRs 0006 e 0009) e que o total
atual da comparação seja igual ao "Total do mês" da MW-003. Em janeiro, o mês anterior é
dezembro do ano anterior.

## Decisão
- Endpoint próprio: `GET /api/expenses/month-comparison` devolve
  `{ "currentMonthTotal", "previousMonthTotal", "difference" }`, em `decimal`, com
  `difference` = atual − anterior (`GetMonthComparison.cs`). Os endpoints existentes não mudaram.
- `CurrentMonth` ganhou `PreviousMonthExpenses`. Ele usa o mesmo "hoje" do `TimeProvider` com
  `AddMonths(-1)`, o que leva janeiro a dezembro do ano anterior. A regra "dia 1 ao último dia"
  ficou num método privado (`InMonthOf`), usado pelo mês atual e pelo anterior.
- O total atual da comparação vem de `CurrentMonth.Expenses`, o mesmo do `GET /api/expenses/total`.
- No front, o componente `MonthComparison` fica na seção do total, logo abaixo do
  `ExpenseTotal`, e é recarregado pelo `refreshMonth()` do `App`. Em erro, mostra só a
  mensagem própria.
- Sem dependência nova.

## Consequências
- Mês atual e mês anterior usam a mesma regra de calendário, num lugar só.
- Há teste que compara o `currentMonthTotal` com o `GET /api/expenses/total`.
- Depois de cada registro, edição ou exclusão, a tela faz quatro `GET` (total, comparação,
  categorias e lista). Segue em observação no backlog.
- O front usa o "Total do mês" do `/total` e a `difference` do `/month-comparison`. Se um dos
  pedidos falhar ou chegar atrasado, a tela pode mostrar números que não fecham entre si.
  Aceitável no MVP local.
- O padrão carregando/erro/`reload()` agora se repete em quatro componentes (débito técnico já
  registrado).
- Os números preservam a escala do `decimal` (`0`, `150.00`). Formato com 2 casas fixas fica
  para a MW-009.
