import { isoDaysAgo } from '../lib/dates'

// Renders the last N days as a row of ledger marks — filled dot = done,
// hollow ring = missed, faint dash = before habit existed.
export default function LedgerDots({ habitId, isHabitDoneOn, createdAt, days = 21 }) {
  const cells = []
  for (let i = days - 1; i >= 0; i--) {
    const dateISO = isoDaysAgo(i)
    const existed = !createdAt || dateISO >= createdAt.slice(0, 10)
    const done = existed && isHabitDoneOn(habitId, dateISO)
    cells.push({ dateISO, existed, done })
  }
  return (
    <div style={{ display: 'flex', gap: 3 }} aria-hidden="true">
      {cells.map((c, i) => (
        <span
          key={i}
          title={c.dateISO}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: c.done ? 'var(--amber)' : 'transparent',
            border: c.existed ? `1px solid ${c.done ? 'var(--amber)' : 'var(--hairline)'}` : 'none',
            opacity: c.existed ? 1 : 0.3
          }}
        />
      ))}
    </div>
  )
}
