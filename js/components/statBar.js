export function renderStatBar(label, homeVal, awayVal, isPercent = false) {
  const total = homeVal + awayVal || 1;
  const homePct = Math.round((homeVal / total) * 100);
  const awayPct = 100 - homePct;
  const suffix = isPercent ? '%' : '';

  return `
    <div class="stat-bar">
      <div class="stat-bar__header">
        <span class="stat-bar__values">
          <span class="stat-bar__value--home">${homeVal}${suffix}</span>
        </span>
        <span class="stat-bar__label">${label}</span>
        <span class="stat-bar__values">
          <span class="stat-bar__value--away">${awayVal}${suffix}</span>
        </span>
      </div>
      <div class="stat-bar__track">
        <div class="stat-bar__fill-home" style="width: ${homePct}%"></div>
        <div class="stat-bar__fill-away" style="width: ${awayPct}%"></div>
      </div>
    </div>
  `;
}
