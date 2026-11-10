# MW-002 — Listar os gastos do mês atual

**Status:** Em andamento
**Sprint:** 1
**Prioridade:** 2

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** ver a lista dos gastos que registrei no mês atual,
**para** conferir o que já saiu neste mês sem depender da memória.

## Regras de produto
- **Mês atual** é o mês do calendário da data de hoje (do dia 1 ao último dia do mês).
  Um gasto entra na lista pela **data do gasto**, não pelo momento em que foi registrado.
- Gastos com data em outro mês (anterior ou seguinte) **não** aparecem.
- **Ordem:** data mais recente primeiro. Gastos com a mesma data aparecem do registrado por
  último para o registrado primeiro.
- Cada item mostra: **data** (dd/mm/aaaa), **descrição**, **categoria** (rótulo em português da
  MW-001) e **valor** (R$ no formato brasileiro, ex.: "R$ 1.234,56").
- A lista fica **abaixo do formulário "Novo gasto"**, na mesma tela.

## Critérios de aceite

### API (listagem)
1. **Dado** que hoje é 15/11/2026 e existem gastos com datas 01/11/2026, 15/11/2026 e 30/11/2026,
   **quando** consulto o endpoint de listagem do mês atual,
   **então** a API responde **200 OK** com os três gastos, cada um com identificador, valor,
   descrição, categoria e data.
2. **Dado** que hoje é 15/11/2026 e existem gastos com datas 31/10/2026 e 01/12/2026,
   **quando** consulto o endpoint de listagem,
   **então** nenhum desses gastos é devolvido.
3. **Dado** que hoje é 15/11/2026 e existem gastos com datas 03/11, 10/11 e 07/11,
   **quando** consulto o endpoint de listagem,
   **então** eles vêm na ordem 10/11, 07/11, 03/11.
4. **Dado** dois gastos com a mesma data, registrados em sequência ("Primeiro" e depois "Segundo"),
   **quando** consulto o endpoint de listagem,
   **então** "Segundo" vem antes de "Primeiro".
5. **Dado** que não existe nenhum gasto no mês atual,
   **quando** consulto o endpoint de listagem,
   **então** a API responde 200 com uma lista vazia (não 404).
6. **Dado** que acabei de criar um gasto válido com data no mês atual pelo endpoint de criação,
   **quando** consulto o endpoint de listagem,
   **então** esse gasto aparece com os mesmos dados devolvidos na criação.
7. **Dado** que o endpoint de listagem existe,
   **quando** consulto `docs/api.md`,
   **então** ele está descrito com exemplo de resposta 200 com itens e de resposta com lista vazia.

### Front (lista na tela)
8. **Dado** que existem gastos no mês atual,
   **quando** abro o app,
   **então** vejo, abaixo do formulário, a lista desses gastos na ordem da regra acima, cada item
   com data (dd/mm/aaaa), descrição, rótulo da categoria em português e valor (ex.: "R$ 45,90").
9. **Dado** que não existe nenhum gasto no mês atual,
   **quando** abro o app,
   **então** vejo, no lugar da lista, a mensagem "Nenhum gasto registrado neste mês."
10. **Dado** que a tela está aberta,
    **quando** registro um gasto válido com data no mês atual,
    **então** ele aparece na lista na posição correta, sem eu recarregar a página.
11. **Dado** que a tela está aberta,
    **quando** registro um gasto válido com data em outro mês,
    **então** vejo a confirmação da MW-001 normalmente, mas a lista não passa a mostrar esse gasto.
12. **Dado** que a API falha ao devolver a lista (erro ou falha de conexão),
    **quando** abro o app,
    **então** vejo a mensagem "Não foi possível carregar os gastos do mês." no lugar da lista,
    e o formulário continua funcionando.

## Fora de escopo
- **Total do mês** — é a **MW-003**. Nada de soma, nem na API nem na tela.
- Total por categoria (MW-004) e comparação com o mês anterior (MW-006).
- Escolher/navegar para outro mês, filtros por categoria, busca, paginação.
- Editar ou excluir itens da lista (MW-005).
- Persistência entre reinícios da API (MW-007): a lista some quando a API reinicia, e tudo bem.
- Ajustes de validação e contrato apontados na daily da MW-001 (ver **MW-009**).
- Agrupar a lista por dia, gráficos, ícones de categoria.

## Notas de produto
- Valores sempre em BRL, exibidos com 2 casas decimais e vírgula (ex.: R$ 1.234,56).
- Datas exibidas no formato brasileiro (dd/mm/aaaa).
- "Hoje" segue a mesma regra da MW-001 (o Dev já decidiu como; ver decisões da MW-001).
- Mensagens ao usuário em português.
