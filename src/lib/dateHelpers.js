/* ---------------------------------------------------------------------------
   Date/time helpers.

   CRITICAL: checkins.logged_at is stored in the database as a UTC
   timestamptz, but "today" and all day-grouping must always be computed in
   the user's LOCAL timezone. Every place that needs a calendar day from a
   timestamp goes through localDateFromISO() / formatLocalDate() below —
   never `isoString.slice(0, 10)`. That shortcut silently puts a late-night
   entry on the wrong day for anyone west of UTC, and it's easy to introduce
   and easy to miss in daytime testing.
   --------------------------------------------------------------------------- */

export function pad2(n) {
  return String(n).padStart(2, '0');
}

export function formatLocalDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function localDateFromISO(isoString) {
  return formatLocalDate(new Date(isoString));
}

export function todayLocal() {
  return formatLocalDate(new Date());
}

export function addDaysLocal(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return formatLocalDate(dt);
}

export function dayIndexLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return Math.floor(new Date(y, m - 1, d).getTime() / 86400000);
}

export function weekdayIndexLocal(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayLabel(dateStr, todayStr) {
  if (dateStr === todayStr) return 'Today';
  if (dateStr === addDaysLocal(todayStr, -1)) return 'Yesterday';
  if (dateStr === addDaysLocal(todayStr, 1)) return 'Tomorrow';
  return WEEKDAYS[weekdayIndexLocal(dateStr)];
}

export function formatLocalTime(isoString) {
  const d = new Date(isoString);
  let h = d.getHours();
  const m = pad2(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function formatDateHeader(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatDateLong(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function formatRelative(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function getTimeBlockForHour(h) {
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function greetingForHour(h) {
  if (h < 5) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/* Minutes-since-midnight comparison that correctly handles windows that
   cross midnight (e.g. 22:00–06:00). Plain string/number comparison of
   "HH:MM" breaks silently for these — do not use it. */
export function hhmmToMinutes(hhmm) {
  if (!hhmm) return null;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinWindow(currentMinutes, startMinutes, endMinutes) {
  if (startMinutes == null || endMinutes == null || startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  return currentMinutes >= startMinutes || currentMinutes < endMinutes; // crosses midnight
}
