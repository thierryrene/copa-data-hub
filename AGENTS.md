# AGENTS.md — CopaDataHub 2026

> Fonte canônica de instruções para qualquer agente de IA que trabalhe neste repositório (Claude, Gemini, Codex, Copilot, Cursor, Aider, Jules, etc.). Segue o padrão aberto [agents.md](https://agents.md). Arquivos específicos de agentes (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `.cursorrules`) apontam para cá e adicionam só regras próprias da ferramenta.

---

## 1. O que é o projeto

**CopaDataHub 2026** é um **Progressive Web App** mobile-first focado em ser o **companheiro informativo de quem está assistindo a Copa do Mundo ao vivo ou acompanhando o torneio em tempo real**. Funciona como uma "segunda tela" — o usuário assiste na TV e usa o app no celular para contexto, dados e engajamento.

O MVP é deliberadamente **vanilla** (HTML5 + CSS + JS ES6 modules, zero build step, zero dependências) — decisão guiada pela filosofia *Fail Fast, Learn Faster* e pela necessidade de FCP ultra-rápido em redes móveis congestionadas durante eventos de alta concorrência.

**Contexto de produto** (resumo extraído de [Documentacao_CopaDataHub2026.pdf](Documentacao_CopaDataHub2026.pdf)):

- **Pilares:** (1) **informação contextual em tempo real** para quem assiste o jogo, (2) dados + análise preditiva, (3) gamificação + coleta de Zero-Party Data.
- **Linha vermelha legal:** plataforma é **Pick'em / Daily Fantasy** — **nunca** dinheiro real, nunca apostas regulamentadas. Pontos virtuais apenas.
- **Proteção de marcas FIFA:** **não** usar logos/nomes oficiais da FIFA ou do torneio sem licenciamento. Linguagem genérica ("o maior torneio do Mundo", "Mundial 2026"). Nada de "FIFA World Cup™".
- **LGPD/GDPR:** Zero-Party Data só com consentimento explícito; preferências armazenadas em `localStorage` no MVP.
- **Fases futuras** (não implementar sem pedido explícito): migração para Next.js + FastAPI + Firebase/Supabase + WebSockets + Pushwoosh. O MVP **fica vanilla**.

---

## 2. Stack e estrutura

```
word-cup-app/
├── index.html              # Shell mínimo do SPA (div#app-root + meta SEO completo)
├── champions.html          # Página secundária legada (UCL — substituída por /campeonatos)
├── manifest.json           # Manifest PWA principal
├── manifest-ucl.json       # Manifest alternativo (UCL)
├── vercel.json             # Rewrites SPA + headers de cache
├── robots.txt              # Permite indexação total
├── sitemap.xml             # 86 URLs (rotas + 48 seleções + 3 ligas + partidas)
├── css/style.css           # Design system + estilos de todas as páginas
├── scripts/
│   └── dev-server.js       # Dev server Node com fallback SPA + rewrite /champions
├── js/
│   ├── app.js              # Bootstrap, shell, rotas genéricas, prefetch
│   ├── router.js           # SPA router (History API, decodifica params, JSON-LD safe)
│   ├── data.js             # Times (com slug), grupos, estádios, fixtures, helpers
│   ├── state.js            # Estado em localStorage + setFavoriteTeam
│   ├── icons.js            # Biblioteca SVG
│   ├── pwa.js              # Install prompt
│   ├── util/
│   │   ├── html.js         # escapeHTML, isTrustedWikiUrl, normalizeText
│   │   ├── slug.js         # slugify, deslugify para URLs SEO
│   │   ├── seo.js          # setSEO + JSON-LD (SportsTeam, Person, SportsEvent)
│   │   └── match.js        # matchSlug, matchPhase, predictionResultXP
│   ├── api/
│   │   ├── wikipedia.js    # Fetchs Wikipedia/Wikimedia (time + jogador)
│   │   ├── teamLoader.js   # Cache + prefetch de dossiês de seleções
│   │   ├── squad.js        # Elenco da seleção via API-Football
│   │   ├── player.js       # Detalhes do jogador + resolvePlayerIdBySlug
│   │   ├── leagues.js      # Fixtures/standings/top scorers por liga
│   │   └── match.js        # Fixture detalhada + h2h + cache adaptativo
│   ├── data/
│   │   └── leagues.js      # Catálogo de campeonatos (UCL, Brasileirão, EPL)
│   ├── layout/
│   │   ├── header.js       # App header com XP badge
│   │   ├── bottomNav.js    # Bottom nav (rotas pt-BR)
│   │   ├── welcome.js      # Overlay de onboarding
│   │   └── layout.js       # Helpers de UI
│   ├── components/
│   │   ├── index.js        # Barrel
│   │   ├── countdown.js, xpBar.js, statBar.js, toast.js
│   │   ├── matchCard.js    # Card de jogo (linka /partida/:slug)
│   │   ├── groupTable.js, stadiumCard.js
│   │   ├── teamChip.js, teamFixtureRow.js
│   │   ├── predictionBar.js
│   │   ├── lineupField.js, squadList.js     # Escalação e elenco
│   │   ├── playerHero.js, playerStats.js    # Página de jogador
│   │   ├── leagueCard.js, leagueFixtureList.js,
│   │   ├── standingsTable.js, topScorersList.js  # Campeonatos
│   │   ├── matchModoJogo.js                  # Overlay "Modo Jogo" (segunda tela ao vivo)
│   │   ├── playerQuickCard.js                # Bottom sheet de ficha rápida de jogador
│   │   └── match/                            # Componentes da partida
│   │       ├── matchHero.js                  # Hero adaptativo (pré/live/finished)
│   │       └── matchSections.js              # h2h, key players, timeline, briefing,
│   │                                         #   pulse, poll, live stats, recap, ratings
│   └── pages/
│       ├── index.js          # Registro de rotas
│       ├── inicio.js         # Home (/inicio)
│       ├── jogos.js          # Match Center (/jogos) — lista filtrável
│       ├── grupos.js         # Grupos (/grupos)
│       ├── fanzone.js        # FanZone (/fanzone)
│       ├── sedes.js          # Sedes (/sedes)
│       ├── configuracoes.js  # Settings (/configuracoes)
│       ├── selecoes.js       # Seleção (/selecoes/:slug)
│       ├── jogadores.js      # Jogador (/jogadores/:slug)
│       ├── campeonatos.js    # Hub + ligas (/campeonatos[/:slug])
│       └── partida.js        # Partida (/partida/:slug) — pré/live/pós
└── icons/                  # Ícones PWA 192/512
```

**Stack obrigatória:**
- HTML5 semântico • Vanilla CSS com Custom Properties • Vanilla JS ES6 modules
- PWA mínimo (Manifest + A2HS + `display: standalone`), **sem** Service Worker no MVP • `localStorage` para persistência
- SPA router usa **History API** com rewrites no [vercel.json](vercel.json) e [scripts/dev-server.js](scripts/dev-server.js)
- **Nenhum** framework, **nenhum** bundler, **nenhum** `node_modules`, **nenhum** `package.json`

**Rotas (todas em pt-BR, com slugs SEO-friendly):**

| URL | Nome interno | Página |
|---|---|---|
| `/` | `home` | Home + countdown |
| `/jogos` | `jogos` | Match Center |
| `/partida/:slug` | `partida` | Partida (pré/ao-vivo/pós) — slug `time1-vs-time2-data` |
| `/grupos` | `grupos` | Fase de grupos |
| `/fanzone` | `fanzone` | Bolão, trivia, ranking |
| `/sedes` | `sedes` | Estádios |
| `/configuracoes` | `configuracoes` | Settings |
| `/selecoes/:slug` | `selecoes` | Dossiê de seleção |
| `/jogadores/:slug` | `jogadores` | Dossiê de jogador |
| `/campeonatos` | `campeonatos` | Hub de ligas |
| `/campeonatos/:slug` | `liga` | Liga individual (UCL / Brasileirão / EPL) |

Qualquer outra URL → **404 explícito** (página "não encontrada" renderizada dentro do shell).

**API do router** (ver [js/router.js](js/router.js)):

```js
router.addRoute('home', '/', ({ params, name }) => { /* render */ });
router.addRoute('selecoes', '/selecoes/:slug', ({ params }) => { /* params.slug */ });
router.addRoute('*', null, ({ path }) => { /* NotFound */ });

router.navigate('selecoes', { params: { slug: 'brasil' } }); // → /selecoes/brasil
router.navigate('home');                                      // → /
```

Tabela de rotas do app fica em [js/app.js](js/app.js) (`ROUTE_TABLE`). Cada página em `js/pages/` implementa `{ render(state, params), bindEvents(state, { router, params }) }` onde `params` é um objeto nomeado (ex: `{ slug: 'brasil' }`).

---

## 3. Convenções não-negociáveis

### 3.1 Idioma
- **Comentários, UI, mensagens de commit e strings de usuário:** **pt-BR**.
- **Identificadores (variáveis, funções, classes, arquivos):** **inglês**.
- Exemplo: `function calculateStandings()` com comentário `// Calcula classificação dos grupos após cada rodada`.

### 3.2 Segurança web — **regras duras**
Este projeto consome APIs externas (Wikipedia/Wikimedia) e renderiza conteúdo dinâmico. Violar qualquer uma destas regras é bug crítico:

1. **Toda** string vinda de API externa **deve** passar por `escapeHTML()` antes de ir pro DOM via `innerHTML`. Ver [js/app.js:23](js/app.js#L23).
2. **Toda** URL externa que for usada como `href`, `src`, `fetch`, ou similar **deve** ser validada por allowlist de hosts (ver `isTrustedWikiUrl` em [js/app.js:34](js/app.js#L34)). Ao adicionar nova fonte de dados, escreva uma função de validação análoga e use-a.
3. **Nunca** construir URL de API concatenando input do usuário sem encodar (`encodeURIComponent`).
4. **Nunca** usar `eval`, `new Function()`, `setTimeout(string, ...)`, ou `innerHTML` com conteúdo não sanitizado.

### 3.3 PWA (mínimo) e roteamento
- O MVP usa PWA apenas para **atalho na tela inicial** (A2HS) e **execução em tela cheia** (`display: standalone`). **Não há Service Worker** e **não há cache offline** — removidos deliberadamente para simplificar o ciclo de atualização.
- Ao adicionar nova rota SPA em [js/app.js](js/app.js) (`this.router.addRoute(...)`), confira se o padrão de rewrite em [vercel.json](vercel.json) cobre o path (o glob `"/((?!.*\\.).*)"` já captura rotas sem extensão).
- `start_url` do [manifest.json](manifest.json) é `/`; do [manifest-ucl.json](manifest-ucl.json) é `/champions`.

### 3.4 Mobile-first e offline-first
- Design pensado **primeiro** para viewport ~375px. Desktop é enhancement.
- Features devem **degradar graciosamente** offline: se a fetch Wikipedia falha, mostrar fallback, não tela branca.
- FCP < 1.5s é meta. Não adicionar assets pesados sem justificativa.

### 3.5 Estado e persistência
- Estado do usuário vive em `localStorage` via [js/state.js](js/state.js). Sempre use os helpers exportados (`loadState`, `saveState`, `addXP`, etc.) — **não** toque em `localStorage` diretamente de outros módulos.
- Toda mutação de estado deve passar por `saveState()` logo em seguida (persistência síncrona).
- Shape do estado segue o **Dicionário de Estado** da seção 5 do [Documentacao_CopaDataHub2026.pdf](Documentacao_CopaDataHub2026.pdf) — use como blueprint ao adicionar campos novos, pensando na futura migração para Firestore/Supabase.

### 3.6 Comentários
- Padrão: **não escrever comentário**. Nomes descritivos já dizem o quê.
- Exceções válidas: invariante oculta, workaround de bug específico, decisão contra-intuitiva (ex.: "network-first aqui porque cache-first mascara quebras de API").
- **Não** comentar explicando o que o código faz ("// atualiza contador"), nem referenciar tarefas/PRs no código.

### 3.7 Estilo de CSS
- Design system em [css/style.css](css/style.css) via Custom Properties (`--color-*`, `--space-*`, `--radius-*`). **Sempre** consumir tokens existentes antes de introduzir valor mágico.
- Suportar dark mode (já implementado via variáveis). Não hardcode `#fff` / `#000`.
- Glassmorphism e animações já têm padrões; reutilize classes antes de criar novas.

### 3.8 Foco informativo — "segunda tela"

O app é projetado para quem **assiste o jogo ao vivo** e usa o celular como tela de contexto. Ao adicionar novas features, priorize:

1. **Hierarquia de urgência:** conteúdo ao vivo (jogo acontecendo agora) > conteúdo do dia (jogos de hoje) > contexto pré-jogo > gamificação.
2. **Modo Jogo** (`matchModoJogo.js`): overlay de tela cheia para partidas ao vivo. Se adicionar dados ao vivo, considere exibi-los aqui também.
3. **Briefing contextual** (`renderMatchBriefing` em `matchSections.js`): toda partida pré-jogo deve ter contexto de grupo, stakes e jogadores-chave. Ao adicionar dados de confronto direto ou histórico, integre nesta função.
4. **PlayerQuickCard** (`playerQuickCard.js`): qualquer elemento que exiba nome de jogador e tenha `data-player-card="<nome>"` + `data-team-code="<CODE>"` automaticamente abre a ficha rápida via delegação de eventos.
5. **Copa a Copa** (`renderWorldCupTimeline` em `selecoes.js`): usa `enriched.worldCups` e `enriched.bestResult`. Se o JSON `data/enriched/teams.json` for expandido com dados por edição, esta função pode ser enriquecida.

---

## 4. Workflow de trabalho

### 4.1 Antes de editar
1. Leia o arquivo-alvo inteiro e os módulos que ele importa/exporta.
2. Rode mentalmente o fluxo: este código é chamado de onde? O que espera como input/output?
3. Se mudar um helper em [js/state.js](js/state.js) ou [js/components.js](js/components.js), audite todos os consumidores antes de commitar.

### 4.2 Testando localmente e Execução
Como não há framework de testes automatizados, a validação é manual e o agente deve rodar o servidor local para validar as alterações:

```bash
# Servir localmente (comando principal):
node scripts/dev-server.js 3000

# Alternativas (caso o dev-server falhe):
npx serve -s .
python3 -m http.server 3000
```

Abra `http://localhost:3000` e teste:
- **Onboarding:** primeira visita → overlay aparece → escolher nome/time → app carrega.
- **Navegação:** 5 rotas do bottom-nav (home, matches, groups, fanzone, stadiums).
- **Persistência:** recarregar a página → XP, streak, palpites permanecem.
- **Offline:** DevTools → Network → Offline → app continua navegável.
- **PWA:** DevTools → Application → Manifest válido, prompt de instalação aparece (sem Service Worker — é o esperado).
- **Mobile:** DevTools → responsive mode (iPhone 12, Pixel 5).

### 4.3 Commits
- Formato: **Conventional Commits em pt-BR**: `fix:`, `feat:`, `chore:`, `refactor:`, `docs:`, `style:`, `perf:`.
- Exemplos do histórico: `fix: validar URLs externas e estabilizar cálculo de datas nas notícias`, `refactor: usar segmentação de sentenças para curiosidades da Wikipedia`.
- Mensagem foca no **porquê**, não no o quê. Corpo opcional para contexto técnico.
- **Nunca** usar `--no-verify` ou `--amend` em commits já publicados.

### 4.4 Branches e PRs
- `main` é a branch principal (deploy Vercel automático).
- Features em branches `feat/<slug>`, fixes em `fix/<slug>`.
- PR precisa de descrição, test plan manual (checklist), e screenshots/GIFs para mudanças visuais.

### 4.5 Deploy
- Deploy é automático para Vercel a partir de `main` (ver [vercel.json](vercel.json)).
- Headers de cache são imutáveis para JS/CSS/JSON/imagens (1 ano). Rewrites SPA em [vercel.json](vercel.json) direcionam rotas sem extensão para `index.html` (e `/champions/*` para `champions.html`).

### 4.6 Melhoria Contínua e Backlog de IA
- Ao identificar oportunidades de criar novos prompts, automações, _Skills_ ou instruções granulares (ex: `applyTo`) que facilitem o workflow, o agente **não deve** criar os arquivos proativamente.
- Em vez disso, registre a sugestão com justificativa e impacto no arquivo [docs/AGENT_BACKLOG.md](docs/AGENT_BACKLOG.md).

---

## 5. O que **não** fazer

- ❌ Introduzir dependências npm, bundler (webpack/vite/esbuild), ou frameworks (React/Vue/Svelte) — quebra a premissa de zero build.
- ❌ Criar arquivos `.md` de documentação sem o usuário pedir.
- ❌ Mexer em `manifest.json`, `manifest-ucl.json` ou nos rewrites do [vercel.json](vercel.json) sem ler a seção 3.3.
- ❌ Reintroduzir Service Worker / cache offline sem decisão explícita — foi removido no MVP para simplificar atualização.
- ❌ Adicionar telemetria, analytics, ou qualquer coisa que envie dados do usuário externamente sem consentimento LGPD explícito.
- ❌ Incluir logos/nomes oficiais FIFA ou marcas registradas sem licenciamento.
- ❌ Implementar "apostas com dinheiro real" ou integração com casas de aposta.
- ❌ Refatorar proativamente código que não faz parte da tarefa pedida.
- ❌ Gerar commits ou PRs sem o usuário pedir explicitamente.

---

## 6. Referências

- [Documentacao_CopaDataHub2026.pdf](Documentacao_CopaDataHub2026.pdf) — visão de produto, roadmap, dicionário de estado.
- [Copa do Mundo_ Dados para Aplicações Interativas (Claude).pdf](Copa%20do%20Mundo_%20Dados%20para%20Aplica%C3%A7%C3%B5es%20Interativas%20%28Claude%29.pdf) — pesquisa de dados, formato do torneio, APIs.
- [Copa do Mundo_ Dados para Aplicações Interativas (Gemini).pdf](Copa%20do%20Mundo_%20Dados%20para%20Aplica%C3%A7%C3%B5es%20Interativas%20%28Gemini%29.pdf) — segunda passada de pesquisa.
- [README.md](README.md) — quick start e feature matrix.
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — workflow de desenvolvimento humano (branches, testes, deploy).

---

**Dúvida sobre escopo ou decisão de produto?** Pergunte ao usuário antes de assumir — especialmente em temas que tocam LGPD, marcas FIFA, ou a linha vermelha de betting.
