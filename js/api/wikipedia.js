// Integrações com APIs públicas da Wikipedia e Wikimedia.
// Único lugar onde fetchs externos vivem — facilita mock/cache/rate-limit no futuro.

import { normalizeText } from '../util/html.js';

const WIKIPEDIA_API_BASE = 'https://pt.wikipedia.org/w/api.php';
const WIKIPEDIA_SUMMARY_BASE = 'https://pt.wikipedia.org/api/rest_v1/page/summary/';
const WIKIMEDIA_FEATURED_BASE = 'https://api.wikimedia.org/feed/v1/wikipedia/pt/featured';

const MAX_TEAM_NEWS_ITEMS = 3;
const MAX_TEAM_CURIOSITIES = 3;
const MAX_NEWS_SEARCH_DAYS = 3;
const MIN_CURIOSITY_LENGTH = 40;

const PT_SENTENCE_SEGMENTER = (typeof Intl !== 'undefined' && Intl.Segmenter)
  ? new Intl.Segmenter('pt', { granularity: 'sentence' })
  : null;

export async function fetchWikipediaTeamSummary(team) {
  const searchQueries = [
    `Seleção ${team.name} futebol`,
    `${team.name} seleção nacional de futebol`,
    `${team.name} futebol`
  ];

  let pageTitle = '';
  for (const query of searchQueries) {
    const searchUrl = `${WIKIPEDIA_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;
    const response = await fetch(searchUrl);
    if (!response.ok) continue;
    const data = await response.json();
    pageTitle = data?.query?.search?.[0]?.title || '';
    if (pageTitle) break;
  }

  if (!pageTitle) return null;

  const summaryUrl = `${WIKIPEDIA_SUMMARY_BASE}${encodeURIComponent(pageTitle)}`;
  const summaryResponse = await fetch(summaryUrl);
  if (!summaryResponse.ok) return null;
  const summaryData = await summaryResponse.json();

  return {
    title: summaryData?.title || pageTitle,
    description: summaryData?.description || '',
    extract: summaryData?.extract || '',
    url: summaryData?.content_urls?.desktop?.page || ''
  };
}

export async function fetchTeamNews(team) {
  const baseTime = Date.now();
  const teamName = normalizeText(team.name);

  for (let offset = 0; offset <= MAX_NEWS_SEARCH_DAYS; offset++) {
    const date = new Date(baseTime - (offset * 24 * 60 * 60 * 1000));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const requestUrl = `${WIKIMEDIA_FEATURED_BASE}/${year}/${month}/${day}`;
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) continue;
      const data = await response.json();
      const stories = (data?.news || []).map((story) => {
        const firstLink = story?.links?.[0];
        return {
          title: firstLink?.title || story?.story || '',
          url: firstLink?.content_urls?.desktop?.page || '',
          description: firstLink?.description || firstLink?.extract || ''
        };
      }).filter(item => item.title && item.url);

      const related = stories.filter((item) => {
        const fullText = normalizeText(`${item.title} ${item.description}`);
        return fullText.includes(teamName);
      });

      if (related.length) return related.slice(0, MAX_TEAM_NEWS_ITEMS);
    } catch (_error) {
      continue;
    }
  }

  return [];
}

export function extractCuriosities(text, max = MAX_TEAM_CURIOSITIES) {
  if (!text) return [];

  const sentences = PT_SENTENCE_SEGMENTER
    ? Array.from(PT_SENTENCE_SEGMENTER.segment(text), part => part.segment.trim())
    : text.split(/[.!?](?:\s+|$)/).map(item => item.trim());

  return sentences
    .filter(item => item.length > MIN_CURIOSITY_LENGTH)
    .slice(0, max);
}

export async function fetchWikipediaPlayerSummary(playerName) {
  const searchQueries = [
    `${playerName} futebolista`,
    `${playerName} jogador futebol`,
    playerName
  ];

  let pageTitle = '';
  for (const query of searchQueries) {
    const searchUrl = `${WIKIPEDIA_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&format=json&origin=*`;
    const response = await fetch(searchUrl);
    if (!response.ok) continue;
    const data = await response.json();
    const results = data?.query?.search || [];
    const match = results.find(r =>
      r.snippet?.toLowerCase().includes('futebol') ||
      r.snippet?.toLowerCase().includes('jogador') ||
      r.snippet?.toLowerCase().includes('gol')
    ) || results[0];
    pageTitle = match?.title || '';
    if (pageTitle) break;
  }

  if (!pageTitle) return null;

  const summaryUrl = `${WIKIPEDIA_SUMMARY_BASE}${encodeURIComponent(pageTitle)}`;
  const summaryResponse = await fetch(summaryUrl);
  if (!summaryResponse.ok) return null;
  const summaryData = await summaryResponse.json();

  return {
    title: summaryData?.title || pageTitle,
    description: summaryData?.description || '',
    extract: summaryData?.extract || '',
    url: summaryData?.content_urls?.desktop?.page || '',
    thumbnail: summaryData?.thumbnail?.source || ''
  };
}
