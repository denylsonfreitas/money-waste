# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Mantido pelo Tech Writer (Leo).

## [Não lançado]

## [0.1.0] - 2026-11-10 — MVP

Primeira versão utilizável do Money Waste: registrar gastos, ver para onde o dinheiro foi no
mês e comparar com o mês anterior. Os dados ficam num arquivo na sua máquina. Roteiro de teste
em [Como testar o MVP](README.md#-como-testar-o-mvp).

### Adicionado

**O que dá para fazer na tela** (tudo numa página só, `http://localhost:4200`)
- **Registrar um gasto** (MW-001): valor, descrição, categoria (8 fixas: Alimentação,
  Transporte, Moradia, Saúde, Lazer, Educação, Compras, Outros) e data, que vem preenchida com
  hoje. Confirma com "Gasto registrado: <descrição> — R$ <valor>". Erros em português.
- **Ver os gastos do mês atual** (MW-002): seção "Gastos do mês", com data (dd/mm/aaaa),
  descrição, categoria e valor, do mais recente para o mais antigo. Sem gastos: "Nenhum gasto
  registrado neste mês.".
- **Ver o total do mês** (MW-003): "Total do mês: R$ 1.234,56", a soma dos gastos da lista.
- **Ver o total por categoria** (MW-004): seção "Gastos por categoria" ("Alimentação —
  R$ 58,40"), da categoria que mais gastou para a que menos. Só aparecem categorias com gasto.
- **Editar e excluir** (MW-005): botões "Editar" e "Excluir" em cada gasto. "Editar" usa o
  formulário do topo ("Salvar alterações" / "Cancelar"); "Excluir" pede confirmação e apaga
  de vez.
- **Comparar com o mês anterior** (MW-006): abaixo do total, "Mês anterior: R$ 100,00" e
  "R$ 50,00 a mais que no mês anterior." (ou "a menos", ou "Igual ao mês anterior."). O mês
  anterior é o mês de calendário inteiro; em janeiro, compara com dezembro.
- **Gastos guardados entre reinícios** (MW-007): registros, edições e exclusões ficam num
  arquivo JSON local e voltam iguais (mesmo id, mesmos valores, mesma ordem) quando a API
  reinicia. Detalhes em [Onde ficam os dados](README.md#-onde-ficam-os-dados).
- Total, categorias, comparação e lista se atualizam sozinhos depois de registrar, editar ou
  excluir. Se a API falhar, cada seção mostra a própria mensagem de erro (nunca um R$ 0,00
  falso).

**API** (detalhes em [`docs/api.md`](docs/api.md))
- `GET /api/health`.
- `POST /api/expenses` e `PUT /api/expenses/{id}`: mesmo corpo, mesmas regras e mensagens em
  português no formato *problem details* (`400`). Sem `date`, vale hoje (do servidor). `PUT`
  e `DELETE` dão `404` para id inexistente ou que não é Guid.
- `DELETE /api/expenses/{id}`: `204`.
- `GET /api/expenses`: gastos do mês atual, mais recente primeiro; na mesma data, o registrado
  por último primeiro.
- `GET /api/expenses/total`: `{"total": <número>}`, soma exata em `decimal`.
- `GET /api/expenses/totals-by-category`: `[{"category", "total"}]`, maior total primeiro; no
  empate, a ordem fixa das categorias.
- `GET /api/expenses/month-comparison`: `{"currentMonthTotal", "previousMonthTotal",
  "difference"}`, com diferença = atual − anterior.
- Arquivo de dados: padrão `~/.local/share/MoneyWaste/expenses.json` (Linux) ou
  `%LOCALAPPDATA%\MoneyWaste\expenses.json` (Windows); trocável por `Storage:DataFile`
  (`Storage__DataFile`).

**Projeto e processo**
- API .NET 8 (Minimal APIs, xUnit) e front Angular 20 (standalone, signals).
- CI no GitHub Actions com build e testes da API e do front; `scripts/check.sh` local.
- Time de agentes (PO, Dev, QA, Tech Writer, Revisor) e comando `/sprint`.
- ADRs 0001 a 0014 em [`docs/adr/`](docs/adr).

### Alterado
- Processo (ADR 0008): turno das 18h à meia-noite, revisor (Rafa) que aprova e faz o merge, e
  férias quando o MVP estiver pronto.
- Processo (ADR 0011): sem cota diária de histórias; o time emenda uma na outra enquanto for
  horário de turno, até o limite de uso do plano. A trava de turno cobre o intervalo entre
  histórias.
- Internos, sem mudar o comportamento: `ExpenseStore` em `List` com `lock` para guardar a ordem
  de registro (ADR 0007); regra de "mês atual" e "mês anterior" centralizada em `CurrentMonth`;
  validação compartilhada entre criação e edição em `ExpenseRequest.Validate` (ADR 0012);
  `ExpenseCategories.Ordered` como fonte da ordem das categorias; o front recarrega as quatro
  consultas do mês em `refreshMonth()`.
- `launchUrl` do `launchSettings.json` aponta para `api/health`.

### Removido
- Gastos só em memória (ADR 0002, substituída pela ADR 0014): eles não somem mais ao reiniciar.

### Limitações conhecidas
Nenhuma impede o uso do MVP. As de validação estão na MW-009 do
[backlog](docs/backlog/BACKLOG.md).

**Dados**
- Rode **uma API só** por arquivo de dados: com duas, a última que grava apaga as mudanças da
  outra.
- Arquivo ilegível (JSON quebrado): a API não sobe e loga em português o caminho do arquivo,
  sem alterá-lo. Sem permissão de leitura, caminho que é pasta ou `Storage:DataFile` vazio
  também impedem a subida, mas com mensagem do .NET em inglês.
- JSON válido mas incompleto (editado à mão) carrega com valores padrão. O arquivo escapa
  acentos (`\u00e7` no lugar de `ç`).
- `Storage:DataFile` relativo vale a partir do diretório de trabalho. Só `expenses.json` (e
  `expenses.json.tmp`) estão no `.gitignore`.

**Datas e totais**
- O mês atual vem do relógio do servidor; a data do formulário vem do navegador. Com fusos
  diferentes, perto da virada do mês, um gasto pode não aparecer na lista nem no total.
- Na edição, apagar a data e salvar muda o gasto para hoje, sem aviso (MW-009).
- Valores saem sem 2 casas fixas na API (`0`, `0.30`, `158.40`); a tela formata em R$
  normalmente.
- "Total do mês" e a frase de comparação vêm de pedidos diferentes. Hoje sempre batem; se um
  falhar ou atrasar, podem não fechar entre si.

**Tela**
- "Não foi possível excluir o gasto." só some na próxima tentativa de excluir.
- Excluir o gasto que está em edição deixa o formulário em "Editar gasto"; salvar dá "Não foi
  possível salvar as alterações." até clicar "Cancelar".
- A lista só mostra o mês atual: um gasto registrado (ou editado) com data de outro mês some
  da tela, mas continua no arquivo e conta no "Mês anterior" se for do mês passado.

