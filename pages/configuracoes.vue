<script setup>
import { ref, computed } from 'vue';
import { THEMES, THEME_LABEL, PALETTES, PALETTE_META } from '~/utils/theme';

definePageMeta({ name: 'configuracoes' });

useSeoMeta({
  title: 'Configurações — CopaDataHub 2026',
  description: 'Personalize tema, paleta, chaves de API e notificações.'
});
useHead({ link: [{ rel: 'canonical', href: '/configuracoes' }] });

const user = useUserStore();
const settings = useSettingsStore();
const { showToast } = useToast();

const favTeam = computed(() => user.favoriteTeam ? getTeam(user.favoriteTeam) : null);

const apiSportsInput = ref(settings.apiSportsKey || '');
const apiSportsStatus = ref({ msg: '', kind: 'muted' });
const apiSportsBusy = ref(false);

const fdataInput = ref(settings.footballDataKey || '');
const fdataStatus = ref({ msg: '', kind: 'muted' });
const fdataBusy = ref(false);

async function validateApiSports(key) {
  try {
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
  } catch (e) {
    return { ok: false, msg: e?.message || 'Erro de rede' };
  }
}

async function validateFootballData(key) {
  try {
    const r = await fetch('https://api.football-data.org/v4/competitions/PL', {
      headers: { 'X-Auth-Token': key }
    });
    if (r.status === 401 || r.status === 403) return { ok: false, msg: 'chave inválida' };
    if (r.status === 429) return { ok: false, msg: 'limite atingido' };
    if (!r.ok) return { ok: false, msg: `HTTP ${r.status}` };
    return { ok: true, msg: 'autorizada' };
  } catch (e) {
    return { ok: false, msg: e?.message || 'Erro de rede' };
  }
}

function clearCache(prefixes) {
  if (!import.meta.client) return;
  Object.keys(sessionStorage)
    .filter(k => prefixes.some(p => k.startsWith(p)))
    .forEach(k => sessionStorage.removeItem(k));
}

async function saveApiSports() {
  const key = apiSportsInput.value.trim();
  if (!key) {
    settings.apiSportsKey = '';
    clearCache(['cdh_match_', 'cdh_squad_', 'cdh_player_']);
    apiSportsStatus.value = { msg: 'Chave removida.', kind: 'muted' };
    showToast('API-Football: chave removida', 'success');
    return;
  }
  apiSportsBusy.value = true;
  apiSportsStatus.value = { msg: 'Validando…', kind: 'muted' };
  const r = await validateApiSports(key);
  if (r.ok) {
    settings.apiSportsKey = key;
    clearCache(['cdh_match_', 'cdh_squad_', 'cdh_player_']);
    apiSportsStatus.value = { msg: `✓ ${r.msg}`, kind: 'ok' };
    showToast('API-Football: chave salva', 'success');
  } else {
    apiSportsStatus.value = { msg: `Falha: ${r.msg}`, kind: 'err' };
  }
  apiSportsBusy.value = false;
}

async function saveFData() {
  const key = fdataInput.value.trim();
  if (!key) {
    settings.footballDataKey = '';
    clearCache(['cdh_league_']);
    fdataStatus.value = { msg: 'Chave removida.', kind: 'muted' };
    showToast('football-data: chave removida', 'success');
    return;
  }
  fdataBusy.value = true;
  fdataStatus.value = { msg: 'Validando…', kind: 'muted' };
  const r = await validateFootballData(key);
  if (r.ok) {
    settings.footballDataKey = key;
    clearCache(['cdh_league_']);
    fdataStatus.value = { msg: `✓ ${r.msg}`, kind: 'ok' };
    showToast('football-data: chave salva', 'success');
  } else {
    fdataStatus.value = { msg: `Falha: ${r.msg}`, kind: 'err' };
  }
  fdataBusy.value = false;
}

function pickTheme(t) {
  settings.setTheme(t);
  showToast(`Tema: ${THEME_LABEL[t]}`, 'success');
}
function pickPalette(p) {
  settings.setPalette(p);
  showToast(`Paleta: ${PALETTE_META[p].label}`, 'success');
}
function toggleNotifications() {
  settings.notifications = !settings.notifications;
  showToast(settings.notifications ? '🔔 Notificações ativadas' : '🔕 Desativadas', 'success');
}
function resetAll() {
  if (confirm('Tem certeza? Todos os dados serão apagados.')) {
    localStorage.clear();
    window.location.reload();
  }
}

function statusClass(kind) {
  return kind === 'ok' ? 'text-emerald' : kind === 'err' ? 'text-rose' : 'text-muted';
}
</script>

<template>
  <div>
    <h1 class="section-title">Configurações</h1>

    <div class="card card--gold mb-xl">
      <div class="flex items-center gap-lg">
        <div class="settings-profile__avatar" v-if="!favTeam">⚽</div>
        <NuxtLink v-else :to="`/selecoes/${favTeam.slug}`" class="settings-profile__avatar settings-profile__avatar--link">{{ favTeam.flag }}</NuxtLink>
        <div>
          <div class="font-display font-bold" style="font-size: var(--text-lg);">{{ user.name || 'Torcedor' }}</div>
          <div class="text-sm text-muted">Nível {{ user.level }} · {{ user.xp }} XP · {{ user.streak }} dias</div>
          <NuxtLink v-if="favTeam" :to="`/selecoes/${favTeam.slug}`" class="settings-profile__team-link">
            {{ favTeam.flag }} {{ favTeam.name }} →
          </NuxtLink>
        </div>
      </div>
      <XpBar />
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Aparência</div>
      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">Tema</div>
            <div class="settings-item__desc">Claro, escuro ou seguir o sistema.</div>
          </div>
        </div>
        <div class="theme-toggle" role="radiogroup">
          <button
            v-for="t in THEMES"
            :key="t"
            class="theme-toggle__btn"
            :class="{ 'theme-toggle__btn--active': settings.theme === t }"
            type="button"
            @click="pickTheme(t)"
          >{{ THEME_LABEL[t] }}</button>
        </div>
      </div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">Paleta de cores</div>
          </div>
        </div>
        <div class="palette-grid">
          <button
            v-for="p in PALETTES"
            :key="p"
            class="palette-card"
            :class="{ 'palette-card--active': settings.palette === p }"
            type="button"
            @click="pickPalette(p)"
          >
            <div class="palette-card__swatches">
              <span v-for="(c, i) in PALETTE_META[p].swatches" :key="i" :style="{ background: c }"></span>
            </div>
            <span class="palette-card__lbl">{{ PALETTE_META[p].label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Geral</div>
      <div class="settings-item" @click="toggleNotifications">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">Notificações</div>
            <div class="settings-item__desc">Alertas de gols e resultados</div>
          </div>
        </div>
        <div class="toggle" :class="{ active: settings.notifications }"></div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Chaves de API</div>
      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">API-Football <span class="api-key-tag">api-sports.io</span></div>
            <div class="settings-item__desc">Partidas, escalações, jogadores.</div>
          </div>
        </div>
        <div class="api-key-row">
          <input
            v-model="apiSportsInput"
            type="password"
            class="api-key-input"
            placeholder="cole sua chave"
            autocomplete="off"
          >
          <button class="btn btn--primary btn--sm" :disabled="apiSportsBusy" @click="saveApiSports">Salvar</button>
        </div>
        <div class="api-key-status text-xs" :class="statusClass(apiSportsStatus.kind)">{{ apiSportsStatus.msg }}</div>
      </div>

      <div class="settings-item settings-item--stack">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">football-data.org</div>
            <div class="settings-item__desc">Champions, Brasileirão, PL.</div>
          </div>
        </div>
        <div class="api-key-row">
          <input
            v-model="fdataInput"
            type="password"
            class="api-key-input"
            placeholder="cole sua chave"
            autocomplete="off"
          >
          <button class="btn btn--primary btn--sm" :disabled="fdataBusy" @click="saveFData">Salvar</button>
        </div>
        <div class="api-key-status text-xs" :class="statusClass(fdataStatus.kind)">{{ fdataStatus.msg }}</div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group__title">Sobre</div>
      <div class="settings-item">
        <div class="settings-item__left">
          <div>
            <div class="settings-item__label">CopaDataHub 2026</div>
            <div class="settings-item__desc">MVP v1.0 · PWA Instalável</div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-xl text-center">
      <button class="btn btn--ghost btn--sm text-rose" @click="resetAll">Resetar todos os dados</button>
    </div>
  </div>
</template>
