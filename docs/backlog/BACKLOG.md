# Backlog — Money Waste

Mantido pela PO (Marina). Ordem = prioridade. Status: `Ideia` → `Pronta` → `Em andamento` →
`Concluída (aguardando merge)` → `Entregue`.

| ID | História | Status |
|---|---|---|
| MW-001 | [Registrar um gasto (valor, descrição, categoria, data)](stories/MW-001-registrar-gasto.md) | Entregue |
| MW-002 | [Listar os gastos do mês atual](stories/MW-002-listar-gastos-mes.md) | Entregue |
| MW-003 | [Ver o total gasto no mês](stories/MW-003-total-gasto-mes.md) | Entregue |
| MW-004 | [Ver o total por categoria](stories/MW-004-total-por-categoria.md) | Em andamento |
| MW-009 | Endurecer a validação do registro de gasto (mensagens em português para JSON malformado e tipo errado, valor máximo, limite da descrição, valores sempre com 2 casas na resposta — `amount`, `total` e totais por categoria —, teste de que POST inválido não altera o total, e o front tratar resposta malformada como `{}` sem mostrar "R$ NaN") | Ideia |
| MW-005 | Editar e excluir um gasto | Ideia |
| MW-006 | Comparar o mês atual com o anterior | Ideia |
| MW-007 | Persistir os gastos entre reinícios da API | Ideia |
| MW-008 | Destacar o "desperdício do mês" (categoria que mais cresceu) | Ideia |

Histórias detalhadas ficam em `docs/backlog/stories/`.

## Débitos técnicos (sem história própria)
Itens pequenos, sem comportamento visível ao usuário. O Dev pode resolver junto de qualquer
história que mexa no mesmo arquivo, em commit `chore:` separado.

Nenhum no momento.

## Pendências antes de qualquer deploy
- **Fuso horário servidor x navegador** (QA na MW-002 e MW-003; revisor no PR #4): o "hoje"
  da API é o do servidor e o do formulário é o do navegador. Afeta lista, total e totais por
  categoria. Fora do MVP local; decidir antes de publicar o app.
