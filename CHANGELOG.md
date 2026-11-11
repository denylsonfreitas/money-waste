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
- Editar um gasto (MW-005): `PUT /api/expenses/{id}` com o mesmo corpo, as mesmas regras e as
  mesmas mensagens do `POST`. Responde `200` com o gasto (mesmo `id`), `400` com *problem
  details* ou `404`. A edição mantém a ordem de registro.
- Excluir um gasto (MW-005): `DELETE /api/expenses/{id}` apaga de vez. Responde `204` ou
  `404` (inclusive para gasto já excluído). Nos dois endpoints, `id` que não é Guid dá `404`.
- Botões "Editar" e "Excluir" em cada item de "Gastos do mês". "Editar" reaproveita o
  formulário do topo ("Editar gasto", "Salvar alterações", "Cancelar") e confirma com
  "Gasto atualizado: <descrição> — R$ <valor>". "Excluir" pede confirmação nativa
  (`Excluir o gasto "Almoço — R$ 45,90"?`). Erros: "Não foi possível salvar as alterações." e
  "Não foi possível excluir o gasto.". Lista, total e categorias atualizam sem recarregar.
- ADR 0012: validação do gasto compartilhada entre criação e edição, e edição no lugar.
- Comparar com o mês anterior (MW-006): `GET /api/expenses/month-comparison` devolve
  `{"currentMonthTotal", "previousMonthTotal", "difference"}`, com diferença = atual − anterior.
  O mês anterior é o mês de calendário inteiro antes do atual (em janeiro, dezembro do ano
  anterior). O total atual é o mesmo do `GET /api/expenses/total`. Sem gastos, `200` com tudo `0`.
- Na seção do total, logo abaixo de "Total do mês", as linhas "Mês anterior: R$ 100,00" e
  "R$ 50,00 a mais que no mês anterior." ("a menos", com valor sem sinal, ou "Igual ao mês
  anterior."). Atualizam depois de registrar, editar ou excluir. Se a API falhar, mostra
  "Não foi possível carregar a comparação com o mês anterior." no lugar das duas linhas.
- ADR 0013: comparação com o mês anterior em endpoint próprio.
- Gastos guardados entre reinícios (MW-007): registros, edições e exclusões aceitos ficam num
  arquivo JSON local, com o mesmo `id`, valores exatos em centavos e a ordem de registro. Local
  padrão `~/.local/share/MoneyWaste/expenses.json` (Linux) ou
  `%LOCALAPPDATA%\MoneyWaste\expenses.json` (Windows), trocável por `Storage:DataFile`
  (`Storage__DataFile`). Sem arquivo, a API começa vazia. Para começar do zero, apague o arquivo.
- Seção "Onde ficam os dados" no README.
- ADR 0014: gastos num arquivo JSON local; substitui a ADR 0002.

### Alterado
- `ExpenseStore` trocou o `ConcurrentDictionary` por `List` com `lock`, para guardar a ordem
  de registro. O contrato do `POST /api/expenses` não mudou.
- `launchUrl` do `launchSettings.json` aponta para `api/health` (antes, `weatherforecast`
  do template).
- Processo do time (ADR 0008): turno das 18h à meia-noite, no máximo 2 histórias novas por
  dia, novo agente revisor (Rafa) que aprova e faz o merge, e férias quando o MVP
  (MW-001 a MW-007) estiver pronto.
- Processo do time (ADR 0011): a cota de 2 histórias por dia foi removida. O time emenda uma
  história na outra enquanto for horário de turno, até o limite de uso do plano do Claude. A
  trava de turno passou a cobrir o intervalo entre uma história e a próxima.
- A regra de "mês atual" saiu de `ListCurrentMonthExpenses` para `CurrentMonth.Expenses`, usada
  pela lista e pelo total. O comportamento do `GET /api/expenses` não mudou.
- `ExpenseCategories` ganhou a lista ordenada `Ordered`; `All` passou a ser derivado dela.
  As categorias aceitas no `POST /api/expenses` não mudaram.
- A validação do gasto saiu de `CreateExpense` para `ExpenseRequest.Validate`, usada pelo
  `POST` e pelo `PUT`. `CreateExpenseRequest` virou `ExpenseRequest`. O contrato do
  `POST /api/expenses` não mudou.
- No front, o título "Novo gasto" saiu do `app.html` para dentro do `ExpenseForm`, e o `App`
  recarrega total, categorias e lista num método só (`refreshMonth()`).
- `CurrentMonth` ganhou `PreviousMonthExpenses`, com a mesma regra de mês (dia 1 ao último
  dia) do `Expenses`. O comportamento da lista, do total e das categorias não mudou.
- O `refreshMonth()` do `App` também recarrega a comparação: agora são quatro `GET` depois de
  cada registro, edição ou exclusão.
- `ExpenseStore` grava o arquivo inteiro (temporário + `File.Move`, sob o mesmo `lock`) antes de
  aplicar cada mudança; se a gravação falhar, o pedido dá `500` e nada muda. O `Program.cs`
  carrega os gastos logo na subida. Endpoints, respostas e front não mudaram.
- Com o arquivo de dados ilegível, a API não sobe: loga em português (`Critical`) o caminho do
  arquivo e não o altera.
- `.gitignore` ignora `expenses.json` e `expenses.json.tmp`.
- Os testes de integração usam um arquivo de dados temporário por host (`TempDataFile`); nenhum
  teste grava no local padrão.

### Removido
- Gastos só em memória (ADR 0002, substituída pela ADR 0014): eles não somem mais ao reiniciar.

### Observações
- Rode uma API só por arquivo de dados: com duas, a última que grava apaga as mudanças da outra.
- `Storage:DataFile` relativo vale a partir do diretório de trabalho do processo. Um nome que não
  seja `expenses.json` dentro do repositório não fica protegido pelo `.gitignore`.
- Arquivo sem permissão de leitura, caminho que é pasta ou `Storage:DataFile` vazio impedem a
  subida com mensagem do .NET em inglês, não a mensagem em português.
- JSON válido mas incompleto (editado à mão) é carregado com valores padrão; o arquivo não é
  validado além disso. O arquivo escapa acentos (`ç`).
- O mês atual da lista vem da data do servidor; a data do formulário vem do navegador. Com
  fusos diferentes, perto da virada do mês, um gasto pode não aparecer na lista (nem no total).
- O `total` não sai com 2 casas fixas (`0`, `0.30`, `158.40`), igual ao `amount`. Vale também
  para o `total` de cada categoria.
- Na edição, sem `date` vale a data de hoje. Se a pessoa apagar o campo de data e salvar, o
  gasto passa a ter a data de hoje (candidato à MW-009).
- A mensagem "Não foi possível excluir o gasto." só some na próxima tentativa de excluir.
  Excluir o gasto que está em edição deixa o formulário em "Editar gasto"; salvar dá
  "Não foi possível salvar as alterações." até clicar "Cancelar".
- Na tela, "Total do mês" vem do `GET /total` e a frase de comparação vem da `difference` do
  `GET /month-comparison` (o `currentMonthTotal` dela não é usado pelo front). Hoje os dois
  sempre batem; se um pedido falhar ou atrasar, podem não fechar entre si.
- A comparação herda a pendência de fuso horário servidor x navegador.
