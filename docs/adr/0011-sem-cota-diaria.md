# ADR 0011 — Sem cota diária de histórias

**Status:** Aceita · **Data:** 2026-11-10 · Substitui a parte da cota da [ADR 0008](0008-escala-revisor-e-ferias.md)

## Contexto
No primeiro dia da escala noturna (10/11), o turno das 18h entregou a MW-003 e a MW-004 e
atingiu a cota de 2 histórias. Os turnos das 20h e das 22h encerraram sem trabalhar. O
stakeholder achou que o time usou pouco do plano do Claude e pediu para aproveitar mais.

## Decisão
- **Sem limite fixo de histórias por dia.** O turno emenda uma história na outra enquanto
  for horário de turno (18h à meia-noite, `America/Bahia`).
- O limite real passa a ser o **limite de uso do plano do Claude**. Quando ele acaba, a
  sessão para e o próximo turno retoma o trabalho pela metade.
- Continua **uma história por vez**, com o PR rascunho aberto logo depois da PO.
- **Trava reforçada:** além de PRs abertos atualizados há menos de 90 minutos, conta como
  turno ativo um PR de história (`feat/*`) fechado ou mergeado há menos de 90 minutos. Isso
  cobre a janela entre o merge de uma história e a abertura do PR da próxima, que fica mais
  frequente agora que uma sessão faz várias rodadas por noite.

## Consequências
- O MVP deve sair mais rápido, em menos noites.
- O consumo do plano do Claude fica bem maior nas noites de trabalho. Se o stakeholder
  precisar do Claude à noite, pode pausar a tarefa agendada.
- Depois de um merge, os disparos seguintes podem esperar até 90 minutos para começar. É o
  preço de não ter duas sessões trabalhando na mesma história.
