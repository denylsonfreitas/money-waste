# MW-005 — Editar e excluir um gasto

**Status:** Em andamento
**Sprint:** 1
**Prioridade:** 5

## História
**Como** pessoa que recebe salário e quer entender para onde o dinheiro vai,
**quero** corrigir ou apagar um gasto que registrei errado,
**para** que a lista, o total do mês e os totais por categoria mostrem a verdade, sem eu ter
que conviver com um valor digitado errado.

## Regras de produto
- Só dá para editar ou excluir gastos que aparecem na lista **"Gastos do mês"** (MW-002). Não
  há tela para buscar gastos de outros meses.
- **Editar** altera os mesmos campos do registro: valor, descrição, categoria e data, com
  **exatamente as mesmas regras e mensagens de validação da MW-001**. O identificador não muda.
- Editar **não muda a ordem de registro**: no desempate por data (MW-002), o gasto continua
  na posição em que foi registrado originalmente.
- Se a data editada cair em outro mês, o gasto **sai** da lista, do total e dos totais por
  categoria do mês atual (não é apagado; só não pertence mais a este mês).
- **Excluir** apaga o gasto de vez (sem lixeira, sem desfazer). Por isso, o app **pede
  confirmação** antes: `Excluir o gasto "Almoço — R$ 45,90"?`.
- Na tela, cada item da lista ganha dois botões: **"Editar"** e **"Excluir"**.
- "Editar" **reaproveita o formulário** do topo da tela: ele é preenchido com os dados do
  gasto, o título passa a ser **"Editar gasto"**, o botão principal vira **"Salvar alterações"**
  e aparece um botão **"Cancelar"**. Salvar ou cancelar volta o formulário ao modo
  "Novo gasto", limpo e com a data de hoje.
- Depois de editar ou excluir, a lista, o "Total do mês" e os "Gastos por categoria" se
  atualizam **sem recarregar a página**.

## Critérios de aceite

### API (editar)
1. **Dado** um gasto existente de R$ 45,90, "Almoço", Alimentação, 05/11/2026,
   **quando** envio para ele valor 50,00, descrição "Almoço de domingo", categoria Lazer e data
   06/11/2026,
   **então** a API responde **200 OK** com o gasto atualizado, com o **mesmo identificador**, e
   a listagem do mês passa a mostrar os dados novos.
2. **Dado** um gasto existente,
   **quando** envio uma edição com valor 0, valor com 3 casas decimais, descrição só com
   espaços, categoria fora da lista ou data inválida,
   **então** a API responde **400** com as mesmas mensagens em português da criação (MW-001)
   e o gasto continua **exatamente** como estava.
3. **Dado** um identificador que não corresponde a nenhum gasto,
   **quando** envio uma edição válida para ele,
   **então** a API responde **404 Not Found** e nenhum gasto é criado.
4. **Dado** que hoje é 15/11/2026 e existem gastos de R$ 100,00 (Moradia) e R$ 10,00 (Lazer)
   no mês,
   **quando** edito o gasto de Moradia mudando a data para 31/10/2026,
   **então** a listagem do mês traz só o gasto de Lazer, o total do mês é **10,00** e os totais
   por categoria têm só Lazer 10,00.
5. **Dado** dois gastos com a mesma data registrados em sequência ("Primeiro" e depois
   "Segundo"),
   **quando** edito a descrição de "Primeiro" para "Primeiro corrigido",
   **então** a listagem continua com "Segundo" antes de "Primeiro corrigido".

### API (excluir)
6. **Dado** gastos no mês de R$ 45,90 e R$ 12,50,
   **quando** excluo o de R$ 45,90,
   **então** a API responde **204 No Content**, a listagem do mês não traz mais esse gasto e o
   total do mês passa a ser **12,50**.
7. **Dado** um identificador que não corresponde a nenhum gasto (inclusive um que já foi
   excluído),
   **quando** peço para excluí-lo,
   **então** a API responde **404 Not Found** e os outros gastos não são afetados.
8. **Dado** que editar e excluir existem na API,
   **quando** consulto `docs/api.md`,
   **então** os dois estão descritos, com exemplo de requisição e as respostas de sucesso,
   400 (só editar) e 404.

### Front (editar)
9. **Dado** que a lista mostra o gasto "Almoço — R$ 45,90" (Alimentação, 05/11/2026),
   **quando** clico em "Editar" nesse item,
   **então** o formulário mostra o título "Editar gasto", os campos preenchidos com 45,90,
   "Almoço", Alimentação e 05/11/2026, o botão "Salvar alterações" e o botão "Cancelar".
10. **Dado** o formulário em modo "Editar gasto",
    **quando** mudo o valor para 50,00 e clico em "Salvar alterações",
    **então** vejo "Gasto atualizado: Almoço — R$ 50,00", a lista, o total do mês e os gastos
    por categoria mostram o valor novo sem recarregar a página, e o formulário volta a
    "Novo gasto", limpo, com a data de hoje.
11. **Dado** o formulário em modo "Editar gasto" com campos alterados,
    **quando** clico em "Cancelar",
    **então** nada é enviado à API, o gasto continua como estava na lista e o formulário volta
    a "Novo gasto", limpo, com a data de hoje.
12. **Dado** o formulário em modo "Editar gasto",
    **quando** a API responde com erro (400, 404 ou falha de conexão) ao salvar,
    **então** vejo "Não foi possível salvar as alterações." e o formulário continua em modo
    "Editar gasto" com os dados que eu digitei.

### Front (excluir)
13. **Dado** que a lista mostra o gasto "Almoço — R$ 45,90",
    **quando** clico em "Excluir" e confirmo,
    **então** o gasto some da lista, e o total do mês e os gastos por categoria se atualizam
    sem recarregar a página.
14. **Dado** que a lista mostra o gasto "Almoço — R$ 45,90",
    **quando** clico em "Excluir" e **não** confirmo,
    **então** nada é enviado à API e o gasto continua na lista.
15. **Dado** que confirmei a exclusão de um gasto,
    **quando** a API responde com erro (404 ou falha de conexão),
    **então** vejo "Não foi possível excluir o gasto." e o resto da tela continua funcionando.

## Fora de escopo
- **Desfazer** exclusão, lixeira ou histórico de alterações.
- Excluir ou editar **vários gastos de uma vez**.
- Editar ou excluir gastos de **outros meses** (não há tela para eles; a API aceita qualquer
  identificador existente, mas a tela só mostra o mês atual).
- Edição "inline" na linha da lista, modal ou tela separada de edição.
- Modal de confirmação personalizado: a confirmação nativa do navegador basta.
- Persistência entre reinícios (MW-007).
- Endurecer a validação (mensagens para JSON malformado, valor máximo, limite da descrição,
  2 casas fixas na resposta): é a **MW-009**, também para a edição.
- Fuso horário servidor x navegador: segue a regra atual. Pendência antes de qualquer deploy.

## Notas de produto
- Valores sempre em BRL; na tela, 2 casas com vírgula (ex.: R$ 1.234,56). Datas em dd/mm/aaaa.
- Mensagens ao usuário em português. Categorias sempre pelo rótulo em português.
- **Tamanho do PR:** esta história é a maior do MVP até agora. Se o Dev perceber que não cabe
  num PR revisável (~300 linhas), avise na daily antes de passar para a QA, e a PO divide em
  MW-005a (excluir) e MW-005b (editar).
- Sugestão da QA e do revisor (MW-003, MW-004): o padrão carregando/erro/`reload()` se repete
  em três componentes. **Não** resolver nesta história, para manter o PR pequeno. Ficou como
  débito técnico no backlog.

## Decisões do Dev
- Editar é `PUT /api/expenses/{id:guid}` (200 com o gasto; 400 com as mesmas mensagens da criação; 404) e excluir é `DELETE /api/expenses/{id:guid}` (204; 404). Identificador que não é Guid não casa com a rota e também dá 404. A validação saiu de `CreateExpense` para `ExpenseRequest.Validate`, usada pela criação e pela edição (o `CreateExpenseRequest` virou `ExpenseRequest`); sem data na edição vale hoje, como na criação. O `ExpenseStore.Update` troca o gasto na mesma posição da lista, o que preserva a ordem de registro. No front, o título "Novo gasto"/"Editar gasto" passou para dentro do `ExpenseForm` e o `App` centraliza o recarregamento em `refreshMonth()`; a confirmação de exclusão usa `window.confirm`. Sem dependência nova.
