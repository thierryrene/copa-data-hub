// Gestão dinâmica de meta tags para SEO e compartilhamento social.
// Chamado no render/bindEvents de cada página.

const DEFAULT_IMAGE = '/icons/icon-512.png';
const SITE_NAME = 'CopaDataHub 2026';

function ensureMeta(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
}

function setMetaName(name, content) {
  if (!content) return;
  const el = ensureMeta(`meta[name="${name}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('name', name);
    return m;
  });
  el.setAttribute('content', content);
}

function setMetaProperty(property, content) {
  if (!content) return;
  const el = ensureMeta(`meta[property="${property}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute('property', property);
    return m;
  });
  el.setAttribute('content', content);
}

function setCanonical(url) {
  const el = ensureMeta('link[rel="canonical"]', () => {
    const l = document.createElement('link');
    l.setAttribute('rel', 'canonical');
    return l;
  });
  el.setAttribute('href', url);
}

function setJsonLd(data) {
  let el = document.head.querySelector('script[data-seo="json-ld"]');
  if (data) {
    if (!el) {
      el = document.createElement('script');
      el.setAttribute('type', 'application/ld+json');
      el.setAttribute('data-seo', 'json-ld');
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  } else if (el) {
    el.remove();
  }
}

export function setSEO({
  title,
  description,
  canonical,
  image,
  keywords,
  type = 'website',
  jsonLd = null
} = {}) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME;
  const absCanonical = canonical
    ? new URL(canonical, window.location.origin).href
    : window.location.href;
  const absImage = new URL(image || DEFAULT_IMAGE, window.location.origin).href;

  document.title = fullTitle;
  setMetaName('description', description);
  setMetaName('keywords', keywords);
  setCanonical(absCanonical);

  setMetaProperty('og:site_name', SITE_NAME);
  setMetaProperty('og:title', fullTitle);
  setMetaProperty('og:description', description);
  setMetaProperty('og:url', absCanonical);
  setMetaProperty('og:image', absImage);
  setMetaProperty('og:type', type);
  setMetaProperty('og:locale', 'pt_BR');

  setMetaName('twitter:card', 'summary_large_image');
  setMetaName('twitter:title', fullTitle);
  setMetaName('twitter:description', description);
  setMetaName('twitter:image', absImage);

  setJsonLd(jsonLd);
}

export function schemaSportsTeam(team) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team.name,
    sport: 'Soccer',
    memberOf: {
      '@type': 'SportsOrganization',
      name: team.confederation
    },
    url: window.location.href
  };
}

export function schemaPerson(player) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: player.name,
    givenName: player.firstname || undefined,
    familyName: player.lastname || undefined,
    nationality: player.nationality || undefined,
    image: player.photo || undefined,
    birthDate: player.birth?.date || undefined,
    birthPlace: player.birth?.place || undefined,
    affiliation: player.currentTeam?.name
      ? { '@type': 'SportsTeam', name: player.currentTeam.name }
      : undefined,
    url: window.location.href
  };
}

export function schemaSportsEvent(league) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: league.name,
    sport: 'Soccer',
    url: window.location.href
  };
}

export function schemaWebApp() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_NAME,
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Any',
    url: window.location.origin
  };
}
