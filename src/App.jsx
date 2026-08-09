import { useState } from 'react'
import { useDaybook } from './lib/useDaybook'
import RoutineTab from './components/RoutineTab'
import CheckInTab from './components/CheckInTab'
import InsightsTab from './components/InsightsTab'

const TABS = [
  { key: 'routine', label: 'Routine' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'insights', label: 'Insights' }
]

export default function App() {
  const [tab, setTab] = useState('routine')
  const db = useDaybook()

  if (db.loading && db.habits.length === 0 && db.checkins.length === 0) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
        Loading your daybook…
      </div>
    )
  }

  if (db.error) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center', gap: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Couldn't reach the database</div>
        <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>{db.error}</div>
        <button onClick={db.reload} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--amber)', color: '#1a1410', fontWeight: 600 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 520, margin: '0 auto', position: 'relative' }}>
      {tab === 'routine' && (
        <RoutineTab
          habits={db.habits}
          isHabitDoneOn={db.isHabitDoneOn}
          streakFor={db.streakFor}
          toggleHabitDone={db.toggleHabitDone}
          addHabit={db.addHabit}
          updateHabit={db.updateHabit}
          deleteHabit={db.deleteHabit}
          checkins={db.checkins}
        />
      )}
      {tab === 'checkin' && (
        <CheckInTab
          checkins={db.checkins}
          addCheckin={db.addCheckin}
          deleteCheckin={db.deleteCheckin}
          settings={db.settings}
          updateSettings={db.updateSettings}
        />
      )}
      {tab === 'insights' && (
        <InsightsTab
          habits={db.habits}
          logs={db.logs}
          checkins={db.checkins}
          isHabitDoneOn={db.isHabitDoneOn}
        />
      )}

      <nav style={navStyle}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '10px 0 8px', background: 'none', border: 'none',
              color: tab === t.key ? 'var(--amber)' : 'var(--text-faint)',
              fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
            }}
          >
            <span style={{
              width: tab === t.key ? 20 : 0, height: 2, background: 'var(--amber)',
              borderRadius: 1, transition: 'width 0.15s'
            }} />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

const navStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  maxWidth: 520, margin: '0 auto',
  display: 'flex', background: 'var(--surface)',
  borderTop: '1px solid var(--hairline)',
  paddingBottom: 'env(safe-area-inset-bottom)'
}
