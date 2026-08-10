import React, { useMemo, useState } from 'react';
import { addDaysLocal, weekdayIndexLocal, WEEKDAYS_SHORT } from '../lib/dateHelpers.js';

export const CATEGORY_VAR = { business: '--cat-business', content: '--cat-content', health: '--cat-health', personal: '--cat-personal' };

export function CategoryDot({ category, size = 7 }) {
  return <span className="db-dot" style={{ width: size, height: size, background: `var(${CATEGORY_VAR[category]})` }} />;
}

export function IconClose() { return (<svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>); }
export function IconCheck() { return (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6.2L4.7 9L10 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function IconBan() { return (<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4.6" stroke="currentColor" strokeWidth="1.4" /><path d="M3 3L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>); }
export function IconChevUp() { return (<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 6.5L5 3L8.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function IconChevDown() { return (<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 3.5L5 7L8.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function IconChevLeft() { return (<svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M6.5 1.5L3 5L6.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function IconChevRight() { return (<svg width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L7 5L3.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>); }
export function IconGear() { return (<svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.3" /><path d="M8 1.6v1.5M8 12.9v1.5M14.4 8h-1.5M3.1 8H1.6M12.4 3.6l-1 1M4.6 11.4l-1 1M12.4 12.4l-1-1M4.6 4.6l-1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>); }
export function IconArchive() { return (<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="2" width="11" height="2.6" rx="0.6" stroke="currentColor" strokeWidth="1.2" /><path d="M2.5 4.9v6.4c0 .6.5 1.1 1.1 1.1h6.8c.6 0 1.1-.5 1.1-1.1V4.9" stroke="currentColor" strokeWidth="1.2" /><path d="M5.6 7.4h2.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>); }
export function IconDownload() { return (<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1.5v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><path d="M3.6 6.4L7 9.8l3.4-3.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M1.8 11.4v0.9c0 .6.5 1.1 1.1 1.1h8.2c.6 0 1.1-.5 1.1-1.1v-0.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>); }

export function WeekStrip({ habit, habitLogs, todayStr }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysLocal(todayStr, -(6 - i))), [todayStr]);
  const doneDates = useMemo(() => new Set(habitLogs.filter((l) => l.habit_id === habit.id && l.done).map((l) => l.date)), [habitLogs, habit.id]);
  return (
    <div className="db-weekstrip">
      {days.map((d) => {
        const done = doneDates.has(d);
        return (
          <span
            key={d}
            className={`db-weekstrip-cell${done ? ' db-weekstrip-cell-filled' : ''}${d === todayStr ? ' db-weekstrip-cell-today' : ''}`}
            style={done ? { background: `var(${CATEGORY_VAR[habit.category]})` } : undefined}
            title={`${d}${done ? ' — done' : ''}`}
          />
        );
      })}
    </div>
  );
}

export function ProgressRing({ fraction, size = 68, stroke = 6, color = 'var(--amber)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, fraction)));
  return (
    <div className="db-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--hairline)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="db-ring-fill" />
      </svg>
      <div className="db-ring-center">{children}</div>
    </div>
  );
}

export function ContributionHeatmap({ habits, habitLogs, todayStr, weeks = 9 }) {
  const totalDays = weeks * 7;
  const countByDate = useMemo(() => {
    const m = new Map();
    habitLogs.forEach((l) => { if (l.done) m.set(l.date, (m.get(l.date) || 0) + 1); });
    return m;
  }, [habitLogs]);

  const columns = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => addDaysLocal(todayStr, -(totalDays - 1 - i)));
    const firstWeekday = weekdayIndexLocal(days[0]);
    const padded = [...Array(firstWeekday).fill(null), ...days];
    const cols = [];
    for (let i = 0; i < padded.length; i += 7) cols.push(padded.slice(i, i + 7));
    return cols;
  }, [todayStr, totalDays]);

  const max = Math.max(1, habits.length);
  function levelFor(count) {
    if (!count) return 0;
    const frac = count / max;
    if (frac >= 0.99) return 4;
    if (frac >= 0.66) return 3;
    if (frac >= 0.33) return 2;
    return 1;
  }

  return (
    <div className="db-heatmap">
      <div className="db-heatmap-daylabels">{WEEKDAYS_SHORT.map((d, i) => (<span key={d}>{i % 2 === 1 ? d[0] : ''}</span>))}</div>
      <div className="db-heatmap-grid">
        {columns.map((col, ci) => (
          <div key={ci} className="db-heatmap-col">
            {col.map((d, ri) => {
              if (!d) return <span key={ri} className="db-heatmap-cell db-heatmap-cell-empty" />;
              const level = levelFor(countByDate.get(d) || 0);
              return <span key={d} className={`db-heatmap-cell db-heatmap-level-${level}${d === todayStr ? ' db-heatmap-cell-today' : ''}`} title={`${d}: ${countByDate.get(d) || 0} habit(s) done`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function InlineDeleteButton({ onConfirm, label = 'Delete' }) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="db-inline-confirm">
        <button className="db-inline-confirm-yes" onClick={onConfirm} aria-label={`Confirm ${label.toLowerCase()}`}><IconCheck /></button>
        <button className="db-inline-confirm-no" onClick={() => setConfirming(false)} aria-label="Cancel"><IconClose /></button>
      </span>
    );
  }
  return <button className="db-entry-del" onClick={() => setConfirming(true)} aria-label={label}><IconClose /></button>;
}
