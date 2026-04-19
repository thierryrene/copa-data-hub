---
applyTo: "js/components/**/*.js"
---

# Instruções para Componentes UI — CopaDataHub

## Design System
- Use **exclusivamente** as CSS Custom Properties definidas em `css/style.css` (ex: `var(--color-primary)`, `var(--spacing-md)`). Nunca valores hardcoded de cor, espaçamento ou tipografia.
- Classes utilitárias disponíveis: `.card`, `.btn`, `.badge`, `.skeleton`, `.chip` — prefira reutilizá-las a criar novas.

## Estado e Dados
- Leia estado do usuário via `js/state.js` (`getState()`, `setFavoriteTeam()`, etc.). Nunca acesse `localStorage` diretamente dentro de componentes.
- Dados de times, grupos, estádios e fixtures vêm de `js/data.js`. Não hardcode IDs ou slugs.

## Segurança
- Toda string de origem externa (API, Wikipedia, dados do usuário) **deve** passar por `escapeHTML()` de `js/util/html.js` antes de ser inserida no DOM via `innerHTML`.
- Prefira `textContent` para texto puro; use `innerHTML` só quando montar HTML estruturado, sempre com `escapeHTML`.

## Padrão de Componente
- Cada componente exporta uma função que retorna uma **string HTML** (não um Node DOM).
- Evite side effects no corpo do componente; use `requestAnimationFrame` ou listeners registrados fora do componente para interatividade.
- Nomes de função em camelCase, arquivo em camelCase: `matchCard.js` → `export function matchCard(...)`.

## Ícones
- Use `icons.js` para todos os SVGs inline. Nunca incorpore SVG diretamente no componente.
