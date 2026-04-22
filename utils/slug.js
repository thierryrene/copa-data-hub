// Normalização de strings para URLs SEO-friendly.

export function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function deslugify(slug = '') {
  return String(slug).split('-').filter(Boolean).join(' ');
}
