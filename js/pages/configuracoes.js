import { icon } from '../icons.js';
import { getTeam } from '../data.js';
import { renderXPBar } from '../components/xpBar.js';
import { showToast } from '../components/toast.js';
import { getXPProgress, saveState } from '../state.js';
import { triggerInstall } from '../pwa.js';
import { escapeHTML } from '../util/html.js';
import { setSEO } from '../util/seo.js';
import { THEMES, THEME_LABEL, PALETTES, PALETTE_META, setTheme, setPalette } from '../util/theme.js';

function render(state) {
  const { level, xp } = getXPProgress(state);
  const favTeam = state.user.favoriteTeam ? getTeam(state.user.favoriteTeam) : null;

  return `
    <h1 class="section-title">${icon('settings', 20)} Configurações</h1>

    <div class="card card--gold mb-xl">
      <div class="flex items-center gap-lg">
        ${favTeam
          ? `<a class="settings-profile__avatar settings-profile__avatar--link" href="/selecoes/${favTeam.slug}" data-route-link data-team-prefetch="${favTeam.code}" aria-label="Ver detalhes de ${favTeam.name}">${favTeam.flag}</a>`
          : `<div class="settings-profile__avatar">⚽</div>`}
        <div>
          <div class="font-display font-bold" style="font-size: var(--text-lg);">${state.user.name || 'Torcedor'}</div>
          <div class="text-sm text-muted">Nível ${level} · ${xp} XP · ${state.user.streak} dias de streak</div>
          ${favTeam
            ? `<a class="settings-profile__team-link" href="/selecoes/${favTeam.slug}" data-route-link data-team-prefetch="${favTeam.code}">${favTeam.flag} ${escapeHTML(favTeam.name)} →</a>`
            : ''}
        </div>
      </div>
      ${renderXPBar(state)}
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Aparência</div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          ${icon('sparkles', 20, 'text-gold')}
          <div>
            <div class="settings-item__label">Tema</div>
            <div class="settings-item__desc">Claro, escuro ou seguir o sistema operacional.</div>
          </div>
        </div>
        <div class="theme-toggle" id="theme-toggle" role="radiogroup" aria-label="Tema">
          ${THEMES.map(t => `
            <button class="theme-toggle__btn ${state.settings.theme === t ? 'theme-toggle__btn--active' : ''}"
                    type="button" role="radio" aria-checked="${state.settings.theme === t}"
                    data-theme="${t}">
              ${THEME_LABEL[t]}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          ${icon('target', 20, 'text-blue')}
          <div>
            <div class="settings-item__label">Paleta de cores</div>
            <div class="settings-item__desc">Combinação de cores de destaque do app.</div>
          </div>
        </div>
        <div class="palette-grid" id="palette-grid" role="radiogroup" aria-label="Paleta">
          ${PALETTES.map(p => {
            const meta = PALETTE_META[p];
            const active = state.settings.palette === p;
            return `
              <button class="palette-card ${active ? 'palette-card--active' : ''}"
                      type="button" role="radio" aria-checked="${active}"
                      data-palette="${p}">
                <div class="palette-card__swatches">
                  ${meta.swatches.map(c => `<span style="background:${c}"></span>`).join('')}
                </div>
                <span class="palette-card__lbl">${escapeHTML(meta.label)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Geral</div>

      <div class="settings-item" id="setting-install">
        <div class="settings-item__left">
          ${icon('download', 20, 'text-gold')}
          <div>
            <div class="settings-item__label">Instalar App</div>
            <div class="settings-item__desc">Adicionar à tela inicial do celular</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>

      <div class="settings-item" id="setting-notifications">
        <div class="settings-item__left">
          ${icon('bell', 20, 'text-blue')}
          <div>
            <div class="settings-item__label">Notificações</div>
            <div class="settings-item__desc">Alertas de gols e resultados</div>
          </div>
        </div>
        <div class="toggle ${state.settings.notifications ? 'active' : ''}" id="toggle-notifications"></div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Chaves de API</div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          ${icon('shield', 20, 'text-gold')}
          <div>
            <div class="settings-item__label">API-Football <span class="api-key-tag">api-sports.io</span></div>
            <div class="settings-item__desc">
              Partidas da Copa, escalações, jogadores e estatísticas.
              <a href="https://www.api-football.com/" target="_blank" rel="noopener">Obter chave</a> (100 req/dia grátis).
            </div>
          </div>
        </div>
        <div class="api-key-row">
          <input
            type="password"
            id="setting-apisports-key"
            class="api-key-input"
            placeholder="cole sua chave da API-Football"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHTML(state.settings.apiSportsKey || '')}"
          >
          <button class="btn btn--primary btn--sm" id="setting-apisports-save">Salvar</button>
        </div>
        <div id="setting-apisports-status" class="api-key-status text-xs text-muted"></div>
      </div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          ${icon('target', 20, 'text-blue')}
          <div>
            <div class="settings-item__label">football-data.org <span class="api-key-tag">v4</span></div>
            <div class="settings-item__desc">
              Outros campeonatos (Champions, Brasileirão, Premier League).
              <a href="https://www.football-data.org/client/register" target="_blank" rel="noopener">Obter chave</a> (10 req/min grátis).
            </div>
          </div>
        </div>
        <div class="api-key-row">
          <input
            type="password"
            id="setting-fdata-key"
            class="api-key-input"
            placeholder="cole sua chave da football-data.org"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHTML(state.settings.footballDataKey || '')}"
          >
          <button class="btn btn--primary btn--sm" id="setting-fdata-save">Salvar</button>
        </div>
        <div id="setting-fdata-status" class="api-key-status text-xs text-muted"></div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Sobre</div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('info', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">CopaDataHub 2026</div>
            <div class="settings-item__desc">MVP v1.0 · PWA Instalável</div>
          </div>
        </div>
      </div>

      <div class="settings-item">
        <div class="settings-item__left">
          ${icon('shield', 20, 'text-muted')}
          <div>
            <div class="settings-item__label">Privacidade</div>
            <div class="settings-item__desc">Seus dados ficam no seu dispositivo</div>
          </div>
        </div>
        ${icon('chevronRight', 18, 'text-muted')}
      </div>
    </div>

    <div class="mt-xl text-center">
      <button class="btn btn--ghost btn--sm text-rose" id="btn-reset-data">Resetar todos os dados</button>
    </div>
  `;
}

// ── Validadores específicos por API ──
async function validateApiSports(key) {
  const r = await fetch('https://v3.football.api-sports.io/status', {
    headers: { 'x-apisports-key': key }
  });
  if (!r.ok) return { ok: false, msg: `HTTP ${r.status}` };
  const data = await r.json();
  const errors = data?.errors;
  const hasErrors = errors && (Array.isArray(errors) ? errors.length : Object.keys(errors).length);
  if (hasErrors) return { ok: false, msg: String(Object.values(errors)[0]) };
  const used = data?.response?.requests?.current ?? '?';
  const limit = data?.response?.requests?.limit_day ?? '?';
  return { ok: true, msg: `${used}/${limit} requisições usadas hoje` };
}

async function validateFootballData(key) {
  // football-data.org tem CORS aberto para o header X-Auth-Token.
  const r = await fetch('https://api.football-data.org/v4/competitions/PL', {
    headers: { 'X-Auth-Token': key }
  });
  if (r.status === 401 || r.status === 403) return { ok: false, msg: 'chave inválida' };
  if (r.status === 429) return { ok: false, msg: 'limite atingido — tente em 1 min' };
  if (!r.ok) return { ok: false, msg: `HTTP ${r.status}` };
  return { ok: true, msg: 'autorizada para Premier League e ligas free' };
}

function bindApiKeyField(state, opts) {
  const input = document.getElementById(opts.inputId);
  const saveBtn = document.getElementById(opts.saveId);
  const statusEl = document.getElementById(opts.statusId);
  if (!input || !saveBtn || !statusEl) return;

  const setStatus = (msg, kind) => {
    statusEl.textContent = msg;
    statusEl.className = `api-key-status text-xs ${kind === 'ok' ? 'text-emerald' : kind === 'err' ? 'text-rose' : 'text-muted'}`;
  };
  const clearCaches = () => {
    Object.keys(sessionStorage)
      .filter(k => opts.cachePrefixes.some(p => k.startsWith(p)))
      .forEach(k => sessionStorage.removeItem(k));
  };

  saveBtn.addEventListener('click', async () => {
    const newKey = input.value.trim();
    if (!newKey) {
      state.settings[opts.settingKey] = '';
      saveState(state);
      clearCaches();
      setStatus('Chave removida.', 'muted');
      showToast(`${opts.label}: chave removida`, 'success');
      return;
    }

    saveBtn.disabled = true;
    setStatus('Validando…', 'muted');
    try {
      const result = await opts.validate(newKey);
      if (result.ok) {
        state.settings[opts.settingKey] = newKey;
        saveState(state);
        clearCaches();
        setStatus(`✓ Chave válida — ${result.msg}`, 'ok');
        showToast(`${opts.label}: chave salva`, 'success');
      } else {
        setStatus(`Falha: ${result.msg}`, 'err');
      }
    } catch (e) {
      setStatus(`Falha de rede: ${e?.message || 'erro desconhecido'}`, 'err');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

function bindEvents(state) {
  setSEO({
    title: 'Configurações',
    description: 'Personalize seu perfil, seleção favorita, notificações e instalação do app CopaDataHub 2026.',
    canonical: '/configuracoes'
  });

  const settingInstall = document.getElementById('setting-install');
  if (settingInstall) {
    settingInstall.addEventListener('click', () => triggerInstall());
  }

  const toggleNotifications = document.getElementById('toggle-notifications');
  if (toggleNotifications) {
    toggleNotifications.addEventListener('click', () => {
      state.settings.notifications = !state.settings.notifications;
      saveState(state);
      toggleNotifications.classList.toggle('active');
      showToast(
        state.settings.notifications ? '🔔 Notificações ativadas' : '🔕 Notificações desativadas',
        'success'
      );
    });
  }

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.theme-toggle__btn');
      if (!btn) return;
      const value = btn.dataset.theme;
      setTheme(state, value);
      themeToggle.querySelectorAll('.theme-toggle__btn').forEach(b => {
        const active = b.dataset.theme === value;
        b.classList.toggle('theme-toggle__btn--active', active);
        b.setAttribute('aria-checked', active);
      });
      showToast(`Tema: ${THEME_LABEL[value]}`, 'success');
    });
  }

  const paletteGrid = document.getElementById('palette-grid');
  if (paletteGrid) {
    paletteGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.palette-card');
      if (!card) return;
      const value = card.dataset.palette;
      setPalette(state, value);
      paletteGrid.querySelectorAll('.palette-card').forEach(c => {
        const active = c.dataset.palette === value;
        c.classList.toggle('palette-card--active', active);
        c.setAttribute('aria-checked', active);
      });
      showToast(`Paleta: ${PALETTE_META[value].label}`, 'success');
    });
  }

  bindApiKeyField(state, {
    settingKey: 'apiSportsKey',
    inputId: 'setting-apisports-key',
    saveId: 'setting-apisports-save',
    statusId: 'setting-apisports-status',
    cachePrefixes: ['cdh_match_', 'cdh_squad_', 'cdh_player_'],
    label: 'API-Football',
    validate: validateApiSports
  });

  bindApiKeyField(state, {
    settingKey: 'footballDataKey',
    inputId: 'setting-fdata-key',
    saveId: 'setting-fdata-save',
    statusId: 'setting-fdata-status',
    cachePrefixes: ['cdh_league_'],
    label: 'football-data.org',
    validate: validateFootballData
  });

  const resetBtn = document.getElementById('btn-reset-data');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Tem certeza? Todos os seus dados (XP, palpites, trivia) serão apagados.')) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }
}

export default { render, bindEvents };
