export function todayISO() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function timeBlockForHour(hour) {
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function formatTime(hhmm) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Converts a UTC timestamp string (e.g. from Supabase) into the LOCAL calendar
// date/time it represents. Never slice a raw timestamp string directly —
// that reads the UTC date, which drifts a day off in the evening for PH time (UTC+8).
export function localDateFromTimestamp(isoTimestamp) {
  return new Date(isoTimestamp)
}

export function localDateISO(isoTimestamp) {
  const d = new Date(isoTimestamp)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 10)
}

export function localHHMM(isoTimestamp) {
  const d = new Date(isoTimestamp)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function dayLabel(dateISO) {
  const today = todayISO()
  const yesterday = isoDaysAgo(1)
  if (dateISO === today) return 'Today'
  if (dateISO === yesterday) return 'Yesterday'
  const d = new Date(dateISO + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function weekdayShort(dateISO) {
  const d = new Date(dateISO + 'T00:00:00')
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}