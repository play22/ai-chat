import { useEffect, useState } from 'react';
import { Activity, ShieldCheck, Wifi, Cpu, Clock } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';

export function StatusBar() {
  const { state } = useAICommand();
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const activeTasks = state.tasks.filter((t) => t.status === 'in_progress').length;
  const criticalTasks = state.tasks.filter((t) => t.priority === 'critical' && t.status !== 'completed').length;

  return (
    <div className="h-6 bg-bg-elevated border-t border-panel-border px-3 flex items-center gap-4 text-2xs font-mono text-text-dim flex-shrink-0 overflow-x-auto whitespace-nowrap">
      <span className="inline-flex items-center gap-1 text-accent">
        <Wifi size={10} /> LINK OK
      </span>
      <span className="inline-flex items-center gap-1">
        <ShieldCheck size={10} className="text-accent" /> SECURE
      </span>
      <span className="inline-flex items-center gap-1">
        <Cpu size={10} /> CPU 38%
      </span>
      <span className="inline-flex items-center gap-1">
        <Activity size={10} /> {activeTasks} משימות בביצוע
      </span>
      {criticalTasks > 0 && (
        <span className="inline-flex items-center gap-1 text-critical">
          ⚠ {criticalTasks} קריטיות
        </span>
      )}
      <div className="flex-1" />
      <span>{state.entities.length} ישויות במפה</span>
      <span>{state.rules.filter((r) => r.enabled).length} חוקים פעילים</span>
      <span className="inline-flex items-center gap-1">
        <Clock size={10} />
        {now.toLocaleTimeString('he-IL')}
      </span>
    </div>
  );
}
