# Agent & Workflow Backlog

Este arquivo consolida sugestões, oportunidades de automação, e recomendações de customização de agentes (Agent Customizations) para o projeto. Ele serve como um mapa de roadmap de arquitetura de IA para o projeto. 

**De acordo com o `AGENTS.md`, qualquer agente ao identificar padrões repetitivos ou novas necessidades, deve registrar o contexto aqui ao invés de proativamente criar os arquivos.**

---

## 📋 Lista de Melhorias e Customizações Sugeridas

### 1. Prompt Específico de Segurança Web (`security-review`)
- **Arquivos-alvo:** Todo projeto (`*.js`), principalmente dentro de `js/api/` e manipulação de Node.
- **Implementação Sugerida:** Criar um prompt de auditoria (ex: `.github/prompts/security-review.prompt.md`).
- **Problema/Justificativa:** Como o portal carrega dados da Wikipedia e de outras fontes e realiza manipulações do DOM de forma manual com "Vanilla JS", é mandatória a sanitização com o `escapeHTML`. Focar em prevenir vazamento de PII e violação das marcas da FIFA. É útil para quando o revisor quiser injetar uma sub-tarefa de security de curto prazo.

### 2. Instruções Direcionadas para Componentes UI
- **Arquivos-alvo:** `js/components/**/*.js`.
- **Implementação Sugerida:** Criar `.github/instructions/components.instructions.md` usando o metadado `applyTo: "js/components/**/*.js"`.
- **Problema/Justificativa:** Componentes visuais tem muitas regras específicas que "inflam" o context window se mantidos em escopo global (e.g. sempre utilizar as CSS Custom Properties definidas no design system global `style.css` ou ler dados via `js/state.js`). Esse isolamento impede que as respostas de lógica de negócio recebam alucinações de UI e melhora o caching em prompts na criação de novos cards.

*(Adicione novas sugestões abaixo identificando os mesmos blocos)*
