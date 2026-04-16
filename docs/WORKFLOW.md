# Workflow de Desenvolvimento — CopaDataHub 2026

> Guia operacional para quem desenvolve o projeto (humanos e agentes). Para convenções de código e segurança, ver [AGENTS.md](../AGENTS.md).

---

## 1. Pré-requisitos

Só é preciso um servidor HTTP estático e um navegador moderno. **Não** instale nada com npm.

- **Servidor local** (escolha um):
  - `python3 -m http.server 3000` (Python 3 já vem no macOS/Linux)
  - `npx serve -s .` (se tiver Node.js)
  - Qualquer extensão "Live Server" do VSCode também serve.
- **Navegador:** Chrome/Edge/Firefox atualizado. Para testar o install prompt (A2HS), prefira **Chrome** ou **Edge**.
- **Git** configurado com usuário e email.

---

## 2. Setup e primeira execução

```bash
git clone <repo-url>
cd word-cup-app
python3 -m http.server 3000
```

Abra `http://localhost:3000`. Primeira visita mostra o onboarding (escolher nome + seleção favorita).

**Dica:** o MVP não tem Service Worker. Se aparecer cache teimoso em dev, use aba anônima ou DevTools → Network → "Disable cache".

**Roteamento SPA em dev:** servidores estáticos simples (`python3 -m http.server`) não fazem rewrite, então abrir `/groups` direto dá 404. Rode via `npx serve -s .` (flag `-s` serve `index.html` como fallback) ou navegue pela raiz. Em produção, os rewrites de [vercel.json](../vercel.json) cuidam disso.

---

## 3. Fluxo diário

### 3.1 Antes de começar

1. `git switch main && git pull`
2. Criar branch:
   - Feature: `git switch -c feat/<slug-curto>`
   - Bug: `git switch -c fix/<slug-curto>`
   - Chore/refactor: `git switch -c chore/<slug>` ou `refactor/<slug>`
3. Ler [AGENTS.md](../AGENTS.md) se for primeira vez no repo.

### 3.2 Durante o desenvolvimento

- Edite com servidor rodando; recarregue no navegador para ver mudança.
- Mudou JS/CSS? **Force reload** (Ctrl+Shift+R) ou desabilite cache nas DevTools.
- Adicionou rota SPA nova? Garanta que o padrão de rewrite em [vercel.json](../vercel.json) cobre (`"/((?!.*\\.).*)"` já pega tudo sem extensão).

### 3.3 Testes manuais (obrigatórios antes de PR)

Rode este checklist no navegador antes de abrir PR:

- [ ] **Onboarding:** em aba anônima, primeira visita mostra overlay. Escolher nome + time → app carrega em home.
- [ ] **Navegação:** os 5 botões do bottom-nav (Início / Jogos / Grupos / FanZone / Sedes) trocam de página sem erro no console.
- [ ] **Persistência:** adicionar XP (ex.: fazer trivia), recarregar, XP permanece no badge do header.
- [ ] **Offline:** DevTools → Network → "Offline" → navegar entre páginas continua funcionando (conteúdo estático).
- [ ] **PWA manifest:** DevTools → Application → Manifest sem erros.
- [ ] **Rotas diretas:** abrir `/groups`, `/stadiums` direto na URL carrega a página certa (em server com rewrite, como `npx serve -s .` ou Vercel).
- [ ] **Botão voltar:** navegar home → groups → stadiums; back retorna na ordem inversa sem recarregar.
- [ ] **Instalação:** no Chrome, deve aparecer banner "Instalar CopaDataHub" ou ícone de instalação na barra de endereço.
- [ ] **Console limpo:** sem erros vermelhos ao navegar por todas as páginas.
- [ ] **Mobile viewport:** DevTools → modo responsivo (iPhone 12, Pixel 5) — sem scroll horizontal, bottom-nav visível.
- [ ] **Dark mode:** checar visual em dark (padrão do app).

Para mudanças em fluxo de APIs externas (Wikipedia), testar online **e** com rede offline/lenta.

### 3.4 Commits

Formato: **Conventional Commits em pt-BR**.

```
<tipo>: <descrição curta no imperativo>

[corpo opcional explicando o porquê]
```

Tipos: `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `chore`, `test`.

Exemplos reais do histórico:
- `fix: validar URLs externas e estabilizar cálculo de datas nas notícias`
- `refactor: usar segmentação de sentenças para curiosidades da Wikipedia`
- `chore: otimizar sanitização e constantes de busca de notícias`

**Não** usar `--no-verify`, `--amend` em commits já empurrados, ou `push --force` em `main`.

### 3.5 Pull Request

```bash
git push -u origin <branch>
gh pr create
```

Template de descrição (copie para o corpo do PR):

```markdown
## O que muda
<1-3 bullets explicando o porquê e o impacto — não o o quê>

## Como testar
- [ ] <passo 1>
- [ ] <passo 2>
- [ ] Testes manuais do checklist de WORKFLOW.md

## Screenshots / GIFs
<obrigatório para mudanças visuais>
```

PR deve ser pequeno e focado. Se precisar refatorar "de lambuja", abra PR separado.

---

## 4. Deploy

### 4.1 Produção (Vercel)
- Deploy automático ao merge em `main` via [vercel.json](../vercel.json).
- Headers de cache: assets (`*.js`, `*.css`, `*.json`, imagens) são `immutable` por 1 ano.
- Rewrites SPA: `/champions/*` → `champions.html`; qualquer path sem extensão → `index.html`.
- **Não** altere `vercel.json` sem entender o efeito em deep-links e em A2HS.

### 4.2 Preview / Staging
- Vercel gera preview automático para cada PR.
- Link aparece como comentário no PR — use para validação visual e testes manuais.

### 4.3 Hotfix em produção
1. `git switch main && git pull`
2. `git switch -c fix/<slug>`
3. Corrigir + testar localmente.
4. PR com label `hotfix`.
5. Merge → deploy automático.
6. Validar em produção em seguida.

---

## 5. CI (GitHub Actions)

Ver [.github/workflows/ci.yml](../.github/workflows/ci.yml). Executa em cada push e PR:

- **Validação HTML** — `html-validate` sobre `index.html` e `champions.html`.
- **Lint JS** — `eslint` (instalado on-the-fly, sem `package.json`) sobre `js/**/*.js` com regras mínimas (sem `var`, sem `eval`, sem `console` solto).
- **Validação de manifest PWA** — checa que `manifest.json` é JSON válido e tem os campos mínimos.

CI **não** faz deploy — Vercel cuida disso direto do Git.

---

## 6. Troubleshooting

### Rota direta dá 404 em dev
- Servidor estático puro não faz rewrite. Use `npx serve -s .` (flag `-s`) ou navegue via links do próprio app.
- Em produção, [vercel.json](../vercel.json) cuida do fallback para `index.html`.

### Install prompt não aparece
- Precisa de HTTPS (ou `localhost`).
- Manifest precisa ser válido (DevTools → Application → Manifest).
- Navegador precisa achar o app "instalável" — alguns critérios de engajamento. Atenção: sem SW, Chrome Android ainda oferece A2HS, mas o `beforeinstallprompt` nativo pode não disparar; o botão em "Configurações" cai no fallback manual.

### LocalStorage corrompido em dev
- Reset rápido: DevTools → Application → Local Storage → Clear. Ou `localStorage.clear()` no console.
- A página `Configurações` do app também tem botão "Resetar dados".

### Fetch de Wikipedia falhando
- É esperado que falhe offline ou por CORS em alguns navegadores. Comportamento correto é **fallback gracioso** (ver [js/app.js](../js/app.js)), **não** tela branca.

---

## 7. Links úteis

- [AGENTS.md](../AGENTS.md) — convenções obrigatórias para agentes e humanos.
- [README.md](../README.md) — quick start e feature matrix.
- [Documentacao_CopaDataHub2026.pdf](../Documentacao_CopaDataHub2026.pdf) — visão de produto e roadmap.
- [vercel.json](../vercel.json) — configuração de deploy e rewrites SPA.
