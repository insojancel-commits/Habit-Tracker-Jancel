import React, { useState } from 'react';
import { TIME_BLOCKS, TIME_BLOCK_LABELS, CATEGORIES, CATEGORY_LABELS } from '../lib/constants.js';
import { CategoryDot } from './ui.jsx';

export default function HabitEditorModal({ initial, onSave, onArchive, onDeleteForever, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [timeBlock, setTimeBlock] = useState(initial?.time_block || 'morning');
  const [scheduledTime, setScheduledTime] = useState(initial?.scheduled_time || '');
  const [category, setCategory] = useState(initial?.category || 'personal');
  const [isBad, setIsBad] = useState(initial?.is_bad_habit || false);
  const [isEssential, setIsEssential] = useState(initial?.is_essential || false);
  const [confirmingDeleteForever, setConfirmingDeleteForever] = useState(false);

  function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, time_block: timeBlock, scheduled_time: scheduledTime, category, is_bad_habit: isBad, is_essential: isEssential });
  }

  return (
    <div className="db-modal-overlay" onClick={onClose}>
      <div className="db-modal" onClick={(e) => e.stopPropagation()}>
        <div className="db-modal-title">{initial ? 'Edit habit' : 'Add habit'}</div>

        <label className="db-field-label">Name</label>
        <input className="db-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stretch" autoFocus />

        <label className="db-field-label">Time block</label>
        <div className="db-segmented">
          {TIME_BLOCKS.map((tb) => (<button key={tb} className={`db-segmented-btn${timeBlock === tb ? ' db-segmented-btn-active' : ''}`} onClick={() => setTimeBlock(tb)}>{TIME_BLOCK_LABELS[tb]}</button>))}
        </div>

        <label className="db-field-label">Scheduled time (optional)</label>
        <input className="db-input" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />

        <label className="db-field-label">Category</label>
        <div className="db-segmented">
          {CATEGORIES.map((c) => (
            <button key={c} className={`db-segmented-btn${category === c ? ' db-segmented-btn-active' : ''}`} onClick={() => setCategory(c)}>
              <CategoryDot category={c} /> <span style={{ marginLeft: 5 }}>{CATEGORY_LABELS[c]}</span>
            </button>
          ))}
        </div>

        <div className="db-toggle-row">
          <label className="db-toggle-label"><input type="checkbox" checked={isBad} onChange={(e) => setIsBad(e.target.checked)} /> Bad habit (log = avoided it)</label>
          <label className="db-toggle-label"><input type="checkbox" checked={isEssential} onChange={(e) => setIsEssential(e.target.checked)} /> Essential (counts toward minimum viable day)</label>
        </div>

        <div className="db-modal-actions">
          {initial && !confirmingDeleteForever && (
            <div className="db-modal-danger-group">
              <button className="db-btn db-btn-danger" onClick={onArchive}>Archive</button>
              <button className="db-link-danger" onClick={() => setConfirmingDeleteForever(true)}>Delete forever</button>
            </div>
          )}
          {initial && confirmingDeleteForever && (
            <div className="db-confirm-delete-row">
              <span className="db-confirm-delete-text">Delete & erase history — cannot be undone.</span>
              <button className="db-btn db-btn-danger db-btn-sm" onClick={onDeleteForever}>Confirm</button>
              <button className="db-btn db-btn-sm" onClick={() => setConfirmingDeleteForever(false)}>Cancel</button>
            </div>
          )}
          {!confirmingDeleteForever && (
            <div className="db-modal-actions-right">
              <button className="db-btn" onClick={onClose}>Cancel</button>
              <button className="db-btn db-btn-primary" onClick={handleSave}>Save</button>
            </div>
          )}
        </div>
        {initial && (
          <div className="db-modal-hint">Archiving hides it from Routine but keeps its history — you can restore it later from "Archived habits".</div>
        )}
      </div>
    </div>
  );
}
