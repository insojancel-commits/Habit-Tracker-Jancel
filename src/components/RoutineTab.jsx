import React, { useMemo, useState } from 'react';
import { todayLocal, localDateFromISO, addDaysLocal, dayLabel, formatDateHeader, getTimeBlockForHour } from '../lib/dateHelpers.js';
import { calcStreak } from '../lib/streaks.js';
import { TIME_BLOCKS, TIME_BLOCK_LABELS, RISK_HOUR } from '../lib/constants.js';
import { IconChevLeft, IconChevRight, CategoryDot } from './ui.jsx';
import HabitRow from './HabitRow.jsx';
import HabitEditorModal from './HabitEditorModal.jsx';

export default function RoutineTab({ habits, habitLogs, checkins, toggleHabitDone, saveHabit, archiveHabit, restoreHabit, deleteHabitForever, moveHabit, saveNote }) {
  const [editing, setEditing] = useState(null);
  const [viewDate, setViewDate] = useState(todayLocal());
  const [showArchived, setShowArchived] = useState(false);
  const today = todayLocal();
  const isToday = viewDate === today;
  const hour = new Date().getHours();

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);

  const doneOnViewDateSet = useMemo(() => new Set(habitLogs.filter((l) => l.date === viewDate && l.done).map((l) => l.habit_id)), [habitLogs, viewDate]);

  const todaysCheckinTexts = useMemo(
    () => (isToday ? checkins.filter((c) => localDateFromISO(c.logged_at) === today).map((c) => c.activity.toLowerCase()) : []),
    [checkins, today, isToday]
  );
  const mismatches = useMemo(() => {
    if (!isToday) return [];
    return activeHabits
      .filter((h) => !doneOnViewDateSet.has(h.id))
      .map((h) => {
        const nameLower = h.name.toLowerCase();
        const match = todaysCheckinTexts.find((t) => t.includes(nameLower) || nameLower.includes(t));
        return match ? { habit: h, matchedText: match } : null;
      }).filter(Boolean);
  }, [activeHabits, doneOnViewDateSet, todaysCheckinTexts, isToday]);

  const atRiskHabits = useMemo(() => {
    if (!isToday) return [];
    return activeHabits.filter((h) => !h.is_bad_habit && !doneOnViewDateSet.has(h.id) && calcStreak(h.id, habitLogs, today) > 0);
  }, [activeHabits, doneOnViewDateSet, habitLogs, today, isToday]);

  const byBlock = useMemo(() => {
    const map = {};
    TIME_BLOCKS.forEach((tb) => { map[tb] = []; });
    [...activeHabits].sort((a, b) => a.sort_order - b.sort_order).forEach((h) => { (map[h.time_block] || (map[h.time_block] = [])).push(h); });
    return map;
  }, [activeHabits]);

  const essentialTotal = activeHabits.filter((h) => h.is_essential).length;
  const essentialDone = activeHabits.filter((h) => h.is_essential && doneOnViewDateSet.has(h.id)).length;
  const currentBlock = getTimeBlockForHour(hour);

  return (
    <div>
      <div className="db-date-nav">
        <button className="db-icon-btn" onClick={() => setViewDate(addDaysLocal(viewDate, -1))} aria-label="Previous day"><IconChevLeft /></button>
        <div className="db-date-nav-label">
          <span>{dayLabel(viewDate, today)}</span>
          <span className="db-date-nav-sub">{formatDateHeader(viewDate)}</span>
        </div>
        <button className="db-icon-btn" onClick={() => setViewDate(addDaysLocal(viewDate, 1))} disabled={viewDate >= today} aria-label="Next day"><IconChevRight /></button>
        {!isToday && <button className="db-btn db-btn-sm db-date-today-btn" onClick={() => setViewDate(today)}>Today</button>}
      </div>

      {hour >= RISK_HOUR && atRiskHabits.length > 0 && (
        <div className="db-risk-banner">Protect your streak — {atRiskHabits.map((h) => h.name).join(', ')} still open tonight.</div>
      )}

      {mismatches.map(({ habit, matchedText }) => (
        <div key={habit.id} className="db-mismatch">
          <span>You logged "{matchedText}" — mark <strong>{habit.name}</strong> done?</span>
          <button className="db-btn db-btn-primary db-btn-sm" onClick={() => toggleHabitDone(habit.id, viewDate)}>Mark done</button>
        </div>
      ))}

      {essentialTotal > 0 && (
        <div className="db-mini-ledger">
          <span>{essentialDone}/{essentialTotal} essential done</span>
          <span className="db-mini-ledger-dot">·</span>
          <span>{activeHabits.length} habit{activeHabits.length === 1 ? '' : 's'} tracked</span>
        </div>
      )}

      {activeHabits.length === 0 && (
        <div className="db-empty-state">No habits yet. Add your first one below — mornings, afternoons, and evenings each get their own section.</div>
      )}

      {TIME_BLOCKS.map((tb) => byBlock[tb] && byBlock[tb].length > 0 && (
        <div key={tb} className="db-card">
          <div className="db-block-header">{TIME_BLOCK_LABELS[tb]}{tb === currentBlock && isToday && <span className="db-now-flag">now</span>}</div>
          {byBlock[tb].map((h, idx) => (
            <HabitRow
              key={h.id} habit={h} habitLogs={habitLogs} viewDate={viewDate} done={doneOnViewDateSet.has(h.id)} editable
              toggleHabitDone={toggleHabitDone} onEdit={() => setEditing(h)} saveNote={saveNote} moveHabit={moveHabit}
              disableUp={idx === 0} disableDown={idx === byBlock[tb].length - 1}
            />
          ))}
        </div>
      ))}

      <button className="db-btn db-add-habit-btn" onClick={() => setEditing('new')}>+ Add habit</button>

      {archivedHabits.length > 0 && (
        <div className="db-archived-section">
          <button className="db-archived-toggle" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? 'Hide' : 'Show'} archived habits ({archivedHabits.length})
          </button>
          {showArchived && (
            <div className="db-card">
              {archivedHabits.map((h) => (
                <div key={h.id} className="db-archived-row">
                  <CategoryDot category={h.category} />
                  <span className="db-archived-name">{h.name}</span>
                  <button className="db-btn db-btn-sm" onClick={() => restoreHabit(h.id)}>Restore</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && (
        <HabitEditorModal
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => { saveHabit(editing === 'new' ? null : editing.id, data); setEditing(null); }}
          onArchive={() => { archiveHabit(editing.id); setEditing(null); }}
          onDeleteForever={() => { deleteHabitForever(editing.id); setEditing(null); }}
        />
      )}
    </div>
  );
}
