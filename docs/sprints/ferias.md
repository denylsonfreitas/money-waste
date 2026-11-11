# Férias — MVP entregue

**Data:** 10/11/2026 (America/Bahia) · **Versão:** `v0.1.0`

O time de agentes entregou o MVP do Money Waste em dois dias de turno (09 e 10/11/2026) e
entra de férias. Quem tira o time de férias é o stakeholder. Recomendação: pausar a tarefa
agendada enquanto isso.

Para testar: README, seção **"Como testar o MVP"**. Notas da versão: `CHANGELOG.md`, `v0.1.0`.

## O que foi entregue

| ID | História | PR |
|---|---|---|
| MW-001 | Registrar um gasto | #1 |
| MW-002 | Listar os gastos do mês atual | #2 |
| MW-003 | Ver o total gasto no mês | #4 |
| MW-004 | Ver o total por categoria | #5 |
| MW-005 | Editar e excluir um gasto | #7 |
| MW-006 | Comparar o mês atual com o anterior | #8 |
| MW-007 | Persistir os gastos entre reinícios da API (arquivo JSON local) | #9 |

## Números do projeto

| Item | Número |
|---|---|
| Histórias do MVP entregues | 7 de 7 (nenhuma dividida) |
| PRs mergeados | 9 (7 de história, 2 de processo: #3 e #6) + este PR de férias |
| Reprovações da QA | 0 (a MW-001 foi aprovada com pendência: os testes .NET ainda não tinham rodado no CI) |
| Reprovações do revisor | 3, todas em PRs de processo (2 no #3, 1 no #6); 0 em PRs de história |
| ADRs | 14 (a 0002 foi substituída pela 0014) |
| Testes no fim do MVP | 78 .NET (xUnit) e 92 web (Jasmine) |
| Histórias pós-MVP no backlog | MW-008 a MW-012, mais débitos técnicos |

O revisor só entrou no fluxo a partir do PR #3: o PR #1 foi mergeado sem revisão formal e o PR #2 recebeu a revisão só depois do merge.

## O que o time sugere melhorar no processo

1. **Ambiente com o SDK .NET.** Nenhuma sessão conseguiu rodar `dotnet test` nem subir a API:
   o `scripts/check.sh` sempre parou na primeira etapa, e a evidência da API veio só do CI e da
   leitura do código. Ter o SDK (ou um cache do NuGet) na sessão permitiria que a QA testasse a
   API de verdade, inclusive o reinício da MW-007.
2. **Documentação antes da QA.** Em todas as histórias o critério de documentação ficou
   "pendente — Tech Writer", porque o Leo só entra depois da Bia. Isso contraria a regra da QA
   de não aprovar critério sem evidência. Vale ou tirar a documentação dos critérios de aceite
   (e deixá-la como gate do revisor) ou chamar o Tech Writer antes da QA.
3. **Tamanho dos PRs.** A MW-005 ficou em ~830 linhas (≈300 de produção). O limite de ~300
   linhas poderia contar só produção, de forma explícita, ou a PO poderia dividir histórias
   como "editar e excluir" já no refinamento.
4. **Mesma lista de sugestões em três lugares.** Observações da QA, do revisor e da daily se
   repetem e a PO precisa consolidar. Um único lugar para "sugestões não bloqueantes" (o
   backlog) reduziria o trabalho.
5. **Teste manual pelo stakeholder.** Como nenhum agente subiu o app, o roteiro do README
   saiu da leitura do código. O teste do stakeholder é a primeira execução real ponta a ponta.

## Para o stakeholder

- Testar o MVP pelo roteiro do README, em especial o reinício da API (persistência).
- Decidir a prioridade pós-MVP: MW-008 a MW-012 e os débitos técnicos no backlog.
- Ao voltar o time, mudar o **Status** em `docs/team/escala.md` para `Trabalhando`.
