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

### Alterado
- `ExpenseStore` trocou o `ConcurrentDictionary` por `List` com `lock`, para guardar a ordem
  de registro. O contrato do `POST /api/expenses` não mudou.
- `launchUrl` do `launchSettings.json` aponta para `api/health` (antes, `weatherforecast`
  do template).

### Observações
- Os gastos ficam em memória e somem ao reiniciar a API (persistência é a MW-007).
- O mês atual da lista vem da data do servidor; a data do formulário vem do navegador. Com
  fusos diferentes, perto da virada do mês, um gasto pode não aparecer na lista.
