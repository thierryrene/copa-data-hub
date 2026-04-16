# GitHub Copilot — Instruções do repositório

> Arquivo oficial reconhecido pelo GitHub Copilot (ver [docs](https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot)). Leia **[AGENTS.md](../AGENTS.md) primeiro** — é a fonte canônica de convenções, segurança, PWA e workflow. Este arquivo só adiciona comportamentos específicos desta ferramenta.

## Resumo executivo para Copilot

**CopaDataHub 2026** — PWA vanilla (HTML/CSS/JS ES6 modules) para o Mundial 2026. Zero build step, zero dependências npm, mobile-first, pt-BR.

## Regras duras (não sugerir código que viole)

1. **Sem dependências externas:** não há `package.json`. Nunca sugira `npm install` ou `import from 'lodash'`. Implementações vanilla apenas.
2. **Sem frameworks:** React/Vue/Svelte/Next.js estão **fora** do MVP. Se parecer natural sugerir, não sugira.
3. **XSS hygiene:** strings externas sempre por `escapeHTML()` ([js/app.js:23](../js/app.js#L23)) antes de `innerHTML`. URLs externas sempre validadas por allowlist (`isTrustedWikiUrl` em [js/app.js:34](../js/app.js#L34)).
4. **Sem Service Worker no MVP:** PWA é só manifest + A2HS + `display: standalone`. Não reintroduzir SW/cache offline sem decisão explícita.
5. **Estado:** `localStorage` acessado apenas via helpers de [js/state.js](../js/state.js).
6. **Idioma:** identificadores em inglês, UI/comentários/commits em pt-BR.
7. **Produto:** sem menções a marcas FIFA oficiais; sem "apostas com dinheiro real" — é Pick'em / Daily Fantasy.

## Estilo de código

- Vanilla JS ES6 modules, `const`/`let` (nunca `var`), arrow functions para callbacks.
- CSS via Custom Properties do design system em [css/style.css](../css/style.css) — consumir tokens `--color-*`, `--space-*`, `--radius-*` antes de criar valor novo.
- Preferir `const` + funções puras; evitar classes exceto onde já existem (`App` em [js/app.js](../js/app.js), `Router` em [js/router.js](../js/router.js)).
- Sem comentários óbvios. Ver seção 3.6 de [AGENTS.md](../AGENTS.md) — padrão é **não comentar**.

## Mensagens de commit

- Conventional Commits em **pt-BR**: `fix:`, `feat:`, `chore:`, `refactor:`, `docs:`, `perf:`, `style:`.
- Foco no **porquê**, não no o quê. Exemplo do histórico: `fix: validar URLs externas e estabilizar cálculo de datas nas notícias`.

## Quando pedir contexto antes de completar

- Mudanças que tocam múltiplos módulos (ex.: adicionar campo novo ao `appState`).
- Integração com nova API externa — exige função de validação de URL e tratamento offline.
- Mudança em rota do SPA (adicionar nova aba ao bottom-nav) — exige tocar em [index.html](../index.html), [js/router.js](../js/router.js), [js/app.js](../js/app.js), [js/pages.js](../js/pages.js) e [css/style.css](../css/style.css).
