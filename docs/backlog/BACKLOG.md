# Backlog — Money Waste

Mantido pela PO (Marina). Ordem = prioridade. Status: `Ideia` → `Pronta` → `Em andamento` →
`Concluída (aguardando merge)` → `Entregue`.

| ID | História | Status |
|---|---|---|
| MW-001 | [Registrar um gasto (valor, descrição, categoria, data)](stories/MW-001-registrar-gasto.md) | Entregue |
| MW-002 | [Listar os gastos do mês atual](stories/MW-002-listar-gastos-mes.md) | Entregue |
| MW-003 | [Ver o total gasto no mês](stories/MW-003-total-gasto-mes.md) | Entregue |
| MW-004 | [Ver o total por categoria](stories/MW-004-total-por-categoria.md) | Entregue |
| MW-005 | [Editar e excluir um gasto](stories/MW-005-editar-excluir-gasto.md) | Entregue |
| MW-006 | [Comparar o mês atual com o anterior](stories/MW-006-comparar-mes-anterior.md) | Entregue (PR #8, commit `ffb5f6a`) |
| MW-007 | [Persistir os gastos entre reinícios da API](stories/MW-007-persistir-gastos.md) | Entregue (PR #9, commit `2403c48`) |
| MW-012 | Mensagens claras quando o arquivo de dados não pode ser usado (MW-007; daily e revisor no PR #9): sem permissão de leitura/escrita (`UnauthorizedAccessException`), caminho que é pasta ou outro erro de disco (`IOException`) e `Storage:DataFile` vazio passam a sair com mensagem em português, como já acontece com o arquivo ilegível. Duas instâncias da API no mesmo arquivo hoje fazem a última gravação vencer e apagar o que a outra gravou: decidir se a API recusa subir (arquivo em uso) ou se só avisa no README | Ideia |
| MW-009 | Endurecer a validação do registro de gasto (mensagens em português para JSON malformado e tipo errado, valor máximo, limite da descrição, valores sempre com 2 casas na resposta — `amount`, `total` e totais por categoria —, teste de que POST inválido não altera o total, e o front tratar resposta malformada como `{}` sem mostrar "R$ NaN"). Inclui também, para a **edição** (QA e daily da MW-005): data apagada no formulário de edição não pode virar "hoje" sem aviso — exigir a data ao editar ou manter a data original; e teste de valor negativo na edição | Ideia |
| MW-010 | Acabamento de editar/excluir (MW-005; QA, daily e revisor no PR #7): ao excluir o gasto que está em edição, o formulário volta a "Novo gasto"; a mensagem "Não foi possível excluir o gasto." some quando a lista recarrega; o botão "Excluir" fica desabilitado enquanto o pedido de exclusão não volta (sem duplo DELETE); ao clicar "Editar" no celular, a tela rola até o formulário; no modo de edição o valor aparece com 2 casas (45,90, não 45.9) | Ideia |
| MW-011 | Uma fonte só para a seção do total (MW-006; QA, daily e revisor no PR #8): hoje a linha "Total do mês" vem do `GET /total` e a frase de comparação vem da `difference` do `GET /month-comparison`; se um dos pedidos falhar ou atrasar, a tela pode mostrar um total e uma diferença que não fecham entre si. A seção do total passa a usar uma fonte só (decisão técnica do Dev), sem mudar os textos da tela | Ideia |
| MW-008 | Destacar o "desperdício do mês" (categoria que mais cresceu) | Ideia |

Histórias detalhadas ficam em `docs/backlog/stories/`. MW-008 a MW-012 são pós-MVP.
O MVP (MW-001 a MW-007) foi entregue em 10/11/2026; o time está de férias.

## Débitos técnicos (sem história própria)
Itens pequenos, sem comportamento visível ao usuário. O Dev pode resolver junto de qualquer
história que mexa no mesmo arquivo, em commit `chore:` separado.

- **Padrão carregando/erro/`reload()` repetido** nos componentes da lista, do total e dos
  totais por categoria (QA e revisor na MW-003/MW-004; daily de 10/11/2026). Extrair num PR
  `chore:` próprio, sem misturar com história.
- **Quatro `GET` depois de cada registro/edição/exclusão** (total, comparação, categorias e
  lista; dailies de 10/11/2026, QA da MW-006): aceitável agora; só observar. Reavaliar se ficar
  lento. A MW-011 pode reduzir para três.
- **Renomear o tipo do front `CreateExpenseRequest` para `ExpenseRequest`** (revisor no PR #7):
  hoje ele é usado na criação e na edição, como o `ExpenseRequest` da API.
- **Adicionar o `GET /api/expenses/month-comparison` ao `MoneyWaste.Api.http`** (daily da
  MW-006, revisor no PR #8): o endpoint já está no `docs/api.md`, falta no arquivo de requisições.
- **Teste de sucesso seguido de falha no `reload()`** da comparação (MW-006) e do total (MW-003)
  (QA da MW-006, revisor no PR #8): o valor já apareceu, o `reload()` seguinte falha, e a tela
  troca o valor pela mensagem de erro (não fica o valor velho). O comportamento já é esse; falta
  o teste que o prende.
- **Durabilidade da gravação do arquivo de dados** (revisor no PR #9): fazer `fsync`
  (`Flush(flushToDisk: true)`) no temporário antes do `File.Move`, para um gasto aceito não se
  perder numa queda de energia.
- **Criar o arquivo de dados com permissão 0600** (revisor no PR #9): no Linux/macOS, só o
  dono lê e escreve os gastos.
- **Acentos gravados escapados no arquivo** (daily da MW-007): o JSON guarda `ç` em vez
  de `ç`. Não afeta a API; gravar legível (encoder sem escape de não-ASCII) facilita abrir o
  arquivo à mão.
- **Teste de falha de gravação** (daily da MW-007): se gravar o arquivo falhar, a API responde
  500 e a lista não muda. O comportamento existe; falta o teste automatizado que o prende.
- **Ajustar dois testes de persistência** (revisor no PR #9): o
  `DefaultDataFile_IsInUserLocalApplicationData` é quase tautológico (reproduz o cálculo do
  código); e o teste do critério 10 (arquivo ilegível impede a subida) deve afirmar
  `InvalidOperationException`, não só que lançou alguma exceção.

## Pendências antes de qualquer deploy
- **Fuso horário servidor x navegador** (QA na MW-002 e MW-003; revisor no PR #4): o "hoje"
  da API é o do servidor e o do formulário é o do navegador. Afeta lista, total e totais por
  categoria (e a comparação com o mês anterior, MW-006). Fora do MVP local; decidir antes de
  publicar o app.
