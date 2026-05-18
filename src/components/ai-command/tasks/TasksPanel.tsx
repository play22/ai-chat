import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ListTodo, Search, Filter, Clock, CalendarClock, Ban, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { domainIcon, domainColor, domainHex, priorityLabel, priorityTone, taskStatusLabel, taskStatusTone, formatRelative, formatTime } from '../shared';
import type { Task, TaskStatus } from '../../../state/types';

type StatusFilter = 'all' | TaskStatus;

const filters: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'in_progress', label: 'בביצוע' },
  { id: 'planned', label: 'מתוכננות' },
  { id: 'pending', label: 'ממתינות' },
  { id: 'completed', label: 'הושלמו' },
  { id: 'failed', label: 'נכשלו' },
];

const statusIcon: Record<TaskStatus, React.ReactNode> = {
  planned: <CalendarClock size={13} className="text-warn" />,
  pending: <Clock size={13} className="text-text-dim" />,
  in_progress: <Clock size={13} className="text-info animate-pulse-dot" />,
  completed: <CheckCircle2 size={13} className="text-accent" />,
  failed: <AlertCircle size={13} className="text-danger" />,
};

export function TasksPanel() {
  const { state, dispatch, toast } = useAICommand();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.tasks.length };
    for (const t of state.tasks) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [state.tasks]);

  const filtered = useMemo(() => {
    return state.tasks.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (agentFilter !== 'all' && t.agentId !== agentFilter) return false;
      if (q && !t.title.includes(q)) return false;
      return true;
    });
  }, [state.tasks, filter, agentFilter, q]);

  // Group by status when filter = all
  const grouped = useMemo(() => {
    if (filter !== 'all') return null;
    const order: TaskStatus[] = ['in_progress', 'planned', 'pending', 'completed', 'failed'];
    return order
      .map((s) => ({ status: s, tasks: filtered.filter((t) => t.status === s) }))
      .filter((g) => g.tasks.length > 0);
  }, [filter, filtered]);

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <ListTodo size={14} className="text-accent" />
          <span className="text-sm font-medium text-text">משימות</span>
          <span className="text-2xs text-text-faint font-mono">· {filtered.length} מתוך {state.tasks.length}</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש משימה..."
            className="bg-bg-sunken border border-panel-border text-text text-xs rounded-[5px] h-8 ps-3 pe-8 w-56 placeholder:text-text-faint focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* KPI strip - 5 cols on wide, 5 mini-cols still on narrow (numbers stay readable) */}
      <div className="grid grid-cols-5 gap-px bg-panel-border/60 border-b border-panel-border">
        {([
          { key: 'in_progress', label: 'בביצוע', tone: 'info' as const },
          { key: 'planned', label: 'מתוכננות', tone: 'warn' as const },
          { key: 'pending', label: 'ממתינות', tone: 'neutral' as const },
          { key: 'completed', label: 'הושלמו', tone: 'success' as const },
          { key: 'failed', label: 'נכשלו', tone: 'danger' as const },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => setFilter(s.key as StatusFilter)}
            className={clsx(
              'bg-bg-elevated p-3 text-start transition-colors hover:bg-panel-hover',
              filter === s.key && 'bg-panel-hover',
            )}
          >
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">{s.label}</div>
            <div className="flex items-end gap-1.5">
              <span className={clsx(
                'text-2xl font-mono font-bold leading-none',
                s.tone === 'info' && 'text-info',
                s.tone === 'warn' && 'text-warn',
                s.tone === 'neutral' && 'text-text',
                s.tone === 'success' && 'text-accent',
                s.tone === 'danger' && 'text-danger',
              )}>
                {counts[s.key] ?? 0}
              </span>
              <span className="text-2xs text-text-faint mb-0.5">משימות</span>
            </div>
          </button>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-panel-border overflow-x-auto">
        <Filter size={11} className="text-text-faint flex-shrink-0" />
        <div className="flex items-center gap-1 flex-shrink-0">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'h-7 px-2.5 text-2xs rounded-[4px] border transition-colors',
                filter === f.id
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-transparent text-text-dim border-panel-border hover:text-text hover:bg-panel-hover',
              )}
            >
              {f.label}
              {counts[f.id] !== undefined && <span className="ms-1.5 font-mono opacity-70">{counts[f.id]}</span>}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-panel-border mx-1" />
        <select
          value={agentFilter}
          onChange={(e) => setAgentFilter(e.target.value)}
          className="bg-panel border border-panel-border text-text text-2xs rounded-[4px] h-7 ps-2 pe-6 focus:outline-none focus:border-accent/40"
        >
          <option value="all">כל הסוכנים</option>
          {state.agents.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {grouped ? (
            grouped.map((g) => (
              <div key={g.status} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-text-faint">
                  {statusIcon[g.status]}
                  <span className="font-medium text-text-dim">{taskStatusLabel[g.status]}</span>
                  <span className="font-mono">({g.tasks.length})</span>
                  <div className="flex-1 h-px bg-panel-border" />
                </div>
                <div className="flex flex-col gap-1.5">
                  {g.tasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onCancel={() => {
                        dispatch({ type: 'CANCEL_TASK', taskId: t.id });
                        toast(`בוטלה משימה: ${t.title}`, 'warn');
                      }}
                      agents={state.agents}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col gap-1.5">
              {filtered.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onCancel={() => {
                    dispatch({ type: 'CANCEL_TASK', taskId: t.id });
                    toast(`בוטלה משימה: ${t.title}`, 'warn');
                  }}
                  agents={state.agents}
                />
              ))}
              {filtered.length === 0 && (
                <div className="text-xs text-text-faint text-center py-12">אין משימות התואמות לסינון</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskRow({ task, agents, onCancel }: { task: Task; agents: any[]; onCancel: () => void }) {
  const { dispatch, toast } = useAICommand();
  const agent = agents.find((a) => a.id === task.agentId);
  const Icon = agent ? domainIcon[agent.domain as keyof typeof domainIcon] : Clock;
  const showOnMap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!task.geo || !agent) return;
    dispatch({ type: 'SET_MAP_VISIBLE', visible: true });
    dispatch({ type: 'HIGHLIGHT_AGENT', agentId: agent.id });
    toast(`מציג את "${task.geo.label}" במפה`, 'info');
  };
  return (
    <Card
      className="hover:border-accent/40 hover:shadow-glow-accent transition-all cursor-pointer"
      onClick={() => dispatch({ type: 'OPEN_TASK_EDITOR', taskId: task.id })}
      title="לחץ לפרטים ועריכה"
    >
      <CardBody className="!p-0">
        <div className="flex items-stretch">
          <div className="w-1 flex-shrink-0" style={{ backgroundColor: task.status === 'failed' ? '#ef4444' : task.status === 'completed' ? '#5ce1a4' : task.status === 'in_progress' ? '#60a5fa' : task.status === 'planned' ? '#f5a524' : '#1f2a24' }} />
          <div className="flex-1 p-3 flex items-center gap-3">
            <Icon size={16} className={agent ? domainColor[agent.domain as keyof typeof domainColor] : 'text-text-dim'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-text truncate">{task.title}</h4>
                <Badge tone={priorityTone[task.priority]} dot>
                  {priorityLabel[task.priority]}
                </Badge>
                <Badge tone={taskStatusTone[task.status]}>{taskStatusLabel[task.status]}</Badge>
              </div>
              <div className="flex items-center gap-3 text-2xs text-text-faint font-mono flex-wrap">
                {agent && (
                  <span className="inline-flex items-center gap-1">
                    {task.subAgentIds && task.subAgentIds.length > 0 && (
                      <span className="px-1 py-px text-[9px] rounded bg-accent/15 text-accent border border-accent/30 normal-case">
                        מתאם
                      </span>
                    )}
                    {agent.name}
                  </span>
                )}
                {task.subAgentIds && task.subAgentIds.length > 0 && (
                  <SubAgentChips ids={task.subAgentIds} />
                )}
                {task.geo && (
                  <button
                    onClick={showOnMap}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel border border-panel-border hover:border-accent/40 hover:text-accent transition-colors"
                    title="הצג במפה"
                  >
                    <MapPin size={10} style={{ color: agent ? domainHex[agent.domain as keyof typeof domainHex] : undefined }} />
                    <span className="text-text">{task.geo.label}</span>
                  </button>
                )}
                {task.scheduledFor && (
                  <span className="inline-flex items-center gap-1 text-warn">
                    <CalendarClock size={10} /> מתוזמן ל-{formatTime(task.scheduledFor)} ({formatRelative(task.scheduledFor)})
                  </span>
                )}
                {task.startedAt && task.status === 'in_progress' && (
                  <span>החל {formatRelative(task.startedAt)}</span>
                )}
                {task.completedAt && (
                  <span>הושלם {formatRelative(task.completedAt)}</span>
                )}
                {task.eta && task.status === 'in_progress' && (
                  <span className="text-info">ETA {formatRelative(task.eta)}</span>
                )}
              </div>
              {typeof task.progress === 'number' && (task.status === 'in_progress' || task.status === 'failed') && (
                <div className="h-1 bg-bg-sunken rounded-full overflow-hidden mt-2 max-w-md">
                  <div
                    className={task.status === 'failed' ? 'h-full bg-danger' : 'h-full bg-info'}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>
            {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'planned') && (
              <Button variant="ghost" size="xs" icon={<Ban size={11} />} onClick={(e) => { e.stopPropagation(); onCancel(); }}>
                בטל
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SubAgentChips({ ids }: { ids: string[] }) {
  const { state } = useAICommand();
  return (
    <span className="inline-flex items-center gap-1">
      {ids.map((id) => {
        const a = state.agents.find((ag) => ag.id === id);
        if (!a) return null;
        const Icon = domainIcon[a.domain as keyof typeof domainIcon];
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel border border-panel-border text-[10px]"
            title={a.name}
          >
            <Icon size={9} className={domainColor[a.domain as keyof typeof domainColor]} />
            {a.name.replace('סוכן ', '')}
          </span>
        );
      })}
    </span>
  );
}
