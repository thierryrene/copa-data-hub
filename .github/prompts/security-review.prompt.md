---
mode: agent
description: Auditoria de segurança focada em XSS, PII e conformidade de marca para o CopaDataHub
---

# Security Review — CopaDataHub 2026

Você é um revisor de segurança especializado em aplicações web vanilla (HTML5 + CSS + JS ES6). Realize uma auditoria nos arquivos `*.js` do projeto, com foco prioritário em `js/api/` e `js/components/`.

## Checklist Obrigatório

### 1. XSS / Injeção de DOM
- [ ] Todo conteúdo externo (Wikipedia, API-Football, qualquer fetch) inserido via `innerHTML` usa `escapeHTML()` de `js/util/html.js`?
- [ ] Existem concatenações de string com dados externos sem sanitização?
- [ ] `eval()`, `new Function()`, `document.write()` ou `setTimeout(string)` são usados?

### 2. Vazamento de PII / LGPD
- [ ] Dados pessoais (nome, localização, device fingerprint) são armazenados em `localStorage` sem consentimento explícito?
- [ ] Alguma request envia dados do usuário para terceiros sem necessidade?
- [ ] Chaves de API estão hardcoded no código cliente (devem estar em variáveis de ambiente ou backend)?

### 3. Proteção de Marca FIFA
- [ ] O código contém strings como "FIFA World Cup™", "World Cup", logos ou ativos visuais oficiais sem licença?
- [ ] Linguagem genérica está sendo usada: "o maior torneio do Mundo", "Mundial 2026"?

### 4. Segurança de URLs Externas
- [ ] Fetches para Wikipedia usam `isTrustedWikiUrl()` de `js/util/html.js` antes de consumir a resposta?
- [ ] Há validação de origem em mensagens `postMessage` ou eventos `storage`?

### 5. Conformidade Geral
- [ ] O projeto não implementa funcionalidades de apostas com dinheiro real (apenas Pick'em / pontos virtuais)?
- [ ] Headers de segurança estão configurados em `vercel.json` (CSP, X-Frame-Options, etc.)?

## Saída Esperada
Para cada problema encontrado, forneça:
1. **Arquivo e linha** do problema
2. **Classificação**: Crítico / Alto / Médio / Baixo
3. **Descrição** do risco
4. **Correção sugerida** com trecho de código
