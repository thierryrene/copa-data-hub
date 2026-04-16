# Changelog

Todas as mudanças relevantes deste projeto são documentadas neste arquivo.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e o projeto adota [Conventional Commits](https://www.conventionalcommits.org/pt-br/) em pt-BR.

---

## [Não-publicado]

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
