# 🏆 CopaDataHub 2026

> PWA open source de dados, previsões e bolão para o maior torneio de seleções do mundo — 48 seleções, 3 países, zero dependências.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen.svg)](manifest.json)
[![Zero Dependencies](https://img.shields.io/badge/deps-zero-orange.svg)](AGENTS.md)
[![Vanilla JS](https://img.shields.io/badge/stack-vanilla%20JS-yellow.svg)](js/app.js)

---

## ✨ Por que este projeto existe?

O CopaDataHub nasceu da vontade de construir uma experiência rica de Copa do Mundo **sem a complexidade de um framework**. É uma aposta na web plataforma: HTML5 + CSS Custom Properties + ES6 Modules entregam FCP < 1.5s mesmo em redes móveis congestionadas, sem build step, sem `node_modules`, sem lock-in.

É também um **laboratório aberto**: contribuições são bem-vindas, a arquitetura é intencionalmente legível, e cada decisão de design está documentada.

---

## 🚀 Quick Start

```bash
# Clone e sirva — é só isso
git clone https://github.com/thierryrene/copa-data-hub.git
cd copa-data-hub

# Opção recomendada (rewrite SPA incluso, deep-links funcionam)
node scripts/dev-server.js 3000

# Alternativas
npx serve -s .
python3 -m http.server 3000
```

Abra `http://localhost:3000` → escolha seu time favorito → explore. 🎉

> 💡 **Dica:** use aba anônima ou "Disable cache" nas DevTools para evitar cache teimoso em desenvolvimento.

---

## 📦 Stack

| Camada | Tecnologia | Motivo |
| ------ | ---------- | ------ |
| Markup | HTML5 semântico | FCP rápido, acessibilidade |
| Estilo | Vanilla CSS + Custom Properties | Dark mode, glassmorphism, zero runtime |
| Lógica | Vanilla JS ES6 Modules | Zero build, tree-shaking manual |
| Roteamento | History API (SPA) | URLs limpas em pt-BR |
| Persistência | `localStorage` | Offline-first sem backend |
| Deploy | Vercel (rewrites SPA) | CI/CD automático a partir de `main` |
| PWA | Manifest + A2HS | Instalável, sem Service Worker no MVP |

---

## 🗺️ Rotas

| URL | Página |
| --- | ------ |
| `/` | 🏠 Home — countdown + time favorito |
| `/jogos` | 📅 Match Center — calendário filtrável |
| `/partida/:slug` | ⚽ Partida — modos pré / ao-vivo / pós |
| `/grupos` | 🔢 Fase de Grupos — 12 grupos + tabelas |
| `/fanzone` | 🎮 FanZone — bolão, trivia, leaderboard |
| `/sedes` | 🏟️ Sedes — 16 estádios em EUA, México e Canadá |
| `/selecoes/:slug` | 🌎 Seleção — dossiê + escalação + elenco |
| `/jogadores/:slug` | 👤 Jogador — stats + perfil Wikipedia |
| `/campeonatos` | 🏅 Hub de ligas |
| `/campeonatos/:slug` | 📊 Liga — fixtures, standings, artilharia |
| `/configuracoes` | ⚙️ Configurações + reset de dados |

---

## 🗂️ Estrutura de Arquivos

```
copa-data-hub/
├── index.html                  # Shell do SPA + meta SEO + PWA tags
├── manifest.json               # PWA manifest (A2HS + fullscreen)
├── vercel.json                 # Rewrites SPA + headers de cache
├── robots.txt / sitemap.xml    # SEO
├── css/
│   └── style.css               # Design system completo (tokens, dark mode)
├── scripts/
│   └── dev-server.js           # Dev server com fallback SPA
├── js/
│   ├── app.js                  # Bootstrap + ROUTE_TABLE + prefetch
│   ├── router.js               # SPA router (History API, slugs pt-BR)
│   ├── data.js                 # Times, grupos, estádios, fixtures
│   ├── state.js                # Estado do usuário via localStorage
│   ├── icons.js                # Biblioteca SVG inline
│   ├── pwa.js                  # Install prompt handler
│   ├── api/
│   │   ├── wikipedia.js        # Wikipedia / Wikimedia
│   │   ├── teamLoader.js       # Cache + prefetch de dossiês
│   │   ├── squad.js            # Elenco via API-Football
│   │   ├── player.js           # Detalhes do jogador
│   │   ├── leagues.js          # Fixtures / standings / artilharia
│   │   └── match.js            # Fixture detalhada + h2h + cache
│   ├── util/
│   │   ├── html.js             # escapeHTML, isTrustedWikiUrl
│   │   ├── slug.js             # slugify / deslugify SEO
│   │   ├── seo.js              # setSEO + JSON-LD
│   │   └── match.js            # matchSlug, matchPhase, XP
│   ├── layout/
│   │   ├── header.js           # Header com XP badge
│   │   ├── bottomNav.js        # Bottom nav
│   │   ├── welcome.js          # Overlay de onboarding
│   │   └── layout.js           # Helpers de UI
│   ├── components/
│   │   ├── matchCard.js        # Card de jogo
│   │   ├── groupTable.js       # Tabela de grupo
│   │   ├── stadiumCard.js      # Card de estádio
│   │   ├── lineupField.js      # Escalação tática
│   │   ├── squadList.js        # Lista de elenco
│   │   ├── playerHero.js       # Hero do jogador
│   │   ├── playerStats.js      # Stats do jogador
│   │   ├── leagueCard.js       # Card de liga
│   │   ├── standingsTable.js   # Tabela de classificação
│   │   ├── topScorersList.js   # Artilharia
│   │   ├── predictionBar.js    # Barra de palpite
│   │   ├── countdown.js        # Contador regressivo
│   │   ├── xpBar.js            # Barra de XP
│   │   ├── statBar.js          # Barra de estatística
│   │   ├── toast.js            # Notificações toast
│   │   └── match/
│   │       ├── matchHero.js    # Hero adaptativo pré/live/pós
│   │       └── matchSections.js # h2h, key players, pulse, poll, recap
│   └── pages/
│       ├── inicio.js           # /
│       ├── jogos.js            # /jogos
│       ├── partida.js          # /partida/:slug
│       ├── grupos.js           # /grupos
│       ├── fanzone.js          # /fanzone
│       ├── sedes.js            # /sedes
│       ├── selecoes.js         # /selecoes/:slug
│       ├── jogadores.js        # /jogadores/:slug
│       ├── campeonatos.js      # /campeonatos[/:slug]
│       └── configuracoes.js    # /configuracoes
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## ✅ Features

| Feature | Status |
|---------|--------|
| Onboarding com seleção de time favorito | ✅ |
| Countdown para abertura do torneio | ✅ |
| Match Center com filtros (todos / ao vivo / próximos / finalizados) | ✅ |
| Página de partida — modos pré, ao vivo e pós-jogo | ✅ |
| 12 grupos com tabelas de classificação | ✅ |
| 16 estádios com filtro por país | ✅ |
| Dossiê de seleção com escalação provável + elenco completo | ✅ |
| Dossiê de jogador com stats + perfil Wikipedia | ✅ |
| Hub de campeonatos (UCL, Brasileirão, EPL) com standings e artilharia | ✅ |
| FanZone: bolão relâmpago + trivia + leaderboard | ✅ |
| Sistema de XP + níveis + streak diário | ✅ |
| URLs SEO-friendly em pt-BR + JSON-LD estruturado | ✅ |
| PWA instalável (A2HS + fullscreen, sem Service Worker) | ✅ |
| Dark mode nativo | ✅ |
| Configurações + reset de dados | ✅ |

---

## 🤝 Contribuindo

1. Fork → branch `feat/<slug>` ou `fix/<slug>`
2. Siga as convenções em [AGENTS.md](AGENTS.md) — serve tanto para humanos quanto para agentes de IA
3. Teste manualmente o checklist em [docs/WORKFLOW.md](docs/WORKFLOW.md)
4. Abra PR com descrição + screenshots para mudanças visuais

> ⚠️ **Importante:** este projeto não usa npm, bundler ou framework. Não abra PRs que introduzam dependências.

---

## 📄 Licença

MIT © [thierryrene](https://github.com/thierryrene)
