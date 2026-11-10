# ADR 0001 — Desenvolvimento por um time de agentes no Claude Code

**Status:** Aceita · **Data:** 2026-11-09

## Contexto
O projeto é um experimento de portfólio: um time Scrum de agentes de IA desenvolve um produto
real, com o humano apenas como stakeholder. Era preciso decidir onde os agentes rodam.

## Decisão
Os agentes são **subagentes do Claude Code**, definidos em `.claude/agents/`. Uma rodada é
disparada pelo comando `/sprint` (manualmente ou por tarefa agendada do Claude). Não há chave
de API nem orquestração no GitHub Actions; o Actions roda apenas build e testes.

Os agentes se comunicam exclusivamente por artefatos versionados (backlog, histórias,
relatórios de QA, dailies), e nenhum agente faz merge na `main`.

## Consequências
- Qualquer pessoa com Claude Code pode clonar o repositório e rodar o mesmo time.
- Todo o raciocínio do time fica auditável no histórico do git.
- O ritmo do time depende do limite de uso do plano do Claude; por isso, uma história por rodada.
- O merge humano é o gate de qualidade final.
