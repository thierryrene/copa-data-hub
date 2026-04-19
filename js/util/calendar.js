import { FIXTURES, STADIUMS, getTeam } from '../data.js';

// Offsets em junho/julho (horário de verão dos EUA)
const TZ_OFFSETS = {
  EST: '-04:00', // EDT
  CST: '-05:00', // CDT
  PST: '-07:00'  // PDT
};

const STADIUM_MAP = Object.fromEntries(STADIUMS.map(s => [s.id, s]));

function pad(n) {
  return String(n).padStart(2, '0');
}

function toIcsDate(dt) {
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function fixtureToVEvent(fixture, dtStamp) {
  const stadium = STADIUM_MAP[fixture.stadium];
  const home = getTeam(fixture.home);
  const away = getTeam(fixture.away);
  const offset = TZ_OFFSETS[stadium?.timezone] || '-04:00';

  const start = new Date(`${fixture.date}T${fixture.time}:00${offset}`);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const homeName = home?.name || fixture.home;
  const awayName = away?.name || fixture.away;
  const summary = `${homeName} x ${awayName} — Mundial 2026`;
  const location = stadium ? `${stadium.name}, ${stadium.city}, ${stadium.country}` : '';
  const description = [
    `Grupo ${fixture.group}`,
    stadium ? `Estádio: ${stadium.name} (${stadium.city})` : '',
    `Horário local: ${fixture.time}`,
    'Copa Data Hub — copadatahub.com.br'
  ].filter(Boolean).join('\\n');

  return [
    'BEGIN:VEVENT',
    `UID:${fixture.id}@copadatahub`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    'END:VEVENT'
  ].join('\r\n');
}

export function buildIcsCalendar() {
  const dtStamp = toIcsDate(new Date());
  const events = FIXTURES.map(f => fixtureToVEvent(f, dtStamp)).join('\r\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Copa Data Hub//Mundial 2026//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mundial 2026',
    'X-WR-CALDESC:Calendário oficial da Copa do Mundo 2026',
    events,
    'END:VCALENDAR'
  ].join('\r\n');
}

export function downloadCalendar() {
  const ics = buildIcsCalendar();
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mundial-2026.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
