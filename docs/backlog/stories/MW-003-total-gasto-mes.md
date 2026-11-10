# MW-003 — Ver o total gasto no mês

**Status:** Em andamento
**Sprint:** 1
**Prioridade:** 3

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** ver quanto já gastei no total no mês atual,
**para** saber de relance quanto do salário já saiu sem precisar somar a lista de cabeça.

## Regras de produto
- O **total do mês** é a soma dos valores de **exatamente os mesmos gastos** que aparecem na
  lista "Gastos do mês" (MW-002): mesma regra de mês atual, pela **data do gasto**.
- Quem decide o total é a **API** (mesma fonte de verdade da lista, ver ADR 0006). O front só
  exibe o número que recebe.
- A soma é exata em centavos: nada de erro de arredondamento (ex.: R$ 0,10 + R$ 0,20 = R$ 0,30).
- Sem gastos no mês, o total é **R$ 0,00** (não é erro).
- Na tela, o total aparece como **"Total do mês: R$ 1.234,56"**, **entre o formulário "Novo
  gasto" e a lista** de gastos do mês.

## Critérios de aceite

### API (total)
1. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 45,90 (01/11/2026), R$ 12,50
   (15/11/2026) e R$ 100,00 (30/11/2026),
   **quando** consulto o total do mês atual na API,
   **então** a API responde **200 OK** com o total **158,40**.
2. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 10,00 (15/11/2026), R$ 999,00
   (31/10/2026), R$ 999,00 (01/12/2026) e R$ 999,00 (15/11/2025),
   **quando** consulto o total do mês atual,
   **então** o total é **10,00** (gastos de outros meses e do mesmo mês em outro ano não entram).
3. **Dado** que não existe nenhum gasto no mês atual,
   **quando** consulto o total do mês atual,
   **então** a API responde 200 com o total **0** (não 404, não erro).
4. **Dado** gastos no mês atual de R$ 0,10 e R$ 0,20,
   **quando** consulto o total,
   **então** o total é exatamente **0,30** (sem resíduo de ponto flutuante, como 0.30000000000000004).
5. **Dado** que acabei de criar um gasto válido de R$ 25,00 com data no mês atual, e o total
   antes era 158,40,
   **quando** consulto o total de novo,
   **então** ele é **183,40**.
6. **Dado** que o total do mês existe na API,
   **quando** consulto `docs/api.md`,
   **então** ele está descrito com um exemplo de resposta com gastos e um exemplo sem gastos (total 0).

### Front (total na tela)
7. **Dado** que existem gastos no mês atual somando R$ 1.234,56,
   **quando** abro o app,
   **então** vejo "Total do mês: R$ 1.234,56" entre o formulário e a lista de gastos do mês.
8. **Dado** que não existe nenhum gasto no mês atual,
   **quando** abro o app,
   **então** vejo "Total do mês: R$ 0,00".
9. **Dado** que a tela está aberta com total de R$ 45,90,
   **quando** registro um gasto válido de R$ 12,50 com data no mês atual,
   **então** o total passa a mostrar "Total do mês: R$ 58,40" sem eu recarregar a página.
10. **Dado** que a tela está aberta com total de R$ 45,90,
    **quando** registro um gasto válido com data em outro mês,
    **então** vejo a confirmação da MW-001 normalmente e o total continua "Total do mês: R$ 45,90".
11. **Dado** que a API falha ao devolver o total (erro ou falha de conexão),
    **quando** abro o app,
    **então** vejo "Não foi possível carregar o total do mês." no lugar do total — **nunca**
    "R$ 0,00", que seria uma informação falsa — e o formulário continua funcionando.

## Fora de escopo
- **Total por categoria** — é a **MW-004**.
- Comparação com o mês anterior (MW-006) e destaque de desperdício (MW-008).
- Escolher/navegar para outro mês, total de um período personalizado, média diária, projeção
  para o fim do mês.
- Orçamento/meta mensal ou comparação do total com o salário.
- Mostrar o nome do mês no rótulo (ex.: "Total de novembro"): o rótulo é só "Total do mês".
- Gráficos.
- Mudar o formato de `amount` dos gastos na resposta (2 casas fixas é a **MW-009**).
- Fuso horário servidor x navegador (observação da QA na MW-002): segue a regra atual, em que
  o "hoje" da API é o do servidor. Será tratado antes de qualquer deploy, não nesta história.

## Notas de produto
- Valores sempre em BRL. Na tela, 2 casas decimais com vírgula e ponto de milhar
  (ex.: R$ 1.234,56), igual à lista da MW-002.
- "Mês atual" e "hoje" seguem exatamente a regra da MW-002.
- Mensagens ao usuário em português.

## Decisões do Dev
- Total do mês em endpoint próprio `GET /api/expenses/total` → `{ "total": <decimal> }`; a regra de "mês atual" foi extraída para `CurrentMonth.Expenses` e é usada pela lista e pelo total, garantindo que somam os mesmos gastos. Soma em `decimal` (centavos exatos). Sem dependência nova.
