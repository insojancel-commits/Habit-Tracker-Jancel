import { useCallback, useEffect, useRef, useState } from 'react';
import { loadState, saveState, makeId, DEFAULT_PING } from '../lib/localStore.js';

/* All reads/writes go straight to localStorage — nothing ever touches the
   network, so the app works fully offline. State updates apply immediately
   (there's no round-trip to wait on) and are persisted right after. This
   hook is the single place that touches storage — components never read or
   write localStorage directly. Kept the same shape/names as the old
   Supabase-backed version so no component had to change. */
export function useDaybookData(_session, onError) {
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [ping, setPingState] = useState(DEFAULT_PING);
  const stateRef = useRef({ habits: [], habitLogs: [], checkins: [], ping: DEFAULT_PING });

  const reportError = useCallback(
    (context, error) => {
      // eslint-disable-next-line no-console
      console.error(context, error);
      if (onError) onError(`${context}: ${error?.message || 'something went wrong'}`);
    },
    [onError]
  );

  const persist = useCallback((next) => {
    stateRef.current = next;
    if (!saveState(next)) {
      reportError('Saving', new Error('Your browser refused to save (storage may be full or private mode).'));
    }
  }, [reportError]);

  useEffect(() => {
    const loaded = loadState();
    stateRef.current = loaded;
    setHabits(loaded.habits);
    setHabitLogs(loaded.habitLogs);
    setCheckins(loaded.checkins);
    setPingState(loaded.ping);
    setLoading(false);
  }, []);

  /* Lets Restore (Insights tab) replace everything in one shot after the
     user imports a backup file. */
  const replaceAll = useCallback((next) => {
    const merged = {
      habits: next.habits || [],
      habitLogs: next.habitLogs || [],
      checkins: next.checkins || [],
      ping: next.ping || DEFAULT_PING,
    };
    persist(merged);
    setHabits(merged.habits);
    setHabitLogs(merged.habitLogs);
    setCheckins(merged.checkins);
    setPingState(merged.ping);
  }, [persist]);

  /* ------------------------------ check-ins ------------------------------ */

  const addCheckin = useCallback(
    async (activity, tag, energy = null) => {
      const row = { id: makeId(), logged_at: new Date().toISOString(), activity, tag, energy };
      const next = { ...stateRef.current, checkins: [row, ...stateRef.current.checkins] };
      persist(next);
      setCheckins(next.checkins);
      return row;
    },
    [persist]
  );

  const deleteCheckin = useCallback(
    async (id) => {
      const row = stateRef.current.checkins.find((c) => c.id === id) || null;
      const next = { ...stateRef.current, checkins: stateRef.current.checkins.filter((c) => c.id !== id) };
      persist(next);
      setCheckins(next.checkins);
      return row; // caller keeps this around to offer Undo
    },
    [persist]
  );

  const restoreCheckin = useCallback(
    async (row) => {
      if (!row) return;
      const next = { ...stateRef.current, checkins: [row, ...stateRef.current.checkins] };
      persist(next);
      setCheckins(next.checkins);
    },
    [persist]
  );

  const cycleTag = useCallback(
    async (id) => {
      const order = ['productive', 'wasted', 'neutral'];
      const nextCheckins = stateRef.current.checkins.map((c) => {
        if (c.id !== id) return c;
        return { ...c, tag: order[(order.indexOf(c.tag) + 1) % order.length] };
      });
      const next = { ...stateRef.current, checkins: nextCheckins };
      persist(next);
      setCheckins(next.checkins);
    },
    [persist]
  );

  /* ------------------------------- habits -------------------------------- */

  const toggleHabitDone = useCallback(
    async (habitId, dateStr) => {
      const existing = stateRef.current.habitLogs.find((l) => l.habit_id === habitId && l.date === dateStr);
      let nextLogs;
      if (existing) {
        nextLogs = stateRef.current.habitLogs.map((l) => (l.id === existing.id ? { ...l, done: !l.done } : l));
      } else {
        nextLogs = [...stateRef.current.habitLogs, { id: makeId(), habit_id: habitId, date: dateStr, done: true, note: '' }];
      }
      const next = { ...stateRef.current, habitLogs: nextLogs };
      persist(next);
      setHabitLogs(next.habitLogs);
    },
    [persist]
  );

  const saveNote = useCallback(
    async (habitId, dateStr, note) => {
      const nextLogs = stateRef.current.habitLogs.map((l) =>
        l.habit_id === habitId && l.date === dateStr ? { ...l, note } : l
      );
      const next = { ...stateRef.current, habitLogs: nextLogs };
      persist(next);
      setHabitLogs(next.habitLogs);
    },
    [persist]
  );

  const saveHabit = useCallback(
    async (habitId, data) => {
      let nextHabits;
      if (habitId) {
        nextHabits = stateRef.current.habits.map((h) => (h.id === habitId ? { ...h, ...data } : h));
      } else {
        const sortOrder = stateRef.current.habits.length;
        nextHabits = [...stateRef.current.habits, { id: makeId(), sort_order: sortOrder, archived: false, ...data }];
      }
      const next = { ...stateRef.current, habits: nextHabits };
      persist(next);
      setHabits(next.habits);
    },
    [persist]
  );

  const archiveHabit = useCallback(
    async (habitId) => {
      const nextHabits = stateRef.current.habits.map((h) => (h.id === habitId ? { ...h, archived: true } : h));
      const next = { ...stateRef.current, habits: nextHabits };
      persist(next);
      setHabits(next.habits);
    },
    [persist]
  );

  const restoreHabit = useCallback(
    async (habitId) => {
      const nextHabits = stateRef.current.habits.map((h) => (h.id === habitId ? { ...h, archived: false } : h));
      const next = { ...stateRef.current, habits: nextHabits };
      persist(next);
      setHabits(next.habits);
    },
    [persist]
  );

  const deleteHabitForever = useCallback(
    async (habitId) => {
      const nextHabits = stateRef.current.habits.filter((h) => h.id !== habitId);
      const nextLogs = stateRef.current.habitLogs.filter((l) => l.habit_id !== habitId);
      const next = { ...stateRef.current, habits: nextHabits, habitLogs: nextLogs };
      persist(next);
      setHabits(next.habits);
      setHabitLogs(next.habitLogs);
    },
    [persist]
  );

  const moveHabit = useCallback(
    async (habitId, direction) => {
      const habit = stateRef.current.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const sameBlock = stateRef.current.habits
        .filter((h) => h.time_block === habit.time_block && !h.archived)
        .sort((a, b) => a.sort_order - b.sort_order);
      const idx = sameBlock.findIndex((h) => h.id === habitId);
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sameBlock.length) return;
      const other = sameBlock[swapIdx];

      const nextHabits = stateRef.current.habits.map((h) => {
        if (h.id === habit.id) return { ...h, sort_order: other.sort_order };
        if (h.id === other.id) return { ...h, sort_order: habit.sort_order };
        return h;
      });
      const next = { ...stateRef.current, habits: nextHabits };
      persist(next);
      setHabits(next.habits);
    },
    [persist]
  );

  /* ------------------------------- settings ------------------------------- */

  const setPing = useCallback(
    async (nextPing) => {
      const next = { ...stateRef.current, ping: nextPing };
      persist(next);
      setPingState(next.ping);
    },
    [persist]
  );

  return {
    loading,
    habits,
    habitLogs,
    checkins,
    ping,
    addCheckin,
    deleteCheckin,
    restoreCheckin,
    cycleTag,
    toggleHabitDone,
    saveNote,
    saveHabit,
    archiveHabit,
    restoreHabit,
    deleteHabitForever,
    moveHabit,
    setPing,
    replaceAll,
  };
}
