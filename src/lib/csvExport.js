function toCsvValue(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows, columns) {
  const header = columns.join(',');
  const body = rows.map((r) => columns.map((c) => toCsvValue(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportHabitsCsv(habits) {
  download(
    'daybook-habits.csv',
    toCsv(habits, ['id', 'name', 'time_block', 'scheduled_time', 'category', 'is_bad_habit', 'is_essential', 'archived', 'sort_order'])
  );
}
export function exportHabitLogsCsv(habitLogs) {
  download('daybook-habit-logs.csv', toCsv(habitLogs, ['id', 'habit_id', 'date', 'done', 'note']));
}
export function exportCheckinsCsv(checkins) {
  download('daybook-checkins.csv', toCsv(checkins, ['id', 'logged_at', 'activity', 'tag', 'energy']));
}
