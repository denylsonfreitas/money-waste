# MW-006 — Comparar o mês atual com o anterior

**Status:** Em andamento
**Sprint:** 1
**Prioridade:** 6

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** ver quanto gastei no mês anterior e quanto estou gastando a mais ou a menos agora,
**para** saber de relance se este mês está saindo do normal, sem ter que lembrar do mês passado.

## Regras de produto
- **Mês anterior** é o mês de calendário anterior ao mês atual, pela **data do gasto** e com o
  mesmo "hoje" da MW-002/MW-003. Em janeiro, o mês anterior é **dezembro do ano anterior**.
- O total do mês anterior soma **todos** os gastos do mês anterior inteiro (do dia 1 ao último
  dia), com a mesma soma exata em centavos da MW-003.
- A comparação é **só do total**: total do mês atual x total do mês anterior. Diferença =
  total do mês atual − total do mês anterior.
- Quem calcula é a **API** (mesma fonte de verdade do total, ADR 0006 e 0009). O front só exibe.
- Na tela, logo abaixo da linha **"Total do mês: R$ X"** (MW-003), na mesma seção, aparecem duas
  linhas:
  - **"Mês anterior: R$ 300,00"**
  - Uma frase de comparação, conforme a diferença:
    - maior que zero: **"R$ 50,00 a mais que no mês anterior."**
    - menor que zero: **"R$ 50,00 a menos que no mês anterior."** (valor sem sinal)
    - igual a zero: **"Igual ao mês anterior."**
- Sem gastos no mês anterior, o mês anterior vale **R$ 0,00** e a comparação segue a regra
  acima (não é erro, não some).
- Depois de registrar, editar ou excluir um gasto, a comparação se atualiza **sem recarregar a
  página**, como o total do mês. Isso inclui editar a data de um gasto do mês atual para o mês
  anterior (sai do total atual e entra no anterior).

## Critérios de aceite

### API (comparação)
1. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 100,00 e R$ 50,00 em novembro/2026 e
   de R$ 80,00 e R$ 20,00 em outubro/2026,
   **quando** consulto a comparação com o mês anterior na API,
   **então** a API responde **200 OK** com total do mês atual **150,00**, total do mês anterior
   **100,00** e diferença **50,00**.
2. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 10,00 em 01/10/2026 e R$ 10,00 em
   31/10/2026 (entram), e de R$ 999,00 em 30/09/2026, 15/10/2025 e 01/12/2026 (não entram no mês
   anterior),
   **quando** consulto a comparação,
   **então** o total do mês anterior é exatamente **20,00**.
3. **Dado** que hoje é 10/01/2027 e existe um gasto de R$ 40,00 em 20/12/2026 e nenhum em
   janeiro/2027,
   **quando** consulto a comparação,
   **então** o total do mês anterior é **40,00**, o do mês atual é **0,00** e a diferença é
   **-40,00**.
4. **Dado** que não existe nenhum gasto no mês atual nem no anterior,
   **quando** consulto a comparação,
   **então** a API responde 200 com os dois totais e a diferença iguais a **0,00** (não 404,
   não erro).
5. **Dado** gastos no mês anterior de R$ 0,10 e R$ 0,20,
   **quando** consulto a comparação,
   **então** o total do mês anterior é exatamente **0,30** (sem resíduo de ponto flutuante).
6. **Dado** gastos no mês atual, incluindo um criado sem data,
   **quando** consulto a comparação,
   **então** o total do mês atual dela é igual ao "Total do mês" da MW-003.
7. **Dado** que a comparação existe na API,
   **quando** consulto `docs/api.md`,
   **então** ela está descrita com um exemplo de resposta com gastos nos dois meses e um sem
   gasto nenhum.

### Front (linhas de comparação)
8. **Dado** que o mês atual tem R$ 150,00 e o anterior R$ 100,00,
   **quando** abro o app,
   **então** vejo, logo abaixo de "Total do mês: R$ 150,00", as linhas "Mês anterior: R$ 100,00"
   e "R$ 50,00 a mais que no mês anterior.".
9. **Dado** que o mês atual tem R$ 1.000,00 e o anterior R$ 1.234,56,
   **quando** abro o app,
   **então** vejo "Mês anterior: R$ 1.234,56" e "R$ 234,56 a menos que no mês anterior.".
10. **Dado** que o mês atual e o anterior têm o mesmo total (inclusive os dois R$ 0,00),
    **quando** abro o app,
    **então** vejo "Igual ao mês anterior.".
11. **Dado** que a tela mostra "R$ 50,00 a mais que no mês anterior.",
    **quando** excluo (ou registro, ou edito) um gasto do mês atual de modo que o total atual
    mude,
    **então** a linha de comparação mostra o novo valor sem eu recarregar a página.
12. **Dado** que a API falha ao devolver a comparação (erro ou falha de conexão),
    **quando** abro o app,
    **então** vejo "Não foi possível carregar a comparação com o mês anterior." no lugar das
    duas linhas — **nunca** "Igual ao mês anterior." ou "R$ 0,00", que seriam informação falsa —
    e o formulário, o total do mês, os gastos por categoria e a lista continuam funcionando.

## Fora de escopo
- **Percentual** de variação (ex.: "+50%"), gráficos, setas ou cores de alerta.
- Comparação **por categoria** e destaque da categoria que mais cresceu: é a **MW-008**.
- Comparar "até o mesmo dia" do mês anterior (proporcional); a comparação é com o mês anterior
  **inteiro**.
- Escolher outros meses, navegar entre meses, listar os gastos do mês anterior.
- Média de vários meses, tendência, previsão de fim de mês.
- Nome do mês na tela (ex.: "Outubro: R$ 100,00"): fica "Mês anterior".
- Persistência entre reinícios (MW-007).
- Mudar o formato dos valores na resposta (2 casas fixas é a **MW-009**).
- Fuso horário servidor x navegador: segue a regra atual. Pendência antes de qualquer deploy.
- Débitos técnicos do backlog (padrão carregando/erro/`reload()`, renomear
  `CreateExpenseRequest`) e o acabamento da MW-005 (**MW-010**): não misturar nesta história.

## Notas de produto
- Valores sempre em BRL; na tela, 2 casas com vírgula e ponto de milhar (ex.: R$ 1.234,56),
  igual ao total. Na frase de comparação, o valor aparece **sem sinal**: "a mais"/"a menos" já
  diz a direção.
- "Mês atual", "mês anterior" e "hoje" seguem a regra da MW-002/MW-003 (o "hoje" é o do servidor).
- Mensagens ao usuário em português.
- **Tamanho do PR:** a história deve caber em ~300 linhas de produção. Se o Dev perceber que não
  cabe, avise na daily antes da QA, e a PO divide em MW-006a (API) e MW-006b (tela).

## Decisões do Dev
- A comparação é um endpoint próprio, `GET /api/expenses/month-comparison`, que responde 200 com `{ currentMonthTotal, previousMonthTotal, difference }` (diferença = atual − anterior, em `decimal`), na linha das ADRs 0009/0010. O `CurrentMonth` ganhou `PreviousMonthExpenses` (mesmo "hoje" do `TimeProvider`, `AddMonths(-1)`, o que leva janeiro a dezembro do ano anterior), então o total atual da comparação usa exatamente os mesmos gastos do `GET /api/expenses/total`. No front, o novo componente `MonthComparison` fica na seção do total, logo abaixo do `ExpenseTotal`, e é recarregado pelo `refreshMonth()` do `App`; em erro mostra só a mensagem própria. Sem dependência nova.
