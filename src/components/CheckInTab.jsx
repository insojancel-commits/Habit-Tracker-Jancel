import { useState, useEffect, useRef, useMemo } from 'react'
import { formatTime, nowHHMM, todayISO, localDateISO, localHHMM } from '../lib/dates'

const TAG_META = {
  productive: { label: 'Productive', color: 'var(--productive)' },
  neutral: { label: 'Neutral', color: 'var(--neutral)' },
  wasted: { label: 'Wasted', color: 'var(--wasted)' }
}

function withinWindow(nowHM, start, end) {
  return nowHM >= start && nowHM <= end
}

export default function CheckInTab({ checkins, addCheckin, deleteCheckin, settings, updateSettings }) {
  const [customText, setCustomText] = useState('')
  const [selectedTag, setSelectedTag] = useState('productive')
  const [showPrompt, setShowPrompt] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const audioCtxRef = useRef(null)

  // Ranked chips: most-used activities at the current hour, from history
  const rankedChips = useMemo(() => {
    const hour = new Date().getHours()
    const bucket = hour < 12 ? [5, 11] : hour < 17 ? [12, 16] : [17, 23]
    const counts = {}
    for (const c of checkins) {
      const h = new Date(c.logged_at).getHours()
      if (h >= bucket[0] && h <= bucket[1]) {
        counts[c.activity] = (counts[c.activity] || 0) + 1
      }
    }
    const fromHistory = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name]) => name)
    const merged = [...fromHistory, ...settings.quick_chips].filter((v, i, a) => a.indexOf(v) === i)
    return merged.slice(0, 8)
  }, [checkins, settings.quick_chips])

  const lastEntry = checkins[0]

  // Ping loop — only while tab open, only within window, only if enabled
  useEffect(() => {
    if (!settings.ping_enabled) return
    const interval = setInterval(() => {
      const nowHM = nowHHMM()
      if (withinWindow(nowHM, settings.ping_start, settings.ping_end)) {
        setShowPrompt(true)
        playChime()
        if (document.hidden && Notification?.permission === 'granted') {
          try { new Notification('Daybook', { body: 'What are you doing right now?' }) } catch (e) {}
        }
      }
    }, settings.ping_interval_min * 60 * 1000)
    return () => clearInterval(interval)
  }, [settings])

  function playChime() {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 660
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {}
  }

  async function handleLog(activity, tag) {
    if (!activity.trim()) return
    await addCheckin(activity.trim(), tag)
    setCustomText('')
    setShowPrompt(false)
  }

  async function requestNotifPermission() {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
  }

  const todaysCheckins = checkins.filter(c => localDateISO(c.logged_at) === todayISO())
  const tagTotals = todaysCheckins.reduce((acc, c) => {
    acc[c.tag] = (acc[c.tag] || 0) + 1
    return acc
  }, {})

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Ping prompt banner */}
      {showPrompt && (
        <div style={{
          margin: '16px 16px 0',
          padding: '18px 16px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--amber)',
          borderRadius: 'var(--radius)'
        }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, marginBottom: 12 }}>
            What are you doing right now?
          </div>
          <QuickChipRow chips={rankedChips} onPick={(a) => handleLog(a, selectedTag)} />
          <TagPicker selected={selectedTag} onSelect={setSelectedTag} />
          <CustomInput value={customText} onChange={setCustomText} onSubmit={() => handleLog(customText, selectedTag)} />
          <button onClick={() => setShowPrompt(false)} style={dismissBtnStyle}>Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '20px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 500 }}>Check-in log</div>
          {lastEntry ? (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>
              Last: <span className="mono">{formatTime(localHHMM(lastEntry.logged_at))}</span> — {lastEntry.activity}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>No entries yet today</div>
          )}
        </div>
        <button onClick={() => setShowSettings(s => !s)} style={iconBtnStyle}>⚙</button>
      </div>

      {showSettings && (
        <PingSettings settings={settings} updateSettings={updateSettings} onRequestPermission={requestNotifPermission} />
      )}

      {/* Manual log entry, always available */}
      {!showPrompt && (
        <div style={{ margin: '4px 16px 20px', padding: 14, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--hairline-soft)' }}>
          <QuickChipRow chips={rankedChips} onPick={(a) => handleLog(a, selectedTag)} />
          <TagPicker selected={selectedTag} onSelect={setSelectedTag} />
          <CustomInput value={customText} onChange={setCustomText} onSubmit={() => handleLog(customText, selectedTag)} />
        </div>
      )}

      {/* Today's tally */}
      {todaysCheckins.length > 0 && (
        <div style={{ display: 'flex', gap: 14, padding: '0 16px 16px', fontSize: 12 }}>
          {Object.entries(TAG_META).map(([key, meta]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-dim)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color }} />
              {tagTotals[key] || 0} {meta.label.toLowerCase()}
            </div>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '0 16px' }}>
        {checkins.length === 0 && (
          <div style={{ color: 'var(--text-faint)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            Nothing logged yet. Tap an activity above to start your day's record.
          </div>
        )}
        {groupByDay(checkins).map(([dateISO, entries]) => (
          <div key={dateISO} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>
              {dateISO === todayISO() ? 'Today' : new Date(dateISO + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            {entries.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 0', borderBottom: '1px solid var(--hairline-soft)'
              }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-faint)', width: 52, flexShrink: 0 }}>
                  {localHHMM(c.logged_at)}
                </span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: TAG_META[c.tag]?.color || TAG_META.neutral.color, flexShrink: 0 }} />
                <span style={{ fontSize: 14, flex: 1 }}>{c.activity}</span>
                <button onClick={() => deleteCheckin(c.id)} style={{ background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 16, padding: 4 }}>×</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickChipRow({ chips, onPick }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
      {chips.map(chip => (
        <button
          key={chip}
          onClick={() => onPick(chip)}
          style={{
            padding: '7px 12px',
            borderRadius: 20,
            border: '1px solid var(--hairline)',
            background: 'var(--surface-raised)',
            color: 'var(--text)',
            fontSize: 13
          }}
        >
          {chip}
        </button>
      ))}
    </div>
  )
}

function TagPicker({ selected, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      {Object.entries(TAG_META).map(([key, meta]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          style={{
            flex: 1,
            padding: '6px 0',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${selected === key ? meta.color : 'var(--hairline)'}`,
            background: selected === key ? meta.color + '22' : 'transparent',
            color: selected === key ? meta.color : 'var(--text-dim)',
            fontSize: 12,
            fontWeight: 500
          }}
        >
          {meta.label}
        </button>
      ))}
    </div>
  )
}

function CustomInput({ value, onChange, onSubmit }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} style={{ display: 'flex', gap: 8 }}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type what you're doing…"
        style={{
          flex: 1,
          padding: '9px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--hairline)',
          background: 'var(--ink)',
          color: 'var(--text)',
          fontSize: 14
        }}
      />
      <button type="submit" style={{
        padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none',
        background: 'var(--amber)', color: '#1a1410', fontWeight: 600, fontSize: 14
      }}>
        Log
      </button>
    </form>
  )
}

function PingSettings({ settings, updateSettings, onRequestPermission }) {
  return (
    <div style={{ margin: '0 16px 16px', padding: 14, background: 'var(--surface)', border: '1px solid var(--hairline-soft)', borderRadius: 'var(--radius)' }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, marginBottom: 12 }}>
        Ping me every {settings.ping_interval_min} min
        <input
          type="checkbox"
          checked={settings.ping_enabled}
          onChange={(e) => {
            updateSettings({ ping_enabled: e.target.checked })
            if (e.target.checked) onRequestPermission()
          }}
        />
      </label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>FROM</div>
          <input type="time" value={settings.ping_start} onChange={(e) => updateSettings({ ping_start: e.target.value })} style={timeInputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>TO</div>
          <input type="time" value={settings.ping_end} onChange={(e) => updateSettings({ ping_end: e.target.value })} style={timeInputStyle} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>INTERVAL (MIN)</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[15, 30, 60].map(m => (
          <button key={m} onClick={() => updateSettings({ ping_interval_min: m })} style={{
            flex: 1, padding: '6px 0', borderRadius: 'var(--radius-sm)',
            border: `1px solid ${settings.ping_interval_min === m ? 'var(--amber)' : 'var(--hairline)'}`,
            background: settings.ping_interval_min === m ? 'var(--amber-soft)' : 'transparent',
            color: settings.ping_interval_min === m ? 'var(--amber)' : 'var(--text-dim)',
            fontSize: 12
          }}>{m}</button>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 12, lineHeight: 1.5 }}>
        Pings only fire while this tab is open. For background alerts, add Daybook to your home screen.
      </div>
    </div>
  )
}

function groupByDay(checkins) {
  const map = {}
  for (const c of checkins) {
    const d = localDateISO(c.logged_at)
    if (!map[d]) map[d] = []
    map[d].push(c)
  }
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

const dismissBtnStyle = {
  marginTop: 10, background: 'none', border: 'none', color: 'var(--text-faint)', fontSize: 13, padding: 0
}

const iconBtnStyle = {
  background: 'var(--surface-raised)', border: '1px solid var(--hairline)', borderRadius: '50%',
  width: 34, height: 34, color: 'var(--text-dim)', fontSize: 15
}

const timeInputStyle = {
  width: '100%', padding: '7px 8px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--hairline)', background: 'var(--ink)', color: 'var(--text)', fontSize: 13
}