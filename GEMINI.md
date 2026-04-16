# GEMINI.md

> Instruções para o **Gemini Code Assist** (Google) e qualquer agente baseado em Gemini. Leia **[AGENTS.md](AGENTS.md) primeiro** — é a fonte canônica de convenções, segurança, PWA e workflow. Este arquivo só adiciona comportamentos específicos desta ferramenta.

## Regras específicas do Gemini

### Contexto
- Antes de sugerir código, inclua no contexto de janela: [AGENTS.md](AGENTS.md), o arquivo alvo e **todos os módulos que ele importa/exporta**. O projeto é pequeno (~3.7k linhas) — cabe folgadamente.
- Para entender um fluxo, priorize esta ordem: [index.html](index.html) → [js/app.js](js/app.js) → módulo específico.

### Sugestões inline
- Evite completar com imports de pacotes npm — **não existe `package.json`** e não haverá. Se o usuário pedir uma lib, primeiro sugira implementação vanilla equivalente.
- Não sugira frameworks (React/Vue/Svelte/Next.js) mesmo que pareçam "naturais" — a decisão arquitetural do MVP é explicitamente vanilla (seção 2 de [AGENTS.md](AGENTS.md)).

### Geração de código
- Sempre aplique `escapeHTML()` em strings externas antes de `innerHTML`.
- Ao sugerir novo fetch para domínio externo, gere junto uma função de validação de URL (allowlist de hosts) no padrão de `isTrustedWikiUrl` em [js/app.js:34](js/app.js#L34).
- Nomes em inglês, comentários em pt-BR (quando forem necessários — ver seção 3.6 de [AGENTS.md](AGENTS.md), que recomenda não comentar por padrão).

### Commits e PRs
- Formato Conventional Commits em **pt-BR** (`fix:`, `feat:`, `chore:`, `refactor:`, `docs:`). Exemplo do histórico: `refactor: usar segmentação de sentenças para curiosidades da Wikipedia`.

### Quando não gerar
- Se a tarefa tocar [manifest.json](manifest.json) ou [vercel.json](vercel.json), sinalize explicitamente o impacto (A2HS ou roteamento SPA) antes de sugerir mudança.
- Se a tarefa envolver dados do usuário (coleta, envio, storage), verifique alinhamento com LGPD/GDPR e com a "linha vermelha" de betting descrita em [AGENTS.md](AGENTS.md#1-o-que-é-o-projeto).
