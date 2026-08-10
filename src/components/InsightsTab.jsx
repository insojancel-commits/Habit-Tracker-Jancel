import React, { useMemo, useRef } from 'react';
import { todayLocal, localDateFromISO, addDaysLocal, weekdayIndexLocal, WEEKDAYS, WEEKDAYS_SHORT } from '../lib/dateHelpers.js';
import { calcStreak, calcLongestStreak } from '../lib/streaks.js';
import { TAGS, TAG_LABELS, TAG_VAR } from '../lib/constants.js';
import { CategoryDot, ProgressRing, ContributionHeatmap, IconDownload } from './ui.jsx';
import { exportHabitsCsv, exportHabitLogsCsv, exportCheckinsCsv } from '../lib/csvExport.js';
import { exportBackup, parseBackup } from '../lib/localStore.js';

export default function InsightsTab({ habits, habitLogs, checkins, backupState, onRestore, onToast }) {
  const fileInputRef = useRef(null);

  function handleBackup() {
    exportBackup(backupState);
    if (onToast) onToast({ message: 'Backup saved to your downloads.' });
  }

  function handleRestoreClick() {
    fileInputRef.current?.click();
  }

  function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const restored = parseBackup(String(reader.result || ''));
        const ok = window.confirm(
          `Restore from this backup? This replaces everything currently on this device: ${restored.habits.length} habits, ${restored.checkins.length} check-ins.`
        );
        if (!ok) return;
        onRestore(restored);
        if (onToast) onToast({ message: 'Backup restored.' });
      } catch (err) {
        if (onToast) onToast({ message: err.message || 'Could not read that backup file.', tone: 'error' });
      }
    };
    reader.readAsText(file);
  }

  const today = todayLocal();
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const streaks = useMemo(() => activeHabits
    .map((h) => ({ habit: h, streak: calcStreak(h.id, habitLogs, today), best: calcLongestStreak(h.id, habitLogs) }))
    .sort((a, b) => b.streak - a.streak), [activeHabits, habitLogs, today]);

  function tallyForWindow(startDaysAgo, endDaysAgoExclusive) {
    const from = addDaysLocal(today, -startDaysAgo);
    const to = addDaysLocal(today, -(endDaysAgoExclusive - 1));
    const t = { productive: 0, wasted: 0, neutral: 0 };
    checkins.forEach((c) => {
      const day = localDateFromISO(c.logged_at);
      if (day >= to && day <= from) t[c.tag] = (t[c.tag] || 0) + 1;
    });
    return t;
  }
  const last7 = useMemo(() => tallyForWindow(6, 0), [checkins, today]);
  const prev7 = useMemo(() => tallyForWindow(13, 7), [checkins, today]);
  const last7Total = last7.productive + last7.wasted + last7.neutral;
  const prev7Total = prev7.productive + prev7.wasted + prev7.neutral;

  const trendSentence = useMemo(() => {
    if (last7Total === 0) return null;
    if (prev7Total === 0) return `${last7.productive} productive check-in${last7.productive === 1 ? '' : 's'} logged this week.`;
    const diff = last7.productive - prev7.productive;
    if (diff > 0) return `Productive check-ins are up ${diff} from last week (${prev7.productive} → ${last7.productive}).`;
    if (diff < 0) return `Productive check-ins are down ${Math.abs(diff)} from last week (${prev7.productive} → ${last7.productive}).`;
    return `Productive check-ins are flat with last week, at ${last7.productive}.`;
  }, [last7, prev7, last7Total, prev7Total]);

  const essentialHabits = useMemo(() => activeHabits.filter((h) => h.is_essential), [activeHabits]);
  const essentialDoneToday = useMemo(() => {
    const doneSet = new Set(habitLogs.filter((l) => l.date === today && l.done).map((l) => l.habit_id));
    return essentialHabits.filter((h) => doneSet.has(h.id)).length;
  }, [essentialHabits, habitLogs, today]);
  const mvdFraction = essentialHabits.length > 0 ? essentialDoneToday / essentialHabits.length : null;

  const weekdayBreakdown = useMemo(() => {
    const buckets = WEEKDAYS.map(() => ({ productive: 0, wasted: 0, neutral: 0 }));
    checkins.forEach((c) => { const idx = weekdayIndexLocal(localDateFromISO(c.logged_at)); buckets[idx][c.tag] = (buckets[idx][c.tag] || 0) + 1; });
    return buckets;
  }, [checkins]);
  const maxWeekdayTotal = Math.max(1, ...weekdayBreakdown.map((b) => b.productive + b.wasted + b.neutral));

  const dayCallouts = useMemo(() => {
    let best = null, toughest = null;
    weekdayBreakdown.forEach((b, i) => {
      const total = b.productive + b.wasted + b.neutral;
      if (total === 0) return;
      const prodRatio = b.productive / total, wasteRatio = b.wasted / total;
      if (!best || prodRatio > best.ratio) best = { day: WEEKDAYS[i], ratio: prodRatio };
      if (!toughest || wasteRatio > toughest.ratio) toughest = { day: WEEKDAYS[i], ratio: wasteRatio };
    });
    return { best, toughest };
  }, [weekdayBreakdown]);

  return (
    <div>
      {trendSentence && <div className="db-callout">{trendSentence}</div>}

      <div className="db-card db-mvd-card">
        <div className="db-eyebrow">Minimum viable day</div>
        {mvdFraction === null ? (
          <div className="db-empty">Mark a habit "essential" in Routine to track this.</div>
        ) : (
          <div className="db-mvd-layout">
            <ProgressRing fraction={mvdFraction} color="var(--amber)"><div className="db-ring-num">{essentialDoneToday}/{essentialHabits.length}</div></ProgressRing>
            <div className="db-mvd-list">
              {essentialHabits.map((h) => {
                const done = habitLogs.some((l) => l.habit_id === h.id && l.date === today && l.done);
                return (<span key={h.id} className={`db-mvd-pill${done ? ' db-mvd-pill-done' : ''}`}><CategoryDot category={h.category} /> {h.name}</span>);
              })}
            </div>
          </div>
        )}
      </div>

      <div className="db-card">
        <div className="db-eyebrow">Habit streaks</div>
        {streaks.length === 0 && <div className="db-empty">No habits yet.</div>}
        {streaks.map(({ habit, streak, best }) => (
          <div key={habit.id} className="db-insight-streak-row">
            <CategoryDot category={habit.category} />
            <span className="db-insight-streak-name">{habit.name}{habit.is_bad_habit && <span className="db-habit-flag">avoid</span>}</span>
            <span className="db-insight-streak-num">{streak}d <span className="db-insight-streak-best">best {best}d</span></span>
          </div>
        ))}
      </div>

      <div className="db-card">
        <div className="db-eyebrow">Last 8 weeks, at a glance</div>
        <ContributionHeatmap habits={activeHabits} habitLogs={habitLogs} todayStr={today} />
        <div className="db-heatmap-legend"><span>Fewer</span>{[0, 1, 2, 3, 4].map((l) => <span key={l} className={`db-heatmap-cell db-heatmap-level-${l}`} />)}<span>More</span></div>
      </div>

      <div className="db-card">
        <div className="db-eyebrow">Last 7 days</div>
        <div className="db-tally-row">
          {TAGS.map((t) => (<div key={t} className="db-tally-card"><div className="db-tally-num" style={{ color: `var(${TAG_VAR[t]})` }}>{last7[t]}</div><div className="db-tally-label">{TAG_LABELS[t]}</div></div>))}
        </div>
        {last7Total > 0 ? (
          <div className="db-stacked-bar">{TAGS.map((t) => last7[t] > 0 && <div key={t} style={{ width: `${(last7[t] / last7Total) * 100}%`, background: `var(${TAG_VAR[t]})` }} />)}</div>
        ) : <div className="db-empty">No check-ins in the last 7 days.</div>}
      </div>

      <div className="db-card">
        <div className="db-eyebrow">By weekday</div>
        <div className="db-weekday-grid">
          {WEEKDAYS_SHORT.map((label, idx) => {
            const b = weekdayBreakdown[idx];
            const total = b.productive + b.wasted + b.neutral;
            return (
              <div key={label} className="db-weekday-col">
                <div className="db-weekday-bar-track">{total > 0 && TAGS.map((t) => b[t] > 0 && (<div key={t} className="db-weekday-bar-seg" style={{ height: `${(b[t] / maxWeekdayTotal) * 100}%`, background: `var(${TAG_VAR[t]})` }} />))}</div>
                <div className="db-weekday-label">{label}</div>
              </div>
            );
          })}
        </div>
        {(dayCallouts.best || dayCallouts.toughest) && (
          <div className="db-meta-line" style={{ marginTop: 10 }}>
            {dayCallouts.best && <>Best day: <strong style={{ color: 'var(--text)' }}>{dayCallouts.best.day}</strong></>}
            {dayCallouts.best && dayCallouts.toughest && '  ·  '}
            {dayCallouts.toughest && <>Toughest: <strong style={{ color: 'var(--text)' }}>{dayCallouts.toughest.day}</strong></>}
          </div>
        )}
      </div>

      <div className="db-card">
        <div className="db-eyebrow">Backup</div>
        <div className="db-meta-line" style={{ marginBottom: 10 }}>
          Everything lives only in this browser. Back up regularly, and before switching phones or clearing browser data.
        </div>
        <div className="db-export-row">
          <button className="db-btn db-btn-sm" onClick={handleBackup}><IconDownload /> Download backup</button>
          <button className="db-btn db-btn-sm" onClick={handleRestoreClick}>Restore from file</button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={handleFileChosen}
        />
      </div>

      <div className="db-card">
        <div className="db-eyebrow">Export as CSV</div>
        <div className="db-export-row">
          <button className="db-btn db-btn-sm" onClick={() => exportHabitsCsv(habits)}><IconDownload /> Habits</button>
          <button className="db-btn db-btn-sm" onClick={() => exportHabitLogsCsv(habitLogs)}><IconDownload /> Habit logs</button>
          <button className="db-btn db-btn-sm" onClick={() => exportCheckinsCsv(checkins)}><IconDownload /> Check-ins</button>
        </div>
      </div>
    </div>
  );
}
