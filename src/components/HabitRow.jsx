import React, { useState } from 'react';
import { calcStreak } from '../lib/streaks.js';
import { CategoryDot, WeekStrip, IconCheck, IconBan, IconChevUp, IconChevDown } from './ui.jsx';

export default function HabitRow({ habit, habitLogs, viewDate, done, editable, toggleHabitDone, onEdit, saveNote, moveHabit, disableUp, disableDown }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const existingLog = habitLogs.find((l) => l.habit_id === habit.id && l.date === viewDate);
  const [noteDraft, setNoteDraft] = useState(existingLog?.note || '');
  const streak = calcStreak(habit.id, habitLogs, viewDate);

  function commitNote() { saveNote(habit.id, viewDate, noteDraft.trim()); setNoteOpen(false); }

  return (
    <div className="db-habit-row">
      <div className="db-habit-row-main">
        <button className={`db-toggle${done ? (habit.is_bad_habit ? ' db-toggle-avoided' : ' db-toggle-done') : ''}`} onClick={() => toggleHabitDone(habit.id, viewDate)} aria-label={habit.is_bad_habit ? 'Mark avoided' : 'Mark done'}>
          {done ? (habit.is_bad_habit ? <IconBan /> : <IconCheck />) : null}
        </button>
        <CategoryDot category={habit.category} />
        <button className="db-habit-name" onClick={onEdit}>
          {habit.name}
          {habit.is_bad_habit && <span className="db-habit-flag">avoid</span>}
          {habit.is_essential && <span className="db-habit-flag db-habit-flag-essential">essential</span>}
        </button>
        {habit.scheduled_time && <span className="db-habit-time">{habit.scheduled_time}</span>}
        {editable && (
          <span className="db-reorder">
            <button className="db-reorder-btn" onClick={() => moveHabit(habit.id, 'up')} disabled={disableUp} aria-label="Move up"><IconChevUp /></button>
            <button className="db-reorder-btn" onClick={() => moveHabit(habit.id, 'down')} disabled={disableDown} aria-label="Move down"><IconChevDown /></button>
          </span>
        )}
      </div>
      <div className="db-habit-row-sub">
        <WeekStrip habit={habit} habitLogs={habitLogs} todayStr={viewDate} />
        <span className="db-habit-streak">{streak > 0 ? `${streak}d streak` : 'no streak'}</span>
      </div>
      {done && !habit.is_bad_habit && (
        noteOpen ? (
          <div className="db-note-row">
            <input className="db-input db-note-input" autoFocus value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitNote(); if (e.key === 'Escape') setNoteOpen(false); }} placeholder="Add a quick note…" />
            <button className="db-icon-btn" onClick={commitNote} aria-label="Save note"><IconCheck /></button>
          </div>
        ) : existingLog?.note ? (
          <button className="db-note-text" onClick={() => setNoteOpen(true)}>{existingLog.note}</button>
        ) : (
          <button className="db-note-toggle" onClick={() => setNoteOpen(true)}>+ add note</button>
        )
      )}
    </div>
  );
}
