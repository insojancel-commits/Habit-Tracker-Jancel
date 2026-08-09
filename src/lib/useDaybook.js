import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from './supabase'
import { todayISO, isoDaysAgo } from './dates'

const LOCAL_SETTINGS_KEY = 'daybook_settings_v1'

const DEFAULT_SETTINGS = {
  ping_start: '08:00',
  ping_end: '20:00',
  ping_interval_min: 15,
  ping_enabled: false,
  quick_chips: ['Filming', 'Editing', 'Client work', 'Admin', 'Gym', 'Eating', 'Scrolling', 'Resting']
}

export function useDaybook() {
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([]) // habit_logs, last 90 days
  const [checkins, setCheckins] = useState([]) // last 14 days
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load settings from localStorage (device-local, not synced — intentional: ping window is per-device)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_SETTINGS_KEY)
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) })
    } catch (e) { /* ignore */ }
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      try { localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(next)) } catch (e) {}
      return next
    })
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [habitsRes, logsRes, checkinsRes] = await Promise.all([
        supabase.from('habits').select('*').order('sort_order', { ascending: true }),
        supabase.from('habit_logs').select('*').gte('completed_date', isoDaysAgo(90)),
        // Fetch a day extra on each side to absorb UTC/local boundary drift, then the UI filters precisely by local date.
        supabase.from('checkins').select('*').gte('logged_at', isoDaysAgo(15) + 'T00:00:00Z').order('logged_at', { ascending: false })
      ])
      if (habitsRes.error) throw habitsRes.error
      if (logsRes.error) throw logsRes.error
      if (checkinsRes.error) throw checkinsRes.error
      setHabits(habitsRes.data || [])
      setLogs(logsRes.data || [])
      setCheckins(checkinsRes.data || [])
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // ---- Habits ----
  const addHabit = useCallback(async (habit) => {
    const { data, error } = await supabase.from('habits').insert({
      name: habit.name,
      time_block: habit.time_block || 'morning',
      scheduled_time: habit.scheduled_time || null,
      category: habit.category || 'personal',
      is_bad_habit: habit.is_bad_habit || false,
      is_essential: habit.is_essential || false,
      sort_order: habits.length
    }).select().single()
    if (error) throw error
    setHabits(prev => [...prev, data])
    return data
  }, [habits.length])

  const updateHabit = useCallback(async (id, patch) => {
    const { data, error } = await supabase.from('habits').update(patch).eq('id', id).select().single()
    if (error) throw error
    setHabits(prev => prev.map(h => h.id === id ? data : h))
    return data
  }, [])

  const deleteHabit = useCallback(async (id) => {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw error
    setHabits(prev => prev.filter(h => h.id !== id))
    setLogs(prev => prev.filter(l => l.habit_id !== id))
  }, [])

  // ---- Habit completion toggling ----
  const toggleHabitDone = useCallback(async (habitId, dateISO, note = null) => {
    const existing = logs.find(l => l.habit_id === habitId && l.completed_date === dateISO)
    if (existing) {
      const { error } = await supabase.from('habit_logs').delete().eq('id', existing.id)
      if (error) throw error
      setLogs(prev => prev.filter(l => l.id !== existing.id))
      return null
    } else {
      const { data, error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        completed_date: dateISO,
        note
      }).select().single()
      if (error) throw error
      setLogs(prev => [...prev, data])
      return data
    }
  }, [logs])

  // ---- Check-ins ----
  const addCheckin = useCallback(async (activity, tag = 'neutral') => {
    const { data, error } = await supabase.from('checkins').insert({
      activity,
      tag
    }).select().single()
    if (error) throw error
    setCheckins(prev => [data, ...prev])
    return data
  }, [])

  const deleteCheckin = useCallback(async (id) => {
    const { error } = await supabase.from('checkins').delete().eq('id', id)
    if (error) throw error
    setCheckins(prev => prev.filter(c => c.id !== id))
  }, [])

  // ---- Derived: logs grouped by date ----
  const logsByDate = useMemo(() => {
    const map = {}
    for (const l of logs) {
      if (!map[l.completed_date]) map[l.completed_date] = new Set()
      map[l.completed_date].add(l.habit_id)
    }
    return map
  }, [logs])

  const isHabitDoneOn = useCallback((habitId, dateISO) => {
    return !!logsByDate[dateISO]?.has(habitId)
  }, [logsByDate])

  // ---- Streaks ----
  const streakFor = useCallback((habitId) => {
    let streak = 0
    let cursor = todayISO()
    // if today not done yet, start counting from yesterday (don't break streak just because day isn't over)
    if (!isHabitDoneOn(habitId, cursor)) {
      cursor = isoDaysAgo(1)
    }
    while (true) {
      if (isHabitDoneOn(habitId, cursor)) {
        streak++
        const d = new Date(cursor + 'T00:00:00')
        d.setDate(d.getDate() - 1)
        const off = d.getTimezoneOffset()
        cursor = new Date(d.getTime() - off * 60000).toISOString().slice(0, 10)
      } else {
        break
      }
      if (streak > 365) break
    }
    return streak
  }, [isHabitDoneOn])

  return {
    habits, logs, checkins, settings, loading, error,
    updateSettings, reload: loadAll,
    addHabit, updateHabit, deleteHabit,
    toggleHabitDone, isHabitDoneOn, streakFor, logsByDate,
    addCheckin, deleteCheckin
  }
}