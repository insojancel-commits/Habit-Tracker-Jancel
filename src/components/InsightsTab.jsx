import { useMemo } from 'react'
import { todayISO, isoDaysAgo, weekdayShort } from '../lib/dates'
import { categoryColor, categoryLabel } from './CategoryDot'

export default function InsightsTab({ habits, logs, checkins, isHabitDoneOn }) {
  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), [])

  // Category completion balance (habits only, last 7 days)
  const categoryBalance = useMemo(() => {
    const cats = { business: 0, content: 0, health: 0, personal: 0 }
    const good = habits.filter(h => !h.is_bad_habit)
    for (const day of last7) {
      for (const h of good) {
        if (isHabitDoneOn(h.id, day)) cats[h.category] = (cats[h.category] || 0) + 1
      }
    }
    const total = Object.values(cats).reduce((a, b) => a + b, 0) || 1
    return Object.entries(cats).map(([cat, count]) => ({ cat, count, pct: Math.round((count / total) * 100) }))
  }, [habits, last7, isHabitDoneOn])

  // Weekly completion rate per day (all good habits)
  const weekCompletion = useMemo(() => {
    const good = habits.filter(h => !h.is_bad_habit)
    return last7.map(day => {
      const total = good.length || 1
      const done = good.filter(h => isHabitDoneOn(h.id, day)).length
      return { day, pct: Math.round((done / total) * 100), done, total: good.length }
    })
  }, [habits, last7, isHabitDoneOn])

  // Check-in tag totals, last 7 days
  const tagTotals = useMemo(() => {
    const cutoff = isoDaysAgo(6)
    const recent = checkins.filter(c => c.logged_at.slice(0, 10) >= cutoff)
    const totals = { productive: 0, neutral: 0, wasted: 0 }
    for (const c of recent) totals[c.tag] = (totals[c.tag] || 0) + 1
    const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1
    return { totals, total }
  }, [checkins])

  // Best focus window: hour with highest ratio of productive check-ins
  const bestWindow = useMemo(() => {
    const buckets = {}
    for (const c of checkins) {
      const h = new Date(c.logged_at).getHours()
      if (!buckets[h]) buckets[h] = { productive: 0, total: 0 }
      buckets[h].total++
      if (c.tag === 'productive') buckets[h].productive++
    }
    let best = null
    for (const [h, b] of Object.entries(buckets)) {
      if (b.total < 2) continue
      const ratio = b.productive / b.total
      if (!best || ratio > best.ratio) best = { hour: Number(h), ratio, total: b.total }
    }
    return best
  }, [checkins])

  const activeHabits = habits.filter(h => !h.is_bad_habit)
  const avoidHabits = habits.filter(h => h.is_bad_habit)

  function exportCSV() {
    const rows = [['type', 'date_or_time', 'name', 'category_or_tag']]
    for (const l of logs) {
      const h = habits.find(x => x.id === l.habit_id)
      rows.push(['habit_log', l.completed_date, h?.name || l.habit_id, h?.category || ''])
    }
    for (const c of checkins) {
      rows.push(['checkin', c.logged_at, c.activity, c.tag])
    }
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daybook-export-${todayISO()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: '20px 16px 100px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500, marginBottom: 20 }}>Insights</div>

      {/* Weekly completion bars */}
      <Section title="This week">
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 90, marginBottom: 6 }}>
          {weekCompletion.map(({ day, pct }) => (
            <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', height: Math.max(pct, 4), background: pct > 0 ? 'var(--amber)' : 'var(--hairline)',
                borderRadius: 3, opacity: day === todayISO() ? 1 : 0.75
              }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {weekCompletion.map(({ day }) => (
            <div key={day} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'var(--text-faint)' }}>
              {weekdayShort(day)}
            </div>
          ))}
        </div>
      </Section>

      {/* Category balance */}
      {activeHabits.length > 0 && (
        <Section title="Balance by category (7 days)">
          <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
            {categoryBalance.map(({ cat, pct }) => (
              pct > 0 && <div key={cat} style={{ width: `${pct}%`, background: categoryColor(cat) }} />
            ))}
          </div>
          {categoryBalance.map(({ cat, count, pct }) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '4px 0', color: 'var(--text-dim)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColor(cat) }} />
              <span style={{ flex: 1 }}>{categoryLabel(cat)}</span>
              <span className="mono">{count} · {pct}%</span>
            </div>
          ))}
        </Section>
      )}

      {/* Check-in tag split */}
      {checkins.length > 0 && (
        <Section title="How your time split (7 days)">
          <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${(tagTotals.totals.productive / tagTotals.total) * 100}%`, background: 'var(--productive)' }} />
            <div style={{ width: `${(tagTotals.totals.neutral / tagTotals.total) * 100}%`, background: 'var(--neutral)' }} />
            <div style={{ width: `${(tagTotals.totals.wasted / tagTotals.total) * 100}%`, background: 'var(--wasted)' }} />
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
            <TagStat label="Productive" value={tagTotals.totals.productive} color="var(--productive)" />
            <TagStat label="Neutral" value={tagTotals.totals.neutral} color="var(--neutral)" />
            <TagStat label="Wasted" value={tagTotals.totals.wasted} color="var(--wasted)" />
          </div>
          {bestWindow && (
            <div style={{ marginTop: 14, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Your most productive hour tends to be around{' '}
              <span style={{ color: 'var(--amber)' }} className="mono">
                {bestWindow.hour % 12 === 0 ? 12 : bestWindow.hour % 12}{bestWindow.hour >= 12 ? 'pm' : 'am'}
              </span>{' '}
              — {Math.round(bestWindow.ratio * 100)}% of entries logged then were productive.
            </div>
          )}
        </Section>
      )}

      {/* Streaks overview */}
      {activeHabits.length > 0 && (
        <Section title="Current streaks">
          {activeHabits.map(h => (
            <StreakLine key={h.id} habit={h} isHabitDoneOn={isHabitDoneOn} />
          ))}
        </Section>
      )}

      {avoidHabits.length > 0 && (
        <Section title="Days avoided">
          {avoidHabits.map(h => (
            <StreakLine key={h.id} habit={h} isHabitDoneOn={isHabitDoneOn} bad />
          ))}
        </Section>
      )}

      <button onClick={exportCSV} style={exportBtnStyle}>Export all data (CSV)</button>
    </div>
  )
}

function computeStreak(habitId, isHabitDoneOn) {
  let streak = 0
  const today = todayISO()
  let daysBack = isHabitDoneOn(habitId, today) ? 0 : 1
  while (streak < 365) {
    const dateISO = isoDaysAgo(daysBack)
    if (isHabitDoneOn(habitId, dateISO)) {
      streak++
      daysBack++
    } else break
  }
  return streak
}

function StreakLine({ habit, isHabitDoneOn, bad }) {
  const streak = computeStreak(habit.id, isHabitDoneOn)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', fontSize: 14 }}>
      <span style={{ color: 'var(--text-dim)' }}>{habit.name}</span>
      <span className="mono" style={{ color: streak > 0 ? (bad ? 'var(--productive)' : 'var(--amber)') : 'var(--text-faint)' }}>
        {streak}d
      </span>
    </div>
  )
}

function TagStat({ label, value, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-dim)' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {value} {label.toLowerCase()}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const exportBtnStyle = {
  width: '100%', padding: '13px 0', borderRadius: 'var(--radius)',
  border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--text-dim)', fontSize: 14, marginTop: 8
}
