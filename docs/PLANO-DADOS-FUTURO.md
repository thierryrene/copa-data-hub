# Plano de Dados — Fase Futura

> Decisões tomadas em abril/2026. O estado atual do app usa `data/enriched/teams.json` (curadoria manual).
> Este documento descreve o que implementar quando o app estiver estável e em produção.

---

## Contexto

O app atualmente opera com três camadas de dados:

| Camada | O que é | Status |
|---|---|---|
| `data.js` | 48 times, grupos, estádios, fixtures | ✅ Produção |
| `data/enriched/teams.json` | Facts, bio, curiosidades das 48 seleções | ✅ Produção |
| API-Football (`api-sports.io`) | Elenco, lineup, stats ao vivo, jogadores | ✅ Produção (key do usuário) |
| football-data.org | Campeonatos ao vivo (UCL, Brasileirão, PL) | ✅ Produção (key do usuário) |
| Wikipedia REST | Dossiê longo (bio extensa) | ✅ Produção |

---

## Plano Fase 2 — Dados de Jogadores

### Problema atual
Jogadores têm bio via Wikipedia (qualidade inconsistente) e stats via API-Football (requer key). Não há dados estruturados de curiosidades, carreira, títulos individuais.

### Solução proposta: `data/enriched/players/{slug}.json`

**Estrutura por arquivo:**
```json
{
  "slug": "vinicius-junior",
  "fullName": "Vinicius José Paixão de Oliveira Júnior",
  "born": "2000-07-12",
  "birthCity": "São Gonçalo, RJ, Brasil",
  "foot": "Direita",
  "height": "176cm",
  "nationalTeamCaps": 45,
  "nationalTeamGoals": 11,
  "clubs": [
    { "name": "Flamengo", "years": "2015–2018" },
    { "name": "Real Madrid", "years": "2018–presente" }
  ],
  "titles": [
    "UEFA Champions League 2022",
    "UEFA Champions League 2024",
    "La Liga 2021-22",
    "La Liga 2023-24"
  ],
  "bio": "Vinicius Júnior é um atacante brasileiro do Real Madrid...",
  "curiosities": [
    { "icon": "🏆", "category": "Títulos", "text": "..." },
    { "icon": "⭐", "category": "Prêmios", "text": "..." },
    { "icon": "📅", "category": "História", "text": "..." },
    { "icon": "🎯", "category": "Seleção", "text": "..." },
    { "icon": "🌎", "category": "Curiosidade", "text": "..." }
  ]
}
```

**Escopo sugerido:** top-3 jogadores de cada seleção = ~144 arquivos.

**Prioridade:** 15 seleções favoritas ao título (BRA, ARG, FRA, ENG, ESP, POR, GER, NED, BEL, ITA, CRO, COL, MAR, URU, JPN) = ~45 jogadores na primeira rodada.

---

## Plano Fase 2 — Script de Geração com Gemini

### Propósito
Usar a API do Gemini para gerar os arquivos JSON de jogadores com um prompt estruturado, eliminando o trabalho manual de pesquisa.

### Script: `scripts/generate-player.js`

```js
// Uso: GEMINI_API_KEY=xxx node scripts/generate-player.js "Vinicius Junior" BRA
// Gera: data/enriched/players/vinicius-junior.json
```

**Prompt base para o Gemini:**
```
Gere um JSON estruturado com informações sobre o jogador de futebol [NOME] que representa a seleção [PAÍS] na Copa do Mundo 2026. Inclua:

- slug (nome em kebab-case, sem acentos)
- fullName (nome completo)
- born (data de nascimento ISO: YYYY-MM-DD)
- birthCity (cidade e país de nascimento)
- foot ("Direita", "Esquerda" ou "Ambos")
- height (ex: "180cm")
- nationalTeamCaps (número estimado de jogos pela seleção até 2026)
- nationalTeamGoals (gols marcados pela seleção)
- clubs (array de {name, years} em ordem cronológica)
- titles (array de títulos principais, por extenso em português)
- bio (2 parágrafos em português sobre a carreira e importância do jogador)
- curiosities (array de 5 objetos: {icon: emoji, category: string, text: frase em português})
  - As categorias devem ser variadas: Títulos, Prêmios, História, Seleção, Curiosidade, Recordes

Retorne APENAS o JSON válido, sem markdown, sem comentários, sem texto adicional.
```

### Script: `scripts/generate-all-players.js`

Lê uma lista de jogadores de `scripts/players-list.json` e gera todos os arquivos em sequência com rate limiting (1 req/s para respeitar limites da API).

```json
// scripts/players-list.json
{
  "players": [
    { "name": "Vinicius Junior", "team": "BRA" },
    { "name": "Rodrygo Goes", "team": "BRA" },
    { "name": "Lionel Messi", "team": "ARG" },
    ...
  ]
}
```

---

## Plano Fase 2 — Atualização de `teams.json`

O arquivo atual foi gerado manualmente em abril/2026. Campos que precisam de revisão periódica:

| Campo | Frequência de mudança | Como atualizar |
|---|---|---|
| `coach` | A cada ciclo (1-2 anos) | Manual ou via Gemini |
| `worldCups` | Nunca (histórico) | — |
| `topScorer` | Raramente (jogadores ativos) | Verificar anualmente |
| `mostCaps` | Raramente (jogadores ativos) | Verificar anualmente |
| `curiosities` | Nunca (fatos históricos) | — |
| `continentalTitles` | Após cada torneio continental | Adicionar manualmente |

**Recomendação:** rodar `scripts/update-teams.js` anualmente com Gemini antes de cada grande torneio.

---

## Plano Fase 3 — TheSportsDB (opcional, sem key)

Se quisermos dados estruturados adicionais sem depender de curadoria manual:

```
GET https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t={nome}
```

Retorna: `strDescriptionPT` (bio em português), `intFormedYear`, `strStadium`, `strKitColour1/2`.

**Quando ativar:** se o arquivo `teams.json` ficar desatualizado e não houver tempo para curadoria manual.

---

## Plano Fase 3 — API-Football: Trophies Endpoint (opcional)

Para enriquecer perfis de jogadores com títulos reais (não estimados):

```
GET /trophies?player={id}
```

Retorna: lista de competições e temporadas vencidas.

**Custo:** 1 req por jogador aberto. Com 100 req/dia, priorizar jogadores mais buscados.

**Quando ativar:** quando o app tiver volume suficiente para justificar o gasto de quota.

---

## Decisões arquiteturais que NÃO mudam

1. **Wikimedia Featured News** — seção removida do app. Raramente retornava conteúdo relevante.
2. **Wikipedia** — mantido apenas para o bloco "Dossiê Enciclopédico" (texto longo). Não é mais fonte de curiosidades.
3. **Dados ao vivo** — sempre via API (API-Football e football-data.org). Nunca via arquivos estáticos.
4. **Dados históricos** — sempre via arquivos estáticos (`data/enriched/`). Nunca via API em tempo real.

---

## Estrutura de arquivos esperada (Fase 2 completa)

```
data/
└── enriched/
    ├── teams.json                    ✅ (existente)
    └── players/
        ├── vinicius-junior.json
        ├── rodrygo-goes.json
        ├── lionel-messi.json
        ├── kylian-mbappe.json
        ├── erling-haaland.json
        ├── cristiano-ronaldo.json
        └── ... (~144 arquivos)

scripts/
├── dev-server.js                     ✅ (existente)
├── generate-player.js                (a criar)
├── generate-all-players.js           (a criar)
├── update-teams.js                   (a criar)
└── players-list.json                 (a criar)
```

---

*Documento criado em abril/2026. Revisar antes de cada grande atualização do app.*
