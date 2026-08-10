import React, { useMemo, useState } from 'react';
import {
  todayLocal, localDateFromISO, formatLocalTime, formatDateHeader, formatRelative,
  dayLabel, getTimeBlockForHour, hhmmToMinutes, isWithinWindow,
} from '../lib/dateHelpers.js';
import { TAGS, TAG_LABELS, TAG_VAR, PING_GAP_MINUTES } from '../lib/constants.js';
import { CategoryDot, InlineDeleteButton, IconGear } from './ui.jsx';

export default function CheckInTab({ checkins, habits, habitLogs, addCheckin, deleteCheckin, cycleTag, toggleHabitDone, ping, setPing, onDeletedWithUndo }) {
  const [text, setText] = useState('');
  const [tag, setTag] = useState('productive');
  const [energy, setEnergy] = useState(0); // 0 = not set
  const [showSettings, setShowSettings] = useState(false);
  const today = todayLocal();
  const now = new Date();
  const currentBlock = getTimeBlockForHour(now.getHours());

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const doneTodaySet = useMemo(() => new Set(habitLogs.filter((l) => l.date === today && l.done).map((l) => l.habit_id)), [habitLogs, today]);
  const routineChips = useMemo(
    () => activeHabits.filter((h) => h.time_block === currentBlock && !h.is_bad_habit && !doneTodaySet.has(h.id)),
    [activeHabits, currentBlock, doneTodaySet]
  );

  const frequentChips = useMemo(() => {
    const counts = new Map();
    checkins.forEach((c) => {
      if (getTimeBlockForHour(new Date(c.logged_at).getHours()) !== currentBlock) return;
      const key = c.activity.trim();
      if (key) counts.set(key, (counts.get(key) || 0) + 1);
    });
    const routineNames = new Set(activeHabits.map((h) => h.name.toLowerCase()));
    return [...counts.entries()]
      .filter(([a]) => !routineNames.has(a.toLowerCase()))
      .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([a]) => a);
  }, [checkins, currentBlock, activeHabits]);

  const todaysCheckins = useMemo(() => checkins.filter((c) => localDateFromISO(c.logged_at) === today), [checkins, today]);
  const tally = useMemo(() => {
    const t = { productive: 0, wasted: 0, neutral: 0 };
    todaysCheckins.forEach((c) => { t[c.tag] = (t[c.tag] || 0) + 1; });
    return t;
  }, [todaysCheckins]);

  const lastCheckinMs = useMemo(() => (checkins.length === 0 ? null : Math.max(...checkins.map((c) => new Date(c.logged_at).getTime()))), [checkins]);
  const minsSinceLast = lastCheckinMs ? (Date.now() - lastCheckinMs) / 60000 : Infinity;
  const inPingWindow = ping.enabled && isWithinWindow(now.getHours() * 60 + now.getMinutes(), hhmmToMinutes(ping.start), hhmmToMinutes(ping.end));
  const showPingBanner = inPingWindow && minsSinceLast >= PING_GAP_MINUTES;

  const grouped = useMemo(() => {
    const byDay = new Map();
    checkins.forEach((c) => {
      const day = localDateFromISO(c.logged_at);
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(c);
    });
    return [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1)).map((day) => ({
      day, entries: byDay.get(day).sort((a, b) => (a.logged_at < b.logged_at ? 1 : -1)),
    }));
  }, [checkins]);

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addCheckin(trimmed, tag, energy || null);
    setText('');
    setEnergy(0);
  }
  function logRoutineChip(h) {
    addCheckin(h.name, 'productive', null);
    toggleHabitDone(h.id, today);
  }
  async function handleDelete(id) {
    const row = await deleteCheckin(id);
    onDeletedWithUndo(row);
  }

  return (
    <div>
      {showPingBanner && (
        <div className="db-ping-banner">Quiet stretch — {formatRelative(Date.now() - lastCheckinMs)} since your last entry. What are you up to?</div>
      )}

      <div className="db-card">
        <div className="db-card-head">
          <div className="db-eyebrow" style={{ marginBottom: 0 }}>What are you doing right now?</div>
          <button className="db-icon-btn" onClick={() => setShowSettings((s) => !s)} aria-label="Nudge settings"><IconGear /></button>
        </div>

        {showSettings && (
          <div className="db-ping-settings">
            <label className="db-toggle-label">
              <input type="checkbox" checked={ping.enabled} onChange={(e) => setPing({ ...ping, enabled: e.target.checked })} />
              Nudge me to log during a window
            </label>
            {ping.enabled && (
              <div className="db-ping-times">
                <input className="db-input db-input-time" type="time" aria-label="Nudge window start" value={ping.start} onChange={(e) => setPing({ ...ping, start: e.target.value })} />
                <span className="db-ping-to">to</span>
                <input className="db-input db-input-time" type="time" aria-label="Nudge window end" value={ping.end} onChange={(e) => setPing({ ...ping, end: e.target.value })} />
              </div>
            )}
          </div>
        )}

        <input className="db-input" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} placeholder="Type an activity…" />

        {routineChips.length > 0 && (
          <div className="db-chip-section">
            <div className="db-chip-section-label">Quick-log from routine — marks it done too</div>
            <div className="db-chip-row">
              {routineChips.map((h) => (
                <button key={h.id} className="db-chip db-chip-routine" onClick={() => logRoutineChip(h)}>
                  <CategoryDot category={h.category} size={6} /> {h.name}
                </button>
              ))}
            </div>
          </div>
        )}
        {frequentChips.length > 0 && (
          <div className="db-chip-section">
            <div className="db-chip-section-label">Frequent</div>
            <div className="db-chip-row">{frequentChips.map((c) => (<button key={c} className="db-chip" onClick={() => setText(c)}>{c}</button>))}</div>
          </div>
        )}

        <div className="db-tag-row">
          {TAGS.map((t) => (
            <button key={t} onClick={() => setTag(t)} className={`db-tag-btn${tag === t ? ' db-tag-btn-active' : ''}`} style={tag === t ? { borderColor: `var(${TAG_VAR[t]})`, color: `var(${TAG_VAR[t]})` } : undefined}>
              <span className="db-tag-dot" style={{ background: `var(${TAG_VAR[t]})` }} />{TAG_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="db-energy-row">
          <span className="db-energy-label">Energy</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} className={`db-energy-dot${energy >= n ? ' db-energy-dot-active' : ''}`} onClick={() => setEnergy(energy === n ? 0 : n)} aria-label={`Energy ${n} of 5`} />
          ))}
          {energy > 0 && <span className="db-energy-value">{energy}/5</span>}
        </div>

        <button className="db-btn db-btn-primary db-log-btn" onClick={submit}>Log it</button>
      </div>

      <div className="db-tally-row">
        {TAGS.map((t) => (
          <div key={t} className="db-tally-card"><div className="db-tally-num" style={{ color: `var(${TAG_VAR[t]})` }}>{tally[t] || 0}</div><div className="db-tally-label">{TAG_LABELS[t]}</div></div>
        ))}
      </div>
      {lastCheckinMs && <div className="db-meta-line">Last logged {formatRelative(Date.now() - lastCheckinMs)} · tap a colored dot below to re-tag an entry</div>}

      <div className="db-timeline">
        {grouped.length === 0 && <div className="db-empty">Nothing logged yet — the first entry starts today's page.</div>}
        {grouped.map(({ day, entries }) => (
          <div key={day} className="db-timeline-day">
            <div className="db-timeline-day-header"><span>{dayLabel(day, today)}</span><span className="db-timeline-day-date">{formatDateHeader(day)}</span></div>
            {entries.map((c) => (
              <div key={c.id} className="db-entry">
                <span className="db-entry-time">{formatLocalTime(c.logged_at)}</span>
                <button className="db-tag-dot-btn" style={{ background: `var(${TAG_VAR[c.tag]})` }} onClick={() => cycleTag(c.id)} aria-label={`Tag: ${c.tag}. Tap to change`} title="Tap to change tag" />
                <span className="db-entry-text">{c.activity}{c.energy ? <span className="db-entry-energy"> · energy {c.energy}/5</span> : null}</span>
                <InlineDeleteButton onConfirm={() => handleDelete(c.id)} label="Delete entry" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
