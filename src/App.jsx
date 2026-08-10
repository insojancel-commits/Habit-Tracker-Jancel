import React, { useMemo, useState } from 'react';
import { useDaybookData } from './hooks/useDaybookData.js';
import { todayLocal, greetingForHour } from './lib/dateHelpers.js';
import Toast from './components/Toast.jsx';
import CheckInTab from './components/CheckInTab.jsx';
import RoutineTab from './components/RoutineTab.jsx';
import InsightsTab from './components/InsightsTab.jsx';

export default function App() {
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState('checkin');

  const onError = (message) => setToast({ message, tone: 'error' });
  const data = useDaybookData(null, onError);

  const now = new Date();
  const today = todayLocal();

  const doneTodaySet = useMemo(
    () => new Set(data.habitLogs.filter((l) => l.date === today && l.done).map((l) => l.habit_id)),
    [data.habitLogs, today]
  );
  const essentialRemaining = useMemo(() => {
    const essentials = data.habits.filter((h) => h.is_essential && !h.archived);
    return essentials.length - essentials.filter((h) => doneTodaySet.has(h.id)).length;
  }, [data.habits, doneTodaySet]);

  function handleDeletedWithUndo(row) {
    if (!row) return;
    setToast({
      message: 'Entry deleted.',
      actionLabel: 'Undo',
      onAction: () => data.restoreCheckin(row),
    });
  }

  if (data.loading) return <div className="db-root"><div className="db-loading-screen">Loading…</div></div>;

  return (
    <div className="db-root">
      <div className="db-shell">
        <div className="db-header">
          <div className="db-title-row">
            <div className="db-title">Daybook</div>
          </div>
          <div className="db-subtitle">{greetingForHour(now.getHours())} · {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="db-tabbar">
          <button className={`db-tab${tab === 'checkin' ? ' db-tab-active' : ''}`} onClick={() => setTab('checkin')}>Check-In</button>
          <button className={`db-tab${tab === 'routine' ? ' db-tab-active' : ''}`} onClick={() => setTab('routine')}>
            Routine{essentialRemaining > 0 && <span className="db-tab-badge">{essentialRemaining}</span>}
          </button>
          <button className={`db-tab${tab === 'insights' ? ' db-tab-active' : ''}`} onClick={() => setTab('insights')}>Insights</button>
        </div>

        <div className="db-tab-panel" key={tab}>
          {tab === 'checkin' && (
            <CheckInTab
              checkins={data.checkins} habits={data.habits} habitLogs={data.habitLogs}
              addCheckin={data.addCheckin} deleteCheckin={data.deleteCheckin} cycleTag={data.cycleTag}
              toggleHabitDone={data.toggleHabitDone} ping={data.ping} setPing={data.setPing}
              onDeletedWithUndo={handleDeletedWithUndo}
            />
          )}
          {tab === 'routine' && (
            <RoutineTab
              habits={data.habits} habitLogs={data.habitLogs} checkins={data.checkins}
              toggleHabitDone={data.toggleHabitDone} saveHabit={data.saveHabit} archiveHabit={data.archiveHabit}
              restoreHabit={data.restoreHabit} deleteHabitForever={data.deleteHabitForever}
              moveHabit={data.moveHabit} saveNote={data.saveNote}
            />
          )}
          {tab === 'insights' && (
            <InsightsTab
              habits={data.habits} habitLogs={data.habitLogs} checkins={data.checkins}
              backupState={{ habits: data.habits, habitLogs: data.habitLogs, checkins: data.checkins, ping: data.ping }}
              onRestore={data.replaceAll}
              onToast={setToast}
            />
          )}
        </div>
      </div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
