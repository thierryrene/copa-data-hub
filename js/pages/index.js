// Registro central de páginas. Cada página exporta default { render, bindEvents }.
// app.js consome esta lista para montar as rotas sem if por nome.

import home from './home.js';
import matches from './matches.js';
import groups from './groups.js';
import fanzone from './fanzone.js';
import stadiums from './stadiums.js';
import settings from './settings.js';
import team from './team.js';

export const pages = {
  home,
  matches,
  groups,
  fanzone,
  stadiums,
  settings,
  team
};
