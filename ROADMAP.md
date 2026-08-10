# Roadmap

Everything below was on the table but isn't built yet. Nothing here is
required reading — it's a backlog so ideas don't get lost, not a promise.
Roughly ordered by how much value-per-effort they'd likely add.

## Worth doing next
- Real-time multi-device sync (Supabase Realtime subscriptions) instead of
  "refresh to see the other device's changes"
- Offline write queue — let the service worker queue mutations made while
  offline and replay them on reconnect
- Monthly calendar grid view of Routine (the day-by-day nav that shipped
  is a start; a full month view is the next step)
- Per-habit reminder times (today there's one global check-in nudge window)
- Flexible habit schedules ("3x per week" instead of daily), so streak math
  doesn't punish planned rest days
- Habit templates (a starter "morning routine" bundle) for faster setup

## Nice to have
- Sleep hours / energy-vs-output correlation view (the energy slider on
  check-ins is logged but not yet charted)
- Light mode alongside the current dark theme
- Weekly reflection prompt saved as a longer journal entry, separate from
  check-ins
- Auto-tag suggestions based on how you've tagged similar text before
- Bulk re-tag ("find all entries containing X, retag them")
- Correlation call-outs ("productive days often follow Workout") — purely
  descriptive pattern-matching, not a causal claim
- Custom categories instead of the fixed four (business/content/health/personal)
- Habit icons in addition to the category color dot

## Later / exploratory
- Calendar-event-aware check-in suggestions
- Optional accountability partner (sees only pass/fail on essentials, never
  the actual log)
- Import from other habit trackers
- Keyboard shortcuts for desktop use
- Undo toast coverage for habit deletion too (currently only check-in
  deletes offer Undo; habit deletion instead uses archive-first, which is
  its own form of "undo")

## Known limitations to know about
- No conflict resolution if you edit the same day from two devices at once
  — last write wins
- CSV export is three flat files (habits / habit_logs / checkins), not a
  single bundled export — good enough for backup or a spreadsheet, not a
  one-click restore
- Background sync errors surface as a toast but there's no retry queue —
  if a write fails you'll need to redo it
