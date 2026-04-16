import { icon } from '../icons.js';
import { getXPProgress } from '../state.js';

export function renderXPBar(state) {
  const { level, xp, percent } = getXPProgress(state);
  return `
    <div class="xp-bar-container">
      <div class="xp-bar-header">
        <span class="xp-bar-level">${icon('zap', 16)} Nível ${level}</span>
        <span class="xp-bar-points">${xp} XP</span>
      </div>
      <div class="xp-bar-track">
        <div class="xp-bar-fill" style="width: ${percent}%"></div>
      </div>
    </div>
  `;
}
