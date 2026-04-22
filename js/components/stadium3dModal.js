// Modal fullscreen com vista satélite/3D do estádio.
// Usa iframe do Google Maps em modo satélite (sem chave de API).
// O usuário pode rotacionar/inclinar com gestos dentro do iframe.

import { icon } from '../icons.js';
import { escapeHTML } from '../util/html.js';

const HOST_ID = 'stadium-3d-host';

function buildEmbedSrc(stadium) {
  // Google Maps embed sem chave, vista satélite, zoom 18
  // (q= centra no ponto, t=k = satélite/aérea, z = zoom)
  return `https://maps.google.com/maps?q=${stadium.lat},${stadium.lng}&t=k&z=18&hl=pt-BR&output=embed`;
}

function externalUrl(stadium) {
  // Abre o Google Earth com tilt/rotação 3D real numa nova aba.
  return `https://earth.google.com/web/@${stadium.lat},${stadium.lng},150a,500d,35y,0h,60t,0r`;
}

function modalHTML(stadium) {
  const flag = stadium.country === 'EUA' ? '🇺🇸' : stadium.country === 'México' ? '🇲🇽' : '🇨🇦';
  return `
    <div class="stadium-3d__backdrop" data-close></div>
    <div class="stadium-3d__panel" role="dialog" aria-label="Vista do estádio ${escapeHTML(stadium.name)}">
      <header class="stadium-3d__head">
        <div>
          <div class="stadium-3d__name">${flag} ${escapeHTML(stadium.name)}</div>
          <div class="stadium-3d__sub">
            ${escapeHTML(stadium.city)}, ${escapeHTML(stadium.country)} · ${stadium.capacity.toLocaleString('pt-BR')} lugares
          </div>
        </div>
        <div class="stadium-3d__actions">
          <a class="stadium-3d__btn" href="${externalUrl(stadium)}" target="_blank" rel="noopener" title="Abrir no Google Earth (tour 3D)">
            ${icon('mapPin', 16)} Ver em 3D
          </a>
          <button class="stadium-3d__close" type="button" data-close aria-label="Fechar">×</button>
        </div>
      </header>
      <div class="stadium-3d__viewer">
        <iframe
          src="${buildEmbedSrc(stadium)}"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
          allowfullscreen
          title="Vista satélite de ${escapeHTML(stadium.name)}"
        ></iframe>
      </div>
      <footer class="stadium-3d__foot">
        <span>📡 Vista satélite · arraste para explorar</span>
      </footer>
    </div>
  `;
}

let onKeydown = null;

export function openStadium3D(stadium) {
  if (!stadium) return;
  closeStadium3D();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.className = 'stadium-3d';
  host.innerHTML = modalHTML(stadium);
  document.body.appendChild(host);
  document.body.style.overflow = 'hidden';

  host.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeStadium3D();
  });
  onKeydown = (e) => { if (e.key === 'Escape') closeStadium3D(); };
  document.addEventListener('keydown', onKeydown);

  requestAnimationFrame(() => host.classList.add('stadium-3d--open'));
}

export function closeStadium3D() {
  const host = document.getElementById(HOST_ID);
  if (!host) return;
  host.remove();
  document.body.style.overflow = '';
  if (onKeydown) {
    document.removeEventListener('keydown', onKeydown);
    onKeydown = null;
  }
}
