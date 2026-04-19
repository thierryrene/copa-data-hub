# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR.

---

## Não lançado

### Adicionado — UI/UX dos palpites e Home

Foco em tornar os palpites visíveis em todo o app e aproveitar o tamanho da tela no desktop. Reformulação do bolão e do contador regressivo da home, além de novo fluxo de exportação de calendário.

#### Fanzone — Bolão reformulado e nova aba "Meus Palpites"

- **Card do bolão reescrito**: inputs de placar 60×60 sem setas nativas, separador "VS" dourado, bandeira/código em classes dedicadas (`.bolao-card__flag`, `.bolao-card__code`), scores agrupados em `.bolao-card__scores`.
- **Estado visual "salvo"**: quando já existe palpite, o card ganha borda emerald (`.bolao-card--saved`), badge "✓ Salvo" no header e o botão alterna para "Atualizar Palpite".
- **Grid 2 colunas em ≥1024px** nos cards do bolão (`.bolao-grid`). Mobile continua 1 coluna.
- **Confiança em pill glass**: `.bolao-card__confidence` com fundo glass e estrelas maiores (1.2rem) com scale/shadow no ativo.
- **Alerta dinâmico** acima dos cards: "X partidas sem palpite" (gold) ou "Todos registrados" (emerald).
- **Nova sub-tab "Meus Palpites"** na fanzone agrupa todos os palpites por status:
  - 🎯 Placar exato (100 XP base)
  - ✅ Acertou vencedor (50 XP base)
  - ⏳ Aguardando resultado
  - 💪 Não acertou (5 XP base)
  - Exibe XP ganho com multiplicador de confiança nos encerrados; data nos pendentes.

#### Home — Palpites surfaceados nos cards de partida

- **`renderMatchCard(fixture, prediction)`** aceita palpite opcional e mostra faixa emerald "Meu palpite · 2×1 ⭐⭐" no rodapé do card.
- `inicio.js` e `jogos.js` passam o palpite do usuário ao renderizar cada card.
- **Badge no título** "Próximos Jogos" da home: pill gold "N sem palpite" quando há partidas visíveis sem palpite.
- **Lista em grid 2 colunas** na home (`.matches-list--grid`) seguindo o padrão da rota Jogos.

#### Card de partida totalmente clicável

- `.match-card` agora é `position: relative` + `cursor: pointer`.
- `.match-card__link::after` cobre o card inteiro como overlay de link.
- Links de seleção e footer mantêm `position: relative; z-index: 1` para continuarem clicáveis.
- Sublinhado global de `a:hover` removido dos links do card.

#### Home — Contador regressivo redesenhado

- Layout 2 colunas (≥900px): intro à esquerda + cards/info à direita. Mobile empilha naturalmente.
- Badge gold "🏆 Contagem Oficial 2026" + título grande com gradiente gold→yellow em "Junho de 2026".
- Cards de Dias/Horas/Minutos/Segundos com números em itálico display (`.countdown-item`, `.countdown-number`).
- Barra `.countdown-info` com ícones coloridos: blue para "Locais" e emerald para "Início".
- **Ativar Notificação**: pede `Notification.requestPermission()` com feedback via toast.
- **Compartilhar**: `navigator.share` nativo com fallback para copiar URL no clipboard.
- Estado "em andamento" usa `.countdown-live-banner`.

#### Home — Importação do calendário completo (.ics)

- Novo utilitário [js/util/calendar.js](js/util/calendar.js):
  - `buildIcsCalendar()` gera arquivo iCalendar com todas as 104 partidas.
  - Conversão correta de fuso local do estádio para UTC (EDT/CDT/PDT em junho).
  - Cada `VEVENT` traz times (nomes completos), estádio/cidade, grupo e horário local.
  - Duração padrão de 2h por jogo.
  - `downloadCalendar()` dispara download do `mundial-2026.ics`.
- CTA `.calendar-import` no fim da home: ícone gold + descrição + botão "Importar Calendário".
- Compatível com Google Calendar, Apple Calendar e Outlook.

### Alterado

- `js/pages/jogos.js` agora recebe `state` em `render(state)` para passar palpites ao `renderMatchCard`.
- CSS do countdown foi totalmente reescrito. O override antigo `max-width: 400px` no `.countdown-grid` foi removido.

---

## 2026-04-19

### Adicionado (Foco Informativo — App de Segunda Tela)

Reorientação do app para servir quem está **assistindo os jogos ao vivo ou acompanhando a Copa em tempo real**. Inspirado em SofaScore, FotMob, Amazon Prime Video X-Ray e ESPN Match Preview.

#### Home — Dashboard "O que acontece agora"

- **Banner "Ao Vivo"** (`renderLiveBanner`): aparece no topo da home quando há jogo em andamento, com placar, minuto e link direto para o modo jogo. Desaparece quando não há jogos ao vivo.
- **Widget "Hoje na Copa"** reformulado: exibe **todos** os jogos do dia (não apenas 2), com badge de status em linha — `AO VIVO` (pulsante vermelho), `FIM` (cinza) ou horário (pré-jogo). Inclui contagem de jogos ao vivo vs. encerrados em tempo real.
- **"Copa em Números"** (`renderTournamentNumbers`): bloco de 4 estatísticas calculadas dinamicamente dos dados do torneio — jogos disputados, total de gols, média de gols/jogo, e artilheiro por seleção. Exibido somente após início do torneio (≥ 11/06/2026).
- **Hierarquia nova da home**: Live Banner → Hoje/Contagem → Copa em Números → XP Bar → Meu Copa → Campeonatos → Seções de navegação. Antes: countdown → XP → Meu Copa → stats estáticas → navegação.
- Antes do início do torneio, home mantém countdown com bloco "O Torneio" (48 seleções / 104 jogos / 16 estádios / 3 países).
- "Próximos Jogos" agora usa apenas fixtures com `phase === 'pre'` ordenados por data (não mais os jogos do dia hardcoded).
- Novos estilos CSS: `.live-banner`, `.today-widget__status`, `.today-widget__status--live`, `.today-widget__status--fin`, `.today-widget__score--live`, `.tournament-numbers`, `.tournament-numbers__grid`, `.tournament-numbers__stat`.

#### Partida — Briefing Pré-Jogo

- **Seção "Briefing Pré-Jogo"** (`renderMatchBriefing` em `matchSections.js`): exibida acima do bolão em toda partida com estado `pre`. Contém:
  - Badge de grupo e rodada (`Grupo H · Rodada 1`).
  - Bloco **"O que está em jogo"** com texto gerado automaticamente baseado na classificação atual — estreia, time sem pontos, time já classificado, pontuações atuais.
  - **Situação atual** dos dois times: posição no grupo, pontos, jogos disputados.
- `computeGroupStandings(groupId)` — função interna que calcula classificação ao vivo do grupo a partir dos FIXTURES com placar preenchido.
- `matchdayLabel(fixture)` — detecta automaticamente a rodada (1ª, 2ª ou 3ª) de cada partida.
- `stakesText(...)` — gera texto contextual de stakes baseado no estágio de pontuação dos dois times.
- Aba "H2H" do pré-jogo foi consolidada dentro da aba "Pré-Jogo" como seção "Retrospecto" — o H2H agora aparece por padrão sem precisar trocar de aba.
- Seção "Jogadores em Destaque" renomeada para **"Olho neles"** com novo ícone `eye`.
- Novos estilos CSS: `.match-briefing`, `.match-briefing__header`, `.match-briefing__tag`, `.match-briefing__stakes`, `.match-briefing__standings`, `.match-briefing__team-row`.

#### Partida — Modo Jogo (Second Screen Mode)

- **Botão "Modo Jogo"** no hero de partidas ao vivo: abre overlay full-screen otimizado para segunda tela (segurar o celular enquanto assiste na TV).
- **Overlay `matchModoJogo`** (`js/components/matchModoJogo.js`): exibe placar grande com times, badge "AO VIVO" pulsante com minuto, seções "Eventos" e "Estatísticas" (lidas do DOM da página, sem chamada extra de API) e bloco **"Você sabia?"** com fato contextual rotativo sobre a Copa.
- Overlay fecha ao clicar no botão X ou no backdrop. Fecha automaticamente ao sair da página.
- Novo ícone `maximize` adicionado à biblioteca `icons.js`.
- Novos estilos CSS: `.match-hero__modo-jogo`, `.modo-jogo`, `.modo-jogo__header`, `.modo-jogo__score-block`, `.modo-jogo__sections`, `.modo-jogo__fact`.

#### Partida — Ficha Rápida de Jogadores

- **`PlayerQuickCard`** (`js/components/playerQuickCard.js`): bottom sheet animado que sobe ao clicar em qualquer jogador na seção "Olho neles" da partida. Exibe:
  - Foto (com fallback), nome, seleção, posição, camisa, idade, clube.
  - Grid de stats da temporada: gols, assistências, jogos, nota média.
  - Link "Ver perfil completo" para `/jogadores/:slug`.
- Animação de entrada/saída com `transform: translateY` + transition 300ms cubic-bezier.
- Atributos `data-player-card` e `data-team-code` injetados nos `.key-player` após carregamento do squad em `loadPreMatch`.
- Delegação de eventos via `.match-page` — sem listeners por jogador.
- Novos estilos CSS: `.pqc-backdrop`, `.pqc`, `.pqc--open`, `.pqc__header`, `.pqc__stats`, `.pqc__link`.
- Novos ícones: `eye`, `user` adicionados à biblioteca `icons.js`.

#### Seleções — Copa a Copa

- **Seção "Copa a Copa"** (`renderWorldCupTimeline`) na página de cada seleção, acima de "Honras e Títulos". Exibe:
  - Linha do tempo visual de todas as edições da Copa desde que o time passou a participar regularmente.
  - Anos com título marcados em **ouro** com 🏆; demais edições com ponto cinza.
  - Badge de troféus acumulados e texto `bestResult`.
- Heurística de participação por confederação: `hasLongHistory` (UEFA/CONMEBOL desde 1930), `hasMidHistory` (CAF/AFC desde 1982), demais (desde 2006).
- Dados lidos de `enriched.worldCups` e `enriched.bestResult` — nenhum dado novo necessário no JSON.
- Placeholder skeleton durante hidratação assíncrona.
- Novos estilos CSS: `.wc-timeline`, `.wc-timeline__grid`, `.wc-timeline__item`, `.wc-timeline__item--win`, `.wc-timeline__trophy`.

### Alterado

- `matchSections.js` agora importa `FIXTURES`, `GROUPS`, `getTeam` de `data.js` e `matchPhase` de `util/match.js` para cálculos internos de briefing.
- `partida.js` importa e integra `renderMatchBriefing`, `openModoJogo`/`closeModoJogo`, `bindPlayerCards`.
- `matchHero.js` adiciona botão "Modo Jogo" quando `phase === 'live'`.
- `selecoes.js` adiciona `renderWorldCupTimeline`, placeholder e chamada em `hydrateEnriched`.
- `icons.js` ganha três novos ícones: `maximize`, `eye`, `user`.
- `inicio.js` importa `matchSlug` de `util/match.js` (já existia, passou a ser necessário para o live banner).

---

## [Não-publicado]

### Alterado (BREAKING — router reescrito com modelo declarativo)

- **Router reescrito do zero** abandonando abordagem imperativa com remendos em favor de tabela declarativa de rotas com pattern matching (estilo React Router / Vue Router), padrão consolidado em frameworks maduros.
- **API de rotas nova:**
  - `router.addRoute(name, pattern, handler)` com patterns como `'/selecoes/:slug'`.
  - `router.addRoute('*', null, handler)` para **NotFound explícito** (sem fallback silencioso para home).
  - `router.navigate(name, { params: { slug: 'brasil' }, replace })` — params como objeto nomeado em vez de array posicional.
  - `handler` recebe `{ params, name }` com `params` desestruturado do pattern.
- **Home na raiz `/`** — mapeada para a rota registrada com `name:'home'` e `pattern:'/'`. Não há mais `/inicio` no URL — se alguém acessar `/inicio`, retorna 404 (não existe mais).
- **Tabela de rotas centralizada** em `app.js` (`ROUTE_TABLE`): cada entrada tem `name`, `pattern` e `page` (chave em `pages/index.js`).
- **Error boundaries** em handlers: exceções em `render()` ou `bindEvents()` são capturadas e mostram estado de erro sem crashar o app.
- **Zero race conditions:** `setupRoutes()` ocorre em `init()` antes de qualquer decisão de onboarding, rotas estão sempre disponíveis.
- **NotFound handler** renderiza página 404 real em vez de redirect silencioso, respeitando SEO (`noindex` implícito pela ausência no sitemap).
- Todas as páginas adaptadas para novo contrato de `params` (objeto em vez de array).

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
