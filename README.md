# 🏆 CopaDataHub 2026

**Progressive Web App** de dados, previsões e bolão para o maior torneio de seleções do mundo.

## Quick Start

```bash
# Servir localmente (qualquer servidor HTTP simples)
python3 -m http.server 3000

# Ou com Node.js
npx serve -s .
```

Acesse `http://localhost:3000` e clique "Instalar" para adicionar à tela inicial do celular.

## Arquitetura

```
word-cup-app/
├── index.html          # Shell do SPA + PWA meta tags
├── manifest.json       # PWA manifest (instalação)
├── vercel.json         # Rewrites SPA (History API) + cache de assets
├── css/
│   └── style.css       # Design system completo (Vanilla CSS)
├── js/
│   ├── app.js          # Controller principal + orquestração
│   ├── router.js       # SPA router (History API)
│   ├── data.js         # Dados do torneio (48 times, grupos, estádios)
│   ├── state.js        # Estado do usuário (LocalStorage)
│   ├── components.js   # Componentes reutilizáveis (cards, barras, etc)
│   ├── pages.js        # Renderizadores de página
│   ├── icons.js        # Biblioteca SVG (Lucide-inspired)
│   └── pwa.js          # PWA install handler
└── icons/
    ├── icon-192.png    # Ícone PWA pequeno
    └── icon-512.png    # Ícone PWA grande
```

## Stack

- **HTML5 Semântico** — FCP ultra-rápido
- **Vanilla CSS** — Design system com Custom Properties, dark mode, glassmorphism
- **Vanilla JS (ES6 Modules)** — Zero framework, controle total
- **PWA mínimo** — manifest + A2HS + `display: standalone` (sem Service Worker no MVP)
- **LocalStorage** — Persistência de XP, palpites e preferências

## Features (MVP)

| Feature | Status |
|---------|--------|
| Onboarding com seleção de time | ✅ |
| Countdown para abertura | ✅ |
| Match Center com stats + Previsão IA | ✅ |
| 12 Grupos com classificação | ✅ |
| FanZone: Bolão Relâmpago | ✅ |
| FanZone: Trivia com XP | ✅ |
| FanZone: Leaderboard | ✅ |
| 16 Estádios com filtros | ✅ |
| Sistema de XP + Níveis + Streak | ✅ |
| Toast notifications | ✅ |
| PWA instalável (A2HS + fullscreen) | ✅ |
| Configurações + reset | ✅ |

## Próximas Fases

- [ ] Integração com API-Football (dados reais)
- [ ] Simulador de Chaveamento (495 combinações)
- [ ] WebSockets para dados ao vivo
- [ ] Push notifications
- [ ] Compartilhamento social (imagem do palpite)
- [ ] Deploy (GitHub Pages / Vercel)
