/* ---------------------------------------------------------------------------
   Local, offline data store.

   Everything Daybook saves — habits, habit logs, check-ins, settings — lives
   in this browser's localStorage under one key. There is no server and no
   login: the app works fully offline, and "your data" simply means "what's
   in this browser". That's also why Backup (Insights tab) matters — export
   regularly, especially before clearing site data, switching browsers, or
   moving to a new phone.
   --------------------------------------------------------------------------- */

const STORAGE_KEY = 'daybook:v1';
export const BACKUP_VERSION = 1;

const DEFAULT_PING = { enabled: false, start: '09:00', end: '21:00' };

function emptyState() {
  return { habits: [], habitLogs: [], checkins: [], ping: DEFAULT_PING };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
      checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
      ping: parsed.ping || DEFAULT_PING,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Reading local data', err);
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Saving local data', err);
    return false;
  }
}

export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/* --------------------------- backup / restore --------------------------- */

export function exportBackup(state) {
  const payload = {
    app: 'daybook',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `daybook-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* Parses and lightly validates a backup file's text content. Throws with a
   human-readable message on anything that doesn't look like a Daybook
   backup, so the caller can surface it via toast. */
export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || parsed.app !== 'daybook') {
    throw new Error('That file doesn\u2019t look like a Daybook backup.');
  }
  return {
    habits: Array.isArray(parsed.habits) ? parsed.habits : [],
    habitLogs: Array.isArray(parsed.habitLogs) ? parsed.habitLogs : [],
    checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
    ping: parsed.ping || DEFAULT_PING,
  };
}

export { DEFAULT_PING };
