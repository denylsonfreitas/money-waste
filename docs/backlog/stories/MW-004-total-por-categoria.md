# MW-004 — Ver o total por categoria

**Status:** Em andamento
**Sprint:** 1
**Prioridade:** 4

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** ver quanto gastei em cada categoria no mês atual, da que mais gastei para a que menos gastei,
**para** descobrir de relance em quê o meu dinheiro está indo, sem somar a lista de cabeça.

## Regras de produto
- Os totais por categoria somam **exatamente os mesmos gastos** que aparecem na lista
  "Gastos do mês" (MW-002) e no "Total do mês" (MW-003): mesma regra de mês atual, pela
  **data do gasto**. A soma de todas as categorias é igual ao total do mês.
- Quem calcula é a **API** (mesma fonte de verdade da lista e do total, ver ADR 0006 e 0009).
  O front só exibe o que recebe, na ordem em que recebe.
- **Só aparecem categorias com gasto no mês.** Categoria sem gasto não aparece (nada de
  "Lazer — R$ 0,00").
- **Ordem:** maior total primeiro. Empate: segue a ordem da lista fixa de categorias da MW-001
  (Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Outros).
- Soma exata em centavos, como na MW-003.
- Na tela, uma seção **"Gastos por categoria"**, **entre o "Total do mês" e a lista** de gastos
  do mês. Cada linha mostra o **rótulo em português** e o valor: **"Alimentação — R$ 58,40"**.
- Sem gastos no mês, a seção mostra **"Nenhum gasto neste mês."** (não é erro).

## Critérios de aceite

### API (totais por categoria)
1. **Dado** que hoje é 15/11/2026 e existem gastos no mês de R$ 45,90 (Alimentação),
   R$ 12,50 (Alimentação), R$ 100,00 (Moradia) e R$ 8,00 (Transporte),
   **quando** consulto os totais por categoria do mês atual na API,
   **então** a API responde **200 OK** com exatamente 3 itens, nesta ordem:
   Moradia 100,00; Alimentação 58,40; Transporte 8,00.
2. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 10,00 (Lazer, 15/11/2026) e de
   R$ 999,00 (Lazer) em 31/10/2026, 01/12/2026 e 15/11/2025,
   **quando** consulto os totais por categoria,
   **então** a resposta tem um único item: Lazer **10,00** (outros meses e o mesmo mês em
   outro ano não entram).
3. **Dado** que não existe nenhum gasto no mês atual,
   **quando** consulto os totais por categoria,
   **então** a API responde 200 com uma lista vazia (não 404, não erro).
4. **Dado** gastos no mês de R$ 20,00 (Compras), R$ 20,00 (Saúde) e R$ 20,00 (Transporte),
   **quando** consulto os totais por categoria,
   **então** a ordem é Transporte, Saúde, Compras (empate segue a ordem da lista fixa).
5. **Dado** gastos no mês de R$ 0,10 e R$ 0,20, ambos de Alimentação,
   **quando** consulto os totais por categoria,
   **então** o total de Alimentação é exatamente **0,30** (sem resíduo de ponto flutuante).
6. **Dado** gastos no mês atual em várias categorias (incluindo um gasto criado sem data) e um
   gasto de outro mês,
   **quando** comparo a soma dos totais por categoria com o total do mês (MW-003),
   **então** os dois valores são iguais.
7. **Dado** que os totais por categoria existem na API,
   **quando** consulto `docs/api.md`,
   **então** eles estão descritos com um exemplo de resposta com gastos e um sem gastos.

### Front (seção "Gastos por categoria")
8. **Dado** que existem no mês R$ 100,00 em Moradia e R$ 58,40 em Alimentação,
   **quando** abro o app,
   **então** vejo a seção "Gastos por categoria" entre o "Total do mês" e a lista de gastos,
   com as linhas "Moradia — R$ 100,00" e "Alimentação — R$ 58,40", nesta ordem.
9. **Dado** que não existe nenhum gasto no mês atual,
   **quando** abro o app,
   **então** a seção "Gastos por categoria" mostra "Nenhum gasto neste mês.".
10. **Dado** que a tela está aberta com "Alimentação — R$ 45,90",
    **quando** registro um gasto válido de R$ 12,50 em Alimentação com data no mês atual,
    **então** a linha passa a mostrar "Alimentação — R$ 58,40" sem eu recarregar a página.
11. **Dado** que a API falha ao devolver os totais por categoria (erro ou falha de conexão),
    **quando** abro o app,
    **então** vejo "Não foi possível carregar os gastos por categoria." no lugar das linhas —
    **nunca** "Nenhum gasto neste mês.", que seria informação falsa — e o formulário, o total
    do mês e a lista continuam funcionando.

## Fora de escopo
- **Percentual** de cada categoria sobre o total, barras ou gráficos (pizza, rosca etc.).
- Clicar numa categoria para filtrar a lista de gastos.
- Mostrar categorias sem gasto, com R$ 0,00.
- Escolher/navegar para outro mês; comparação com o mês anterior (MW-006); destaque do
  "desperdício do mês" (MW-008).
- Orçamento/limite por categoria; categorias personalizadas.
- Mudar o formato de `amount` e `total` na resposta (2 casas fixas é a **MW-009**).
- Fuso horário servidor x navegador: segue a regra atual (o "hoje" é o do servidor). Será
  tratado antes de qualquer deploy, não nesta história.

## Notas de produto
- Valores sempre em BRL. Na tela, 2 casas decimais com vírgula e ponto de milhar
  (ex.: R$ 1.234,56), igual ao total e à lista.
- O usuário sempre vê os rótulos em português da MW-001, nunca o código da categoria.
- "Mês atual" e "hoje" seguem exatamente a regra da MW-002/MW-003.
- Mensagens ao usuário em português.
- Sugestão do revisor (Rafa, PR #4), para o Dev avaliar: este é o terceiro componente com o
  mesmo padrão de carregamento/erro/`reload()`; vale reavaliar extrair esse padrão, desde que
  o PR continue pequeno.
