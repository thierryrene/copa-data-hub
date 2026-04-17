// Registro central de páginas. Cada página exporta default { render, bindEvents }.
// app.js consome esta lista para montar as rotas sem if por nome.

import inicio from './inicio.js';
import jogos from './jogos.js';
import grupos from './grupos.js';
import fanzone from './fanzone.js';
import sedes from './sedes.js';
import configuracoes from './configuracoes.js';
import selecoes from './selecoes.js';
import jogadores from './jogadores.js';
import campeonatos from './campeonatos.js';

export const pages = {
  inicio,
  jogos,
  grupos,
  fanzone,
  sedes,
  configuracoes,
  selecoes,
  jogadores,
  campeonatos
};
