import { useState } from 'react'
import { categoryColor, categoryLabel } from './CategoryDot'

const BLOCKS = ['morning', 'afternoon', 'evening']
const CATEGORIES = ['business', 'content', 'health', 'personal']

export default function HabitEditor({ habit, onSave, onDelete, onClose }) {
  const [name, setName] = useState(habit?.name || '')
  const [timeBlock, setTimeBlock] = useState(habit?.time_block || 'morning')
  const [scheduledTime, setScheduledTime] = useState(habit?.scheduled_time || '')
  const [category, setCategory] = useState(habit?.category || 'personal')
  const [isBad, setIsBad] = useState(habit?.is_bad_habit || false)
  const [isEssential, setIsEssential] = useState(habit?.is_essential || false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        time_block: timeBlock,
        scheduled_time: scheduledTime || null,
        category,
        is_bad_habit: isBad,
        is_essential: isEssential
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--hairline)', margin: '0 auto 18px' }} />

        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, marginBottom: 16 }}>
          {habit ? 'Edit habit' : 'New habit'}
        </div>

        <label style={labelStyle}>Name</label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isBad ? 'e.g. Late-night scrolling' : 'e.g. Morning workout'}
          style={inputStyle}
        />

        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <ToggleBtn active={!isBad} onClick={() => setIsBad(false)} label="Build" />
          <ToggleBtn active={isBad} onClick={() => setIsBad(true)} label="Avoid" color="var(--wasted)" />
        </div>

        {!isBad && (
          <>
            <label style={labelStyle}>Time block</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {BLOCKS.map(b => (
                <ToggleBtn key={b} active={timeBlock === b} onClick={() => setTimeBlock(b)} label={b[0].toUpperCase() + b.slice(1)} />
              ))}
            </div>

            <label style={labelStyle}>Scheduled time (optional)</label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={inputStyle}
            />
          </>
        )}

        <label style={labelStyle}>Category</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 20,
                border: `1px solid ${category === c ? categoryColor(c) : 'var(--hairline)'}`,
                background: category === c ? categoryColor(c) + '22' : 'transparent',
                color: category === c ? categoryColor(c) : 'var(--text-dim)',
                fontSize: 13
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: categoryColor(c) }} />
              {categoryLabel(c)}
            </button>
          ))}
        </div>

        {!isBad && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, color: 'var(--text-dim)' }}>
            <input type="checkbox" checked={isEssential} onChange={(e) => setIsEssential(e.target.checked)} />
            Essential — counts toward my minimum viable day
          </label>
        )}

        <button onClick={handleSave} disabled={saving || !name.trim()} style={saveBtnStyle}>
          {saving ? 'Saving…' : habit ? 'Save changes' : 'Add habit'}
        </button>

        {onDelete && (
          <button onClick={onDelete} style={deleteBtnStyle}>Delete habit</button>
        )}
        <button onClick={onClose} style={cancelBtnStyle}>Cancel</button>
      </div>
    </div>
  )
}

function ToggleBtn({ active, onClick, label, color = 'var(--amber)' }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '9px 0', borderRadius: 'var(--radius-sm)',
        border: `1px solid ${active ? color : 'var(--hairline)'}`,
        background: active ? color + '22' : 'transparent',
        color: active ? color : 'var(--text-dim)',
        fontSize: 13, fontWeight: 500
      }}
    >
      {label}
    </button>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'flex-end', zIndex: 100
}

const sheetStyle = {
  background: 'var(--surface)', width: '100%', maxHeight: '88vh', overflowY: 'auto',
  borderRadius: '18px 18px 0 0', padding: '14px 18px 28px',
  borderTop: '1px solid var(--hairline)'
}

const labelStyle = {
  display: 'block', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase',
  color: 'var(--text-faint)', marginBottom: 6
}

const inputStyle = {
  width: '100%', padding: '11px 12px', borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--hairline)', background: 'var(--ink)', color: 'var(--text)',
  fontSize: 15, marginBottom: 16
}

const saveBtnStyle = {
  width: '100%', padding: '13px 0', borderRadius: 'var(--radius)', border: 'none',
  background: 'var(--amber)', color: '#1a1410', fontWeight: 600, fontSize: 15, marginBottom: 10
}

const deleteBtnStyle = {
  width: '100%', padding: '11px 0', borderRadius: 'var(--radius)',
  border: '1px solid var(--wasted)', background: 'transparent', color: 'var(--wasted)', fontSize: 14, marginBottom: 8
}

const cancelBtnStyle = {
  width: '100%', padding: '9px 0', border: 'none', background: 'transparent',
  color: 'var(--text-faint)', fontSize: 14
}
