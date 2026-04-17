# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR.

---

## [Não-publicado]

### Alterado (home canônica em `/`)

- Home do site agora é servida em `/` (não mais `/inicio`) como URL canônica.
- Router detecta `/inicio` e automaticamente redireciona para `/` via `replaceState` (evita conteúdo duplicado no SEO).
- `_buildPath('inicio', [])` gera `/` em vez de `/inicio` — navegações internas para home produzem URL limpa.
- `bottomNav` usa `href="/"` no item Início.
- Sitemap atualizado (86 URLs, começando por `/`).

### Corrigido (rotas em F5)

- **Race condition no bootstrap:** `setupRoutes()` agora é chamado em `init()` antes da decisão de onboarding, garantindo que handlers estejam registrados antes de qualquer possível disparo de `_handleRoute`.
- **Default route inconsistente:** `Router.defaultRoute` não é mais `'home'` hardcoded (rota que não existe após migração pt-BR). Agora inicia vazio e é definido em `router.start('inicio')`.
- **`partida.js` ignorava params do contrato:** usava `window.location.pathname.split('/').pop()` que retorna valor URL-encoded. Agora usa `params` do router (já decodificado), alinhado ao padrão das outras páginas.

### Adicionado (Match Center 2.0 — página da partida)

- **Nova rota `/partida/:slug`** com slug semântico (ex: `/partida/brasil-vs-franca-2026-06-20`).
- **Match Hero adaptativo** muda layout conforme estado:
  - **Pré-jogo:** countdown regressivo até kickoff, escudo e nome de cada seleção, info do estádio.
  - **Ao vivo:** placar grande, indicador pulsante, status (1T/HT/2T) com minuto.
  - **Pós-jogo:** placar final + selo "ENCERRADO".
- **Modo PRÉ-JOGO:** previsão de IA, confronto direto (h2h via `/fixtures/headtohead`), 3 jogadores-chave de cada time, palpite +15 XP integrado ao bolão, info do estádio.
- **Modo AO VIVO:** Pulse de torcida (4 emojis com contador local persistente), enquete efêmera ("Quem vai marcar o próximo gol?"), estatísticas ao vivo (posse, chutes, escanteios, faltas), timeline de eventos (gols, cartões, substituições) com auto-refresh a cada 30s.
- **Modo PÓS-JOGO:** narrativa template-based ("X venceu Y por Z, gol de A aos B'"), avaliações dos jogadores (rating 0-10 com cores), estatísticas finais, eventos consolidados, resultado do palpite com XP (100 placar exato / 50 vencedor / 5 consolação).
- **Lista `/jogos` reformulada:** filtros por fase (todos/ao-vivo/próximos/encerrados) + filtros por grupo (A-L), `matchCard` clicável → página da partida.
- **Cache adaptativo** em `sessionStorage`: 30s LIVE, 5min pré-jogo, 24h encerrado.
- **Polling inteligente:** 30s durante LIVE, sem polling em outros estados.
- **Slug de partidas no sitemap:** 28 URLs novas (`/partida/...`) totalizando 86 URLs indexáveis.
- **JSON-LD `SportsEvent`** por partida com `startDate`, `homeTeam`, `awayTeam`, `location`.
- Novo `js/util/match.js`, `js/api/match.js`, `js/components/match/matchHero.js`, `js/components/match/matchSections.js`, `js/pages/partida.js`.
- Helper `getMatchSlug(fixture)` em `data.js`.

### Alterado (BREAKING — URLs agora são pt-BR e semânticas)

- **Rotas migradas de inglês+ID para pt-BR+slug** para SEO e legibilidade:
  - `/home` → `/inicio`
  - `/matches` → `/jogos`
  - `/groups` → `/grupos`
  - `/stadiums` → `/sedes`
  - `/settings` → `/configuracoes`
  - `/team/:code` → `/selecoes/:slug` (ex: `/selecoes/brasil`)
  - `/player/:id` → `/jogadores/:slug` (ex: `/jogadores/vinicius-junior`)
- Arquivos de páginas renomeados correspondentemente em `js/pages/`.
- Bottom-nav, pages/index.js, app.js, e todos os ~17 links internos atualizados.
- Link "UCL DataHub" na home substituído por "Campeonatos Ao Vivo" apontando para `/campeonatos`.

### Adicionado (Campeonatos Ao Vivo)

- **Hub de campeonatos** (`/campeonatos`) com 3 cards visuais (Champions League, Brasileirão, Premier League) cada um com cor/emoji/slug próprio.
- **Páginas individuais por campeonato** (`/campeonatos/champions-league`, `/campeonatos/brasileirao`, `/campeonatos/premier-league`) com:
  - Hero com identidade visual da liga (cor, emoji, país).
  - 3 abas: Próximos Jogos, Classificação, Artilheiros.
  - Dados ao vivo via API-Football (`/fixtures`, `/standings`, `/players/topscorers`).
  - Cache `sessionStorage` com TTL 30min.
- Novo `js/data/leagues.js` — catálogo de campeonatos indexado por slug.
- Novo `js/api/leagues.js` — fetchs de fixtures/standings/top scorers com cache.
- Novos componentes: `leagueCard.js`, `leagueFixtureList.js`, `standingsTable.js`, `topScorersList.js`.
- Links para jogadores na lista de artilheiros navegam para `/jogadores/:slug`.

### Adicionado (SEO)

- Novo módulo `js/util/seo.js` com `setSEO({ title, description, canonical, og:*, twitter:*, jsonLd })` chamado por cada página.
- Helpers de JSON-LD Schema.org: `SportsTeam`, `Person`, `SportsEvent`, `WebApplication`.
- Meta tags dinâmicas por rota: title, description, keywords, canonical, Open Graph (Facebook/LinkedIn) e Twitter Card.
- Preconnect e dns-prefetch para Google Fonts, Wikipedia e API-Football.
- `<html lang="pt-BR">` confirmado, `<h1>` único e semântico em cada página.
- Novo `robots.txt` permitindo indexação total.
- Novo `sitemap.xml` gerado com 58 URLs (rotas fixas + 48 seleções + 3 campeonatos).
- Meta `<meta name="author">` e `<meta name="robots" content="index, follow">`.
- Slug em todas as 48 seleções (`TEAMS.BRA.slug === 'brasil'`) + helpers `getTeamBySlug`, `slugToCode`.
- Slug computado de nome de jogador com cache inverso em `sessionStorage` (`registerPlayerSlug`, `resolvePlayerIdBySlug`) — deep-link `/jogadores/vinicius-junior` busca via API-Football se não estiver em cache.
- Novo módulo `js/util/slug.js` (`slugify`, `deslugify`).
- Dev-server passa a servir `.txt` e `.xml` com MIME correto.

### Adicionado (Página de jogador) com:
  - Hero com foto, nome, nacionalidade, clube, posição, número, idade, dados físicos.
  - Grid de estatísticas da temporada (gols, assistências, jogos, minutos, rating, passes, dribles, chutes, desarmes, cartões, defesas para goleiros).
  - Dossiê enciclopédico da Wikipedia com busca inteligente por "futebolista" + curiosidades extraídas do texto.
  - Botão de compartilhar (Web Share API + fallback clipboard).
  - Skeletons animados durante carregamento; fallback gracioso se API indisponível.
- Novo endpoint `fetchWikipediaPlayerSummary` em `wikipedia.js` com busca heurística filtrando resultados por contexto futebol.
- Novo módulo `js/api/player.js` com cache `sessionStorage` 24h (mesmo padrão do squad).
- Jogadores clicáveis na escalação provável e no elenco completo — ambos navegam para `/player/:id`.
- Novos componentes: `playerHero.js`, `playerStats.js`.

### Adicionado (escalação)

- **Escalação provável e elenco completo** na página de detalhes de seleção (`/team/:code`):
  - Campo visual com formação tática (4-3-3, 4-2-3-1, etc.) e 11 titulares prováveis posicionados graficamente.
  - Lista do elenco completo agrupada por posição (goleiros, defensores, meio-campistas, atacantes) com foto, número, nome e idade.
  - Indicação da próxima partida e adversário no cabeçalho da seção.
  - Dados via API-Football (`/players/squads`) com cache em `sessionStorage` (TTL 24h) para economizar o limite de 100 req/dia.
  - Skeletons animados durante carregamento; fallback gracioso se API indisponível.
- Mapeamento `TEAM_API_IDS` (48 seleções → IDs da API-Football) e `TEAM_FORMATIONS` (formação tática padrão por seleção) em `data.js`.
- Novos módulos: `js/api/squad.js`, `js/components/lineupField.js`, `js/components/squadList.js`.

---

## 2026-04-16

### Adicionado

- **Página dedicada de seleção** (`/team/:code`) com dossiê enciclopédico (Wikipedia), jogos do time com palpite do usuário, comparador com seleção favorita, botão "Definir como favorita" (+10 XP único) e compartilhar via Web Share API + fallback clipboard.
- Navegação para `/team/:code` ativada em **todos** os pontos que exibem seleção: tabelas de grupo, match cards, prediction bar, leaderboard, bolão e card de perfil em settings.
- Prefetch de dados Wikipedia em hover/touchstart para transição mais rápida entre seleções.
- Ícones: `heart`, `heartFilled`, `share2`, `arrowLeft`, `gitCompare`, `globe`, `newspaper`, `sparkles`.
- `setFavoriteTeam()` em `state.js` — permite trocar seleção favorita fora do onboarding.
- `getTeamFixtures()` e `getGroupForTeam()` em `data.js`.
- `renderTeamChip` e `renderTeamFixtureRow` como componentes reutilizáveis.
- **Dev-server Node** (`scripts/dev-server.js`) com fallback SPA e rewrite `/champions`, substituindo dependência de `npx serve` ou Vercel para testes locais de deep-links.

### Alterado

- **Modularização completa do JS:** `components.js` (409 loc) e `pages.js` (688 loc) quebrados em ~20 módulos em `js/components/`, `js/pages/`, `js/layout/`, `js/api/` e `js/util/`.
- Cada página agora exporta contrato `{ render(state, params), bindEvents(state, ctx) }` — `app.js` registra rotas genericamente sem `if` por página.
- `app.js` reduzido de ~630 loc para ~120 loc (bootstrap + shell + registro de rotas).
- `index.html` agora é shell mínimo (`div#app-root`); header, bottom-nav, welcome overlay e install banner são montados em JS.
- Todos os caminhos de assets em HTML passam a ser **absolutos** (`/js/app.js`, `/css/style.css`, `/manifest.json`) — corrige F5 quebrando em deep-links.
- Router (`router.js`): decodifica params com `decodeURIComponent`, blinda rotas inexistentes via `replaceState` (URL ↔ estado sempre consistente), trata anchors com `target`/`download` e URLs cross-origin.
- Link inter-página `champions.html` → `/champions` (absoluto, compatível com rewrite SPA).

### Corrigido

- **F5 em deep-links** (`/team/BRA`, `/groups`, etc.) quebrava porque assets com paths relativos resolviam contra a rota SPA (`/team/js/app.js` → 404).
- Router não normalizava URL ao redirecionar rota inexistente — analytics/tracking via rastreava rota errada.

### Removido

- Painel inline `#team-details-panel` na página de Grupos (substituído pela rota `/team/:code`).
- Estilos `.team-insights__*` (órfãos após remoção do painel).
- Arquivos monolíticos `js/components.js` e `js/pages.js`.

---

## 2026-04-16 (manutenção)

### Alterado

- Migração do roteamento SPA de hash (`#groups`) para History API (`/groups`) com URLs limpas.
- Rewrites em `vercel.json` para suportar History API em produção.
- Remoção do Service Worker e cache offline do MVP — simplifica ciclo de atualização.

### Adicionado

- `.gitignore` com exceções padrão e `.history`.
- Documentação alinhada (`AGENTS.md`, `WORKFLOW.md`, CI) com PWA mínimo e roteamento History API.

---

## 2026-04-15

### Adicionado

- **Lançamento inicial do MVP** — CopaDataHub 2026.
- Design system completo em CSS (Custom Properties, dark mode, glassmorphism).
- SPA router com navegação entre 5 páginas: Início, Jogos, Grupos, FanZone, Sedes.
- Gerenciamento de estado em `localStorage` (XP, streak, palpites, trivia).
- Dados estáticos de 48 seleções, 12 grupos, 16 estádios e calendário de jogos.
- Countdown até 11 de junho de 2026.
- Match Center com partida demo ao vivo (BRA × FRA), estatísticas e previsão de IA.
- FanZone com bolão, trivia (12 perguntas) e leaderboard mock.
- Página de sedes/estádios com filtros por país.
- Configurações com perfil, instalação PWA e reset de dados.
- PWA: Manifest para A2HS, ícones 192/512, display standalone.
- Onboarding: escolha de nome e seleção favorita na primeira visita.
- **UCL DataHub** (`champions.html`) com integração API-Football ao vivo.
- Deploy Vercel com rewrites SPA e cache imutável para assets.

### Corrigido

- Crash no onboarding: overlay escondido por padrão, skip para usuários retornantes.

---

## 2026-04-15 (detalhes de seleção — PR #1)

### Adicionado

- Detalhes de seleção ao clicar no grupo: summary da Wikipedia, curiosidades extraídas por segmentação de sentenças, notícias em destaque da Wikimedia.
- Sanitização de HTML (`escapeHTML`) e validação de URLs externas (`isTrustedWikiUrl`) por allowlist.

### Corrigido

- Validação de URLs externas e estabilização do cálculo de datas nas notícias.
- Tratamento de erro e parsing de curiosidades na visão de seleção.

### Alterado

- Substituição de números mágicos e regex com lookbehind em detalhes de seleção.
- Segmentação de sentenças via `Intl.Segmenter` para curiosidades da Wikipedia.
- Otimização de sanitização e constantes de busca de notícias.
