# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Mantido pelo Tech Writer (Leo).

## [Não lançado]

### Adicionado
- Estrutura inicial: API .NET 8 com `GET /api/health` e front-end Angular 20.
- Time de agentes (PO, Dev, QA, Tech Writer) e comando `/sprint`.
- CI com build e testes para API e web.
- Registrar um gasto (MW-001): `POST /api/expenses` com valor, descrição, categoria e data
  (opcional; sem data, vale hoje). Validação com mensagens em português no formato *problem details*.
- Formulário "Registrar" no front, com as 8 categorias fixas, Data preenchida com hoje,
  confirmação "Gasto registrado: <descrição> — R$ <valor>" e erros em português.
- ADRs 0002 a 0005: armazenamento em memória, contrato da API de gastos, data de hoje via
  `TimeProvider` e URL da API no front.
- Listar os gastos do mês atual (MW-002): `GET /api/expenses` devolve os gastos com data no
  mês de hoje (do servidor), da data mais recente para a mais antiga; na mesma data, o
  registrado por último vem primeiro. Sem gastos, responde `200` com `[]`.
- Seção "Gastos do mês" no front, abaixo do formulário: data (dd/mm/aaaa), descrição,
  categoria em português e valor em R$. Atualiza sozinha depois de cada registro. Mensagens
  "Nenhum gasto registrado neste mês." e "Não foi possível carregar os gastos do mês.".
- ADRs 0006 e 0007: mês atual e ordem definidos pela API; store em lista com ordem de registro.
- Total gasto no mês (MW-003): `GET /api/expenses/total` devolve `{"total": <número>}`, a soma
  exata (em `decimal`) dos mesmos gastos do `GET /api/expenses`. Sem gastos, `200` com
  `{"total":0}`.
- "Total do mês: R$ 1.234,56" no front, entre o formulário e a lista. Atualiza depois de cada
  registro. Se a API falhar, mostra "Não foi possível carregar o total do mês." (nunca R$ 0,00).
- ADR 0009: total do mês em endpoint próprio, com a regra de mês atual compartilhada.
- Total por categoria (MW-004): `GET /api/expenses/totals-by-category` devolve
  `[{"category": "<código>", "total": <número>}]` com os mesmos gastos da lista e do total do
  mês. Só categorias com gasto; maior total primeiro e, no empate, a ordem da lista fixa de
  categorias. Sem gastos, `200` com `[]`.
- Seção "Gastos por categoria" no front, entre o "Total do mês" e a lista: uma linha por
  categoria ("Alimentação — R$ 58,40"), na ordem da API. Atualiza depois de cada registro.
  Mensagens "Nenhum gasto neste mês." e "Não foi possível carregar os gastos por categoria.".
- ADR 0010: totais por categoria em endpoint próprio, com desempate pela ordem fixa das
  categorias.

### Alterado
- `ExpenseStore` trocou o `ConcurrentDictionary` por `List` com `lock`, para guardar a ordem
  de registro. O contrato do `POST /api/expenses` não mudou.
- `launchUrl` do `launchSettings.json` aponta para `api/health` (antes, `weatherforecast`
  do template).
- Processo do time (ADR 0008): turno das 18h à meia-noite, no máximo 2 histórias novas por
  dia, novo agente revisor (Rafa) que aprova e faz o merge, e férias quando o MVP
  (MW-001 a MW-007) estiver pronto.
- Processo do time: a cota de 2 histórias por dia foi removida. O time emenda uma história
  na outra enquanto for horário de turno, até o limite de uso do plano do Claude.
- A regra de "mês atual" saiu de `ListCurrentMonthExpenses` para `CurrentMonth.Expenses`, usada
  pela lista e pelo total. O comportamento do `GET /api/expenses` não mudou.
- `ExpenseCategories` ganhou a lista ordenada `Ordered`; `All` passou a ser derivado dela.
  As categorias aceitas no `POST /api/expenses` não mudaram.

### Observações
- Os gastos ficam em memória e somem ao reiniciar a API (persistência é a MW-007).
- O mês atual da lista vem da data do servidor; a data do formulário vem do navegador. Com
  fusos diferentes, perto da virada do mês, um gasto pode não aparecer na lista (nem no total).
- O `total` não sai com 2 casas fixas (`0`, `0.30`, `158.40`), igual ao `amount`. Vale também
  para o `total` de cada categoria.
