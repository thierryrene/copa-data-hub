# Guia de Coleta de Dados — CopaDataHub 2026

> Use este documento para solicitar dados de seleções a uma IA ou para buscá-los diretamente via API.
> O padrão JSON descrito aqui é o que alimenta `data/enriched/teams.json`.

---

## 1. Estrutura esperada por seleção

```json
{
  "CÓDIGO": {
    "nickname": "Apelido popular da seleção (ex: A Canarinha, Les Bleus)",
    "founded": 1914,
    "coach": "Nome completo do técnico atual",
    "worldCups": [1958, 1962, 1970],
    "bestResult": "Campeão (3×)",
    "continentalTitles": [
      {
        "competition": "Nome oficial do torneio continental",
        "years": [1919, 1922, 1949]
      }
    ],
    "topScorer": { "name": "Nome do jogador", "goals": 79 },
    "mostCaps": { "name": "Nome do jogador", "caps": 150 },
    "bio": "Parágrafo único de 2 a 3 frases sobre a identidade e história da seleção.",
    "curiosities": [
      { "icon": "🏆", "category": "Títulos",     "text": "..." },
      { "icon": "⭐", "category": "Estrelas",    "text": "..." },
      { "icon": "📅", "category": "História",    "text": "..." },
      { "icon": "🎯", "category": "Recordes",    "text": "..." },
      { "icon": "🌎", "category": "Curiosidade", "text": "..." }
    ]
  }
}
```

---

## 2. Regras de preenchimento por campo

### `nickname`
- Apelido mais conhecido internacionalmente.
- Usar o idioma original ou o nome consagrado em português.
- Exemplos: "A Canarinha", "Les Bleus", "La Albiceleste", "Die Mannschaft".

### `founded`
- Ano de fundação da federação nacional de futebol.
- Fonte confiável: Wikipedia da federação ou site oficial da FIFA.

### `coach`
- Nome completo do técnico **titular atual** — não interino.
- Verificar se houve mudança recente (demissão, renúncia) antes de confirmar.

### `worldCups`
- Array de anos em que a seleção foi **campeã mundial** — somente títulos.
- Não incluir anos de vice ou terceiro lugar.
- Verificar na Wikipedia da Copa do Mundo de cada ano.

### `bestResult`
- String descritiva resumindo o melhor resultado geral.
- Campeões: `"Campeão (5×)"` / `"Campeão (2×)"`.
- Não campeões: `"Vice-campeão (2×)"` ou `"Terceiro lugar (1×)"` etc.

### `continentalTitles`
- Array de objetos, um por competição continental.
- Incluir **apenas títulos confirmados**, não finais perdidas.
- Torneios aceitos por confederação:
  - CONMEBOL: Copa América
  - UEFA: UEFA Eurocopa, UEFA Nations League
  - CAF: Copa Africana das Nações
  - AFC: Copa da Ásia da AFC
  - CONCACAF: Copa Ouro da CONCACAF
  - OFC: Copa das Nações da OFC
- Ordenar os `years` em ordem crescente.

### `topScorer`
- Maior artilheiro de **todos os tempos** pela seleção (qualquer competição oficial).
- Verificar contagem oficial da federação ou FIFA — pode haver divergência entre fontes.
- Incluir apenas gols em jogos oficiais reconhecidos pela FIFA.

### `mostCaps`
- Jogador com mais partidas disputadas pela seleção em jogos oficiais.
- Mesma critério de contagem da FIFA.

### `bio`
- **2 a 3 frases** sobre a identidade, estilo de jogo e importância histórica da seleção.
- Tom enciclopédico, presente.
- Não mencionar resultados recentes de temporada — foco em identidade duradoura.

### `curiosities` — regras por categoria

Cada item deve ter exatamente: `icon` (emoji), `category` (string fixa abaixo), `text` (frase).

| category | O que deve conter | O que NÃO colocar |
|---|---|---|
| `Títulos` | Fato sobre conquistas, taças, recordes de títulos | Stats de jogadores individuais |
| `Estrelas` | Jogadores icônicos ou atuais, com dado concreto | Informação desatualizada (ex: artilheiro que perdeu o posto) |
| `História` | Momento, narrativa ou episódio histórico marcante | Estatísticas secas sem contexto narrativo |
| `Recordes` | Recordes da seleção como instituição (partidas, gols, sequências) | Recordes de outros países dentro do texto |
| `Curiosidade` | Fato inusitado, polêmico ou pouco conhecido | Repetir informação já dita em outro bloco |

- Cada texto deve ter **entre 1 e 3 frases**.
- Sempre em **português do Brasil**.
- Usar dados verificáveis — evitar estimativas vagas como "um dos melhores".
- Não contradizer dados de outros campos (ex: se `topScorer` é Neymar, o bloco `Estrelas` não pode citar Pelé como artilheiro).

---

## 3. Prompt pronto para solicitar a uma IA

Copie e cole o bloco abaixo, substituindo `[NOME DA SELEÇÃO]` e `[CÓDIGO FIFA]`:

```
Preciso de dados estruturados para a seleção de [NOME DA SELEÇÃO] ([CÓDIGO FIFA]) para um aplicativo sobre a Copa do Mundo 2026.

Retorne APENAS o JSON abaixo, preenchido com dados reais e verificados. Sem markdown, sem comentários, sem texto adicional.

Regras obrigatórias:
- "coach": técnico titular atual (não interino). Se houve mudança recente em 2025/2026, use o nome atual.
- "worldCups": apenas anos em que a seleção foi campeã mundial.
- "continentalTitles": apenas títulos conquistados — não incluir vice-campeonatos.
- "topScorer" e "mostCaps": contagem oficial FIFA de jogos/gols em partidas oficiais.
- "bio": 2 a 3 frases sobre identidade e história da seleção, em português do Brasil.
- "curiosities": exatamente 5 itens, um para cada category abaixo. Cada texto deve ser uma frase concreta com dado verificável, em português do Brasil. Sem contradições entre os campos.

Categorias obrigatórias para curiosities (nessa ordem):
1. "Títulos"    — fato sobre conquistas ou recordes de títulos da seleção
2. "Estrelas"   — jogador icônico ou atual com dado concreto e atualizado
3. "História"   — narrativa ou episódio histórico marcante (não apenas estatística seca)
4. "Recordes"   — recorde da seleção como instituição
5. "Curiosidade"— fato inusitado ou pouco conhecido

{
  "[CÓDIGO FIFA]": {
    "nickname": "",
    "founded": 0,
    "coach": "",
    "worldCups": [],
    "bestResult": "",
    "continentalTitles": [
      { "competition": "", "years": [] }
    ],
    "topScorer": { "name": "", "goals": 0 },
    "mostCaps": { "name": "", "caps": 0 },
    "bio": "",
    "curiosities": [
      { "icon": "🏆", "category": "Títulos",     "text": "" },
      { "icon": "⭐", "category": "Estrelas",    "text": "" },
      { "icon": "📅", "category": "História",    "text": "" },
      { "icon": "🎯", "category": "Recordes",    "text": "" },
      { "icon": "🌎", "category": "Curiosidade", "text": "" }
    ]
  }
}
```

---

## 4. Prompt para atualização parcial (revisão de seleção existente)

Use quando quiser revisar apenas um campo ou bloco de uma seleção já existente:

```
Preciso revisar os dados da seleção [NOME DA SELEÇÃO] no JSON abaixo. Verifique:
- Se o técnico ("coach") ainda está no cargo em [MÊS/ANO].
- Se "topScorer" e "mostCaps" refletem a contagem oficial mais recente.
- Se algum "curiosities" contém informação desatualizada ou contraditória com outro campo.

Retorne APENAS os campos que precisam ser corrigidos, no mesmo formato JSON.
Se um campo está correto, não o inclua na resposta.

[COLE O BLOCO JSON DA SELEÇÃO AQUI]
```

---

## 5. Coleta via API — referências técnicas

### 5.1 FIFA / Dados Oficiais

A FIFA não disponibiliza API pública. Os dados oficiais (ranking, estatísticas históricas) devem ser consultados em:
- Ranking FIFA: `https://www.fifa.com/fifa-world-ranking/men`
- Estatísticas oficiais por seleção: páginas individuais em `https://www.fifa.com/fifaplus/en/associations`

---

### 5.2 API-Football (api-sports.io) — requer chave

Base URL: `https://v3.football.api-sports.io`
Header obrigatório: `x-apisports-key: SUA_CHAVE`

| Dado | Endpoint | Parâmetros úteis |
|---|---|---|
| Elenco atual | `GET /players/squads` | `team={id}` |
| Estatísticas de jogador | `GET /players` | `id={id}&season=2025` |
| Artilheiro histórico (trophies) | `GET /trophies` | `player={id}` |
| Técnico atual | `GET /teams` | `id={id}` → campo `coach` |
| Jogos da seleção | `GET /fixtures` | `team={id}&season=2026` |

IDs de seleções relevantes: Brasil=6, Argentina=26, França=2, Alemanha=25, Espanha=9, Portugal=27.

Limite free tier: 100 req/dia.

---

### 5.3 football-data.org — requer chave (tier gratuito disponível)

Base URL: `https://api.football-data.org/v4`
Header: `X-Auth-Token: SUA_CHAVE`

| Dado | Endpoint |
|---|---|
| Dados da seleção | `GET /teams/{id}` |
| Competições disponíveis | `GET /competitions` |
| Jogos de uma competição | `GET /competitions/{code}/matches` |

Códigos de competição úteis: `WC` (Copa do Mundo), `CL` (Champions League), `BSA` (Brasileirão).

---

### 5.4 Wikipedia REST API — sem chave

Base URL: `https://en.wikipedia.org/api/rest_v1` (ou `pt.wikipedia.org`)

| Dado | Endpoint |
|---|---|
| Resumo da seleção | `GET /page/summary/{título}` |
| Artigo completo em HTML | `GET /page/html/{título}` |

Exemplos de títulos:
- `Brazil_national_football_team`
- `Argentina_national_football_team`
- `2026_FIFA_World_Cup`

Para português: trocar `en.wikipedia.org` por `pt.wikipedia.org`.

Campos retornados úteis:
- `extract`: resumo textual (500–1000 palavras)
- `description`: descrição curta (1 linha)
- `content_urls.desktop.page`: URL canônica para exibir no app

---

### 5.5 TheSportsDB — sem chave (tier gratuito)

Base URL: `https://www.thesportsdb.com/api/v1/json/3`

| Dado | Endpoint |
|---|---|
| Busca por nome de seleção | `GET /searchteams.php?t={nome}` |
| Dados completos por ID | `GET /lookupteam.php?id={id}` |

Campos úteis retornados:
- `strDescriptionPT`: bio em português
- `intFormedYear`: ano de fundação
- `strStadium`: estádio base
- `strKitColour1`: cor primária do uniforme

Exemplo: `GET /searchteams.php?t=Brazil`

Limitação: dados históricos desatualizados com frequência — usar apenas para campos estáticos (fundação, cor).

---

### 5.6 Wikidata SPARQL — sem chave

Endpoint: `https://query.wikidata.org/sparql`

Útil para dados estruturados como anos de títulos, recordistas históricos.

Exemplo de query para artilheiro histórico do Brasil:
```sparql
SELECT ?playerLabel ?goals WHERE {
  ?player wdt:P54 wd:Q43468 .        # jogou na seleção brasileira
  ?player wdt:P184 ?goals .           # gols marcados
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,en". }
}
ORDER BY DESC(?goals)
LIMIT 5
```

> Nota: Wikidata nem sempre reflete atualizações recentes. Cruzar com fontes jornalísticas para confirmar.

---

## 6. Fluxo recomendado de coleta

```
1. IA (Claude / ChatGPT / Gemini)
   └─ Use o Prompt da Seção 3
   └─ Valide manualmente os campos: coach, topScorer, mostCaps
   └─ Cruze curiosities com os dados dos outros campos

2. Revisão manual obrigatória
   └─ Verificar técnico atual no site oficial da federação ou FIFA
   └─ Confirmar artilheiro/recordista na Wikipedia da seleção
   └─ Verificar títulos continentais na Wikipedia do torneio

3. API (opcional — para dados ao vivo ou volume grande)
   └─ API-Football → elenco, stats de jogadores
   └─ football-data.org → partidas e competições
   └─ TheSportsDB → dados estáticos básicos

4. Inserção no teams.json
   └─ Adicionar no objeto "teams" com a chave = código FIFA (3 letras, maiúsculo)
   └─ Manter ordenação alfabética por código
   └─ Validar JSON: node -e "JSON.parse(require('fs').readFileSync('data/enriched/teams.json','utf8'))"
```

---

## 7. Campos que exigem revisão periódica

| Campo | Com que frequência muda | Quando revisar |
|---|---|---|
| `coach` | A cada 1–2 anos | Antes de cada torneio importante |
| `topScorer` / `mostCaps` | Raramente (jogadores ativos) | Anualmente |
| `worldCups` | Nunca (histórico imutável) | — |
| `continentalTitles` | Após cada torneio continental | Após Copa América, Eurocopa etc. |
| `curiosities` | Quando dados de outros campos mudam | Junto com o campo relacionado |
| `bio` | Raramente | Somente se a identidade da seleção mudar significativamente |

---

*Documento criado em abril/2026. Parte do projeto CopaDataHub 2026.*
