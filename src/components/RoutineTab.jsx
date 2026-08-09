import { useState, useMemo } from 'react'
import { todayISO, formatTime, localDateISO } from '../lib/dates'
import LedgerDots from './LedgerDots'
import CategoryDot, { categoryColor, categoryLabel } from './CategoryDot'
import HabitEditor from './HabitEditor'

const BLOCKS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' }
]

export default function RoutineTab({ habits, isHabitDoneOn, streakFor, toggleHabitDone, addHabit, updateHabit, deleteHabit, checkins }) {
  const [editing, setEditing] = useState(null) // habit or 'new'
  const today = todayISO()

  const good = habits.filter(h => !h.is_bad_habit)
  const bad = habits.filter(h => h.is_bad_habit)

  // Mismatch: habit scheduled at a time, but check-in log around that time shows something unrelated
  const mismatches = useMemo(() => {
    const result = new Set()
    const todaysCheckins = checkins.filter(c => localDateISO(c.logged_at) === today)
    if (todaysCheckins.length === 0) return result
    for (const h of good) {
      if (!h.scheduled_time || isHabitDoneOn(h.id, today)) continue
      const [hh] = h.scheduled_time.split(':').map(Number)
      const nearby = todaysCheckins.filter(c => {
        const ch = new Date(c.logged_at).getHours()
        return Math.abs(ch - hh) <= 1
      })
      const nameWords = h.name.toLowerCase().split(/\s+/)
      const looksRelated = nearby.some(c => nameWords.some(w => w.length > 3 && c.activity.toLowerCase().includes(w)))
      if (nearby.length > 0 && !looksRelated) {
        result.add(h.id)
      }
    }
    return result
  }, [good, checkins, today, isHabitDoneOn])

  return (
    <div style={{ paddingBottom: 100 }}>
      <div style={{ padding: '20px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>Today's routine</div>
        <button onClick={() => setEditing('new')} style={addBtnStyle}>+ Add habit</button>
      </div>

      {good.length === 0 && bad.length === 0 && (
        <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 14 }}>
          No habits yet. Add your first one to build today's routine.
        </div>
      )}

      {BLOCKS.map(block => {
        const items = good.filter(h => h.time_block === block.key).sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || ''))
        if (items.length === 0) return null
        return (
          <div key={block.key} style={{ marginBottom: 18 }}>
            <div style={{
              padding: '0 16px 8px', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
              color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8
            }}>
              <span>{block.label}</span>
              <span style={{ flex: 1, height: 1, background: 'var(--hairline-soft)' }} />
            </div>
            {items.map(h => (
              <HabitRow
                key={h.id}
                habit={h}
                done={isHabitDoneOn(h.id, today)}
                streak={streakFor(h.id)}
                mismatch={mismatches.has(h.id)}
                onToggle={() => toggleHabitDone(h.id, today)}
                onEdit={() => setEditing(h)}
                isHabitDoneOn={isHabitDoneOn}
              />
            ))}
          </div>
        )
      })}

      {bad.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{
            padding: '0 16px 8px', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase',
            color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: 8
          }}>
            <span>Avoiding</span>
            <span style={{ flex: 1, height: 1, background: 'var(--hairline-soft)' }} />
          </div>
          {bad.map(h => (
            <HabitRow
              key={h.id}
              habit={h}
              done={isHabitDoneOn(h.id, today)}
              streak={streakFor(h.id)}
              mismatch={false}
              isBad
              onToggle={() => toggleHabitDone(h.id, today)}
              onEdit={() => setEditing(h)}
              isHabitDoneOn={isHabitDoneOn}
            />
          ))}
        </div>
      )}

      {editing && (
        <HabitEditor
          habit={editing === 'new' ? null : editing}
          onSave={async (data) => {
            if (editing === 'new') await addHabit(data)
            else await updateHabit(editing.id, data)
            setEditing(null)
          }}
          onDelete={editing !== 'new' ? async () => { await deleteHabit(editing.id); setEditing(null) } : null}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function HabitRow({ habit, done, streak, mismatch, isBad, onToggle, onEdit, isHabitDoneOn }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px', borderBottom: '1px solid var(--hairline-soft)'
    }}>
      <button
        onClick={onToggle}
        aria-label={done ? 'Mark not done' : 'Mark done'}
        style={{
          width: 24, height: 24, borderRadius: isBad ? 6 : '50%', flexShrink: 0,
          border: `1.5px solid ${done ? (isBad ? 'var(--wasted)' : 'var(--amber)') : 'var(--hairline)'}`,
          background: done ? (isBad ? 'var(--wasted)' : 'var(--amber)') : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#1a1410', fontSize: 13
        }}
      >
        {done ? '✓' : ''}
      </button>

      <div style={{ flex: 1, minWidth: 0 }} onClick={onEdit}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <CategoryDot category={habit.category} />
          <span style={{
            fontSize: 15,
            textDecoration: done && !isBad ? 'none' : 'none',
            color: done ? 'var(--text)' : 'var(--text)'
          }}>{habit.name}</span>
          {mismatch && (
            <span
              title="Your check-in log doesn't match this habit around its scheduled time"
              style={{ fontSize: 11, color: 'var(--wasted)', borderBottom: '1px dashed var(--wasted)' }}
            >
              mismatch
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          {habit.scheduled_time && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{formatTime(habit.scheduled_time)}</span>
          )}
          {habit.is_essential && (
            <span style={{ fontSize: 10, color: 'var(--amber)', border: '1px solid var(--amber-dim)', borderRadius: 4, padding: '1px 5px' }}>essential</span>
          )}
        </div>
        <div style={{ marginTop: 6 }}>
          <LedgerDots habitId={habit.id} isHabitDoneOn={isHabitDoneOn} createdAt={habit.created_at} />
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div className="mono" style={{ fontSize: 15, color: streak > 0 ? 'var(--amber)' : 'var(--text-faint)' }}>{streak}</div>
        <div style={{ fontSize: 10, color: 'var(--text-faint)' }}>day{streak === 1 ? '' : 's'}</div>
      </div>
    </div>
  )
}

const addBtnStyle = {
  background: 'var(--surface-raised)', border: '1px solid var(--hairline)', borderRadius: 20,
  padding: '7px 14px', color: 'var(--amber)', fontSize: 13, fontWeight: 500
}