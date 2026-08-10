import { addDaysLocal, dayIndexLocal } from './dateHelpers.js';

/* Single source of truth for streak math — imported by Routine and Insights.
   Do not reimplement this logic anywhere else; drift between two
   implementations of "what counts as a streak" is a real bug class. */

export function calcStreak(habitId, habitLogs, todayStr) {
  const doneDates = new Set(habitLogs.filter((l) => l.habit_id === habitId && l.done).map((l) => l.date));
  if (doneDates.size === 0) return 0;
  let cursor = todayStr;
  if (!doneDates.has(cursor)) cursor = addDaysLocal(cursor, -1);
  let streak = 0;
  while (doneDates.has(cursor)) {
    streak += 1;
    cursor = addDaysLocal(cursor, -1);
  }
  return streak;
}

export function calcLongestStreak(habitId, habitLogs) {
  const dates = [...new Set(habitLogs.filter((l) => l.habit_id === habitId && l.done).map((l) => l.date))].sort();
  if (dates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    current = dayIndexLocal(dates[i]) - dayIndexLocal(dates[i - 1]) === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}
