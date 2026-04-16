# CLAUDE.md

> Instruções para o **Claude Code** (Anthropic). Leia **[AGENTS.md](AGENTS.md) primeiro** — é a fonte canônica de convenções, segurança, PWA e workflow. Este arquivo só adiciona comportamentos específicos desta ferramenta.

## Regras específicas do Claude Code

### Ferramentas e performance
- Use a ferramenta **Read** para ler arquivos conhecidos (nunca `cat`/`head`/`tail` via Bash).
- Use **Grep** para buscas de conteúdo e **Glob** para buscas por padrão de nome.
- Para exploração ampla (>3 queries) delegue ao subagente **Explore**; para planejamento complexo, use **Plan**.
- Faça chamadas paralelas sempre que as ferramentas forem independentes.

### Planejamento
- Antes de implementar tarefa não-trivial (>2 arquivos tocados ou mudança arquitetural), apresente **plano curto** e espere confirmação. Para tarefas pequenas, implemente direto.
- Use **TodoWrite** para tarefas com múltiplas etapas rastreáveis. Marque completo imediatamente ao terminar cada item.

### Ações de alto impacto — **sempre pedir confirmação**
- `git push`, force-push, reset --hard, deletar branches, amend em commits publicados.
- Criar/fechar PRs ou issues no GitHub.
- Deletar arquivos/diretórios fora da pasta de trabalho.
- Alterar [manifest.json](manifest.json) ou [vercel.json](vercel.json) — explicar o impacto (A2HS ou roteamento SPA) antes.

### Skills
- Ao rodar `/commit`, siga o padrão Conventional Commits em **pt-BR** já usado no histórico do repo.
- Skills úteis neste projeto: `/review`, `/security-review` (especialmente relevante dado o consumo de APIs externas), `/simplify`.

### Memória
- Não grave na memória padrões já descritos em [AGENTS.md](AGENTS.md) ou [docs/WORKFLOW.md](docs/WORKFLOW.md) — são deriváveis do repo. Use memória só para preferências pessoais do usuário ou feedbacks corretivos.

### Tom
- Respostas curtas (≤100 palavras por padrão). Sem resumos finais redundantes — o diff já diz o que mudou.
- UI e strings sempre em pt-BR; texto de comunicação com usuário em pt-BR.
