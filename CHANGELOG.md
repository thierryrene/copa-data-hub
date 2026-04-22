# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR.

---

## Não lançado

### Adicionado — Sedes & estádios (2026-04-21)

#### Modal 3D dos estádios

- Novo componente `js/components/stadium3dModal.js`: modal fullscreen com iframe Google Maps em modo satélite (`t=k`, zoom 18), navegável sem chave de API.
- Botão "Ver em 3D" no header do modal abre o **Google Earth** em nova aba (`earth.google.com/web/...`) com tilt 60° e rotação livre — vista 3D real.
- Backdrop com blur, animação de entrada bouncy, fechamento via × / click fora / ESC; cleanup automático ao sair da rota.

#### Redesign do card de estádio

- Hierarquia visual: nome em display 700, cidade em secundário, capacidade e fuso horário em pills compactos.
- Selo de país (`__flag` 56×56) com ring colorido (azul EUA / esmeralda México / rosa Canadá) e animação `scale(1.05)` no hover.
- Tinta sutil de fundo por país (`::before` 6%) que intensifica para 10% no hover — profundidade sem poluir.
- Hover com `translateY(-3px)` + glow dourado + bordas viram gold; CTA com seta `→` que desliza 4px à direita.
- Pin "🏆 FINAL" no canto superior direito com gradient gold + glow; cards finais ganham borda dourada.
- Acessibilidade: `:focus-visible` com ring dourado de 3px; `aria-label` rico no botão.
- Mobile (≤720px): CTA "Ver em 3D" sempre visível; nomes/cidades longos com `text-overflow: ellipsis`.

#### Correção de coordenadas

- Verificadas as 16 coordenadas em latlong.net e atualizadas com 6 casas decimais.
- **Estadio BBVA** (Monterrey) estava ~480m fora do alvo — corrigido `25.6649` → `25.669132`.
- **AT&T Stadium** ~110m no longitude — corrigido `-97.0945` → `-97.093231`.
- **MetLife Stadium**: cidade trocada de "Nova Jersey" para "East Rutherford, NJ" (cidade correta da sede).

### Adicionado — Tema & paletas de cores (2026-04-21)

#### Sistema de tema (Auto / Claro / Escuro)

- Novo `js/util/theme.js` com `bootThemeAndPalette()` aplicado **antes** do `mountShell` para evitar flash de cor.
- Modo "Auto" segue `prefers-color-scheme` do SO via `matchMedia` listener — re-aplica em tempo real quando o usuário muda o tema do sistema.
- Atualiza `<meta name="theme-color">` para a barra do navegador combinar com o tema ativo.
- Persistido em `state.settings.theme` (defaults `'auto'`).

#### 8 paletas de cores

- Cada paleta sobrescreve as variáveis accent (`--color-gold/blue/rose/emerald/purple/cyan`), gradientes (`--gradient-gold/blue/emerald/rose`), glows (`--shadow-glow-*`), `--gradient-glow` (fundo do body), `--gradient-hero` e `--color-bg-primary`/`--color-bg-secondary` tonalizados (dark + light).
- **Stadium Night** (default): dourado #f59e0b + azul #3b82f6 + rosa #f43f5e
- **Sunset**: laranja #f97316 + rosa quente #ec4899 + âmbar #fbbf24
- **Pitch**: verde grama #22c55e + azul royal #1d4ed8 + amarelo #eab308
- **Brasil**: amarelo CBF #facc15 + verde #16a34a + azul faixa #1e3a8a
- **Royal**: roxo #a855f7 + ciano #06b6d4 + magenta #ec4899
- **Volcano**: vermelho #dc2626 + laranja queimado #ea580c + dourado #fbbf24
- **Ocean**: ciano #0ea5e9 + teal #0d9488 + azul profundo #1e40af
- **Champion**: dourado intenso #fbbf24 + bronze #b45309 + esmeralda #10b981

#### UI em /configurações

- Novo grupo **"Aparência"** com toggle de 3 temas (estilo iOS) e grid responsivo (`auto-fill, minmax(110px, 1fr)`) com 8 cards de paleta. Card ativo ganha glow dourado.
- Card de paleta mostra 3 swatches coloridos pré-visualizando as cores principais.
- Toast de confirmação ao trocar tema/paleta; mudanças aplicadas instantaneamente (sem reload).

#### Botão de configurações no header

- Novo botão de engrenagem em `js/layout/header.js`, ao lado da busca e do badge de XP — visível em todas as rotas.
- Classe `.app-header__search-btn` renomeada para `.app-header__icon-btn` (compartilhada entre busca e settings).

#### Correção de bugs do modo light

- Variáveis `--surface-overlay` / `--surface-overlay-strong` / `--surface-overlay-card` substituem rgba escuras hardcoded em `.app-header`, `.bottom-nav` e `.live-match-card`.
- Variáveis `--overlay-backdrop` / `--overlay-backdrop-strong` para backdrops (`search-overlay`, `pqc-backdrop`, `modo-jogo`).
- Gradientes que terminavam em `rgba(10,14,26,X)` substituídos por `var(--color-bg-card)` (`.card--gold`, `.calendar-import`, `.today-widget`, `.live-banner`, `.match-briefing`).
- Sombras (`--shadow-sm/md/lg`) com opacidade reduzida em modo light.

### Adicionado — Tratamento de erros e separação de chaves de API (2026-04-21)

#### `util/apiStatus.js`

- Registro global do último erro de API com tipos `NO_KEY`, `UNAUTHORIZED`, `RATE_LIMIT`, `NETWORK`, `HTTP` e mensagens em pt-BR via `describeApiError()`.
- Listeners reativos via `onApiStatusChange()` — UI re-renderiza banners automaticamente quando o estado muda.
- Helper `classifyHttpStatus(status)` mapeia 401/403 → unauthorized, 429 → rate limit.

#### Logs detalhados nas chamadas

- `js/api/match.js`, `js/api/squad.js` e `js/api/player.js` substituíram `try/catch` silenciosos por `console.error`/`console.warn` com path, status HTTP e payload errors da API-Football (que retorna 200 com `{errors: {...}}` em quota estourada).
- Banner amarelo `#match-api-banner` injetado na página de partida exibe a mensagem do erro corrente; reage em tempo real ao listener.
- Placeholders "Carregando..." na página de partida agora viram mensagens claras quando dados não chegam ("Indisponível — configure sua chave em Configurações").

#### Separação de chaves API

- **Bug corrigido**: o app usava o mesmo `state.settings.apiKey` para duas APIs diferentes (api-sports.io com header `x-apisports-key` e football-data.org com `X-Auth-Token`) — qualquer chave preenchida quebrava metade do app.
- Novos campos: `apiSportsKey` (api-sports) e `footballDataKey` (football-data); migration v3→v4 copia o legado `apiKey` para `apiSportsKey` (formato compatível) e remove o campo antigo.
- UI em /configurações com **2 campos independentes**, cada um validando contra seu endpoint próprio (`/status` para api-sports, `/competitions/PL` para football-data) e mostrando cota usada / liga autorizada.
- Salvar uma chave limpa **apenas os caches dela** (`cdh_match_*`/`cdh_squad_*`/`cdh_player_*` ou `cdh_league_*`).

### Adicionado — Card flutuante de partida ao vivo (2026-04-21)

- Novo `js/components/liveMatchCard.js` montado no shell global (`app.js`).
- Card fixo acima do bottom-nav (`bottom: nav-height + safe-area + 8px`) com glassmorphism + slide-in bouncy.
- Aparece quando há fixture com `matchPhase === 'live'` (incluindo cenários do modo demo).
- Layout: dot vermelho pulsante + minuto | times+placar | botão ×.
- Última linha discreta com último evento (`⚽ 65' João Silva`).
- Polling a cada 30s; busca em segundo plano via `fetchMatchData` para enriquecer com `elapsed` + último gol/cartão.
- Click navega para `/partida/<slug>` via router; oculto automaticamente nessa rota para o mesmo jogo.
- Botão "×" dispensa por 1h via `sessionStorage` (`cdh_live_dismissed_<id>`).
- Hook `onRouteChange()` esconde em transições de rota; responsivo (≤380px aperta padding/fonte).

### Adicionado — Modo demo global por query param (2026-04-21)

#### Cenários

- `?mock=pre` — pré-jogo, kickoff em 2 dias, countdown ativo.
- `?mock=halftime` — intervalo, placar 1×0.
- `?mock=live` — 2º tempo aos 65', placar 2×1, eventos rolando.
- `?mock=finished` — encerrado 3×1 com ratings, breakdown de gols, shot map, xG.
- `?mock=injuries-heavy` — pré-jogo com 6 desfalques (3 por time).
- `?mock=off` — desativa.

Persistido em `sessionStorage` (`cdh_mock_scenario`) — sobrevive à navegação interna sem precisar repor na URL.

#### Distribuição global de fixtures

- Quando qualquer cenário ativo, `applyMockToFixtures()` em `js/util/mockMode.js` transforma a lista do `FIXTURES` em uma Copa "em andamento" realista: ~50% finished com placares plausíveis (hash determinístico), 4 ao vivo (`2H`/`HT`), restante futuros (`NS`).
- Páginas que reagem: `inicio.js` (live banner, today widget, próximo jogo, tournament numbers), `jogos.js` (Match Center com filtros), `fanzone.js` (bolão e palpites resolvidos), `selecoes.js` (fixtures do time), `groupTable.js` (standings), `matchSections.js` (briefing pré-jogo).

#### Mocks procedurais (determinísticos)

- `js/util/mockData.js`: geradores que produzem o mesmo time → mesmos jogadores via hash do código.
- Squads de 23 jogadores com nomes plausíveis (pools de primeiros + sobrenomes globais), formação por time, posições agrupadas.
- Lineups com `grid` posicional ("linha:coluna") compatível com `lineupField.js`.
- Eventos por cenário (gols, cartões, subs, vermelho aos 78' no finished).
- Statistics escalonadas (×0.5 halftime, ×0.72 live, ×1.0 finished); bloco `players` com ratings.
- H2H 5 partidas, forma 5 jogos W/D/L com agregado, weather constante, injuries (1/time normal, 6 no `injuries-heavy`).
- Mocks também para campeonatos externos: `mockLeagueFixtures`, `mockLeagueStandings`, `mockLeagueTopScorers`, `mockPlayerDetails`.

#### Banner DEMO global

- `js/components/mockBanner.js` montado no shell — pill roxo "MODO DEMO" + select de cenário (troca recarrega a página) + botão "Desativar".
- Aparece em **todas** as rotas quando o modo está ativo.

### Adicionado — Página de partida enriquecida (2026-04-21)

Expansão informativa da rota `/partida/:slug` aproveitando campos da API-Football que já vinham no payload mas não eram renderizados, somados a duas novas integrações.

#### Nova aba "Escalação" (formação SVG)

- Componente `js/components/match/lineupField.js` desenha campo SVG (220×320) com 11 titulares posicionados via `grid` ("linha:coluna") da API.
- Aba adaptativa por fase: "Provável XI" pré-jogo, "Escalação" ao vivo, "Escalação Final" pós-jogo.
- Cores por time (azul mandante, dourado visitante), círculo numerado + sobrenome embaixo, hover com brilho.
- Banco completo listado abaixo de cada formação; clique em qualquer jogador abre o `playerQuickCard` (delegação já existente).
- Fallback elegante quando lineups ainda não foram divulgados.

#### Cards informativos novos

- **Arbitragem** (`renderRefereeCard`): nome do árbitro principal aparece em pré-jogo e pós-jogo. Dado já vinha em `fixture.referee` mas nunca era exibido.
- **Clima no estádio** (`renderWeatherCard`): integração com [open-meteo.com](https://open-meteo.com) (gratuito, sem chave). Temperatura, vento km/h, chance de chuva e ícone WMO localizado em pt-BR.
- **Desfalques** (`renderInjuriesList`): lista por time de lesionados/suspensos via novo endpoint `/injuries?fixture=`. Ícone por motivo (suspenso 🟥, doença 🤒, dúvida ❓, lesão 🩹) e clique abre ficha do jogador.
- **Forma recente** (`renderTeamForm`): tira dos últimos 5 jogos com células coloridas W/D/L (esmeralda/cinza/rosa) + agregado "3V · 8/4 gols". Endpoint `/fixtures?team=&last=5`.
- **Breakdown de gols** (`renderGoalBreakdown`): pills "⚽ Jogada · 🎯 Pênalti · 🔄 Contra" abaixo dos destaques pós-jogo.

#### Estatísticas expandidas

- `renderLiveStats` ganhou: chutes para fora, chutes bloqueados, impedimentos, defesas do goleiro, passes totais, cartões vermelhos.
- Reorganização da ordem visual: posse → ofensivo → defensivo → disciplina.

#### Camada de dados

- `js/api/match.js`: novos `fetchInjuries`, `fetchTeamForm`, `fetchWeather` seguindo o mesmo padrão de cache adaptativo (5min pré, 24h forma, 5min clima).
- Helper `apiGetExternal` para chamadas sem header `x-apisports-key` (open-meteo).

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
