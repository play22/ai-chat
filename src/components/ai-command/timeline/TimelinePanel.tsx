import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { GanttChartSquare, ChevronsLeft, ChevronsRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Button, IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { domainIcon, domainColor, taskStatusLabel, priorityLabel } from '../shared';
import type { Task, Agent, TaskStatus } from '../../../state/types';

type ZoomLevel = 'hours-4' | 'hours-12' | 'day' | 'days-3';

const zoomConfig: Record<ZoomLevel, { spanMs: number; label: string; tickEveryMs: number; tickFormat: (d: Date) => string }> = {
  'hours-4': {
    spanMs: 4 * 3600 * 1000,
    label: '4 שעות',
    tickEveryMs: 30 * 60 * 1000,
    tickFormat: (d) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
  'hours-12': {
    spanMs: 12 * 3600 * 1000,
    label: '12 שעות',
    tickEveryMs: 60 * 60 * 1000,
    tickFormat: (d) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
  },
  day: {
    spanMs: 24 * 3600 * 1000,
    label: '24 שעות',
    tickEveryMs: 2 * 60 * 60 * 1000,
    tickFormat: (d) => d.toLocaleTimeString('he-IL', { hour: '2-digit' }) + ':00',
  },
  'days-3': {
    spanMs: 3 * 24 * 3600 * 1000,
    label: '3 ימים',
    tickEveryMs: 6 * 60 * 60 * 1000,
    tickFormat: (d) => d.toLocaleString('he-IL', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit' }),
  },
};

const statusBarColor: Record<TaskStatus, string> = {
  planned: 'bg-warn/70 border-warn',
  pending: 'bg-text-dim/40 border-text-dim',
  in_progress: 'bg-info/70 border-info',
  completed: 'bg-accent/60 border-accent',
  failed: 'bg-danger/60 border-danger',
};

export function TimelinePanel() {
  const { state, dispatch } = useAICommand();
  const openTask = (taskId: string) => dispatch({ type: 'OPEN_TASK_EDITOR', taskId });
  const [zoom, setZoom] = useState<ZoomLevel>('hours-12');
  const [offsetMs, setOffsetMs] = useState(0); // shift window
  const [hovered, setHovered] = useState<Task | null>(null);

  const cfg = zoomConfig[zoom];
  const now = Date.now();
  // window is centered: 25% past, 75% future for current; offset shifts whole window
  const windowStart = now - cfg.spanMs * 0.25 + offsetMs;
  const windowEnd = windowStart + cfg.spanMs;

  const ticks = useMemo(() => {
    const arr: { t: number; isMajor: boolean }[] = [];
    const tickStep = cfg.tickEveryMs;
    const startTick = Math.ceil(windowStart / tickStep) * tickStep;
    for (let t = startTick; t <= windowEnd; t += tickStep) {
      arr.push({ t, isMajor: true });
    }
    return arr;
  }, [windowStart, windowEnd, cfg.tickEveryMs]);

  const taskRange = (t: Task): { start: number; end: number } | null => {
    if (t.status === 'planned' && t.scheduledFor) {
      const s = new Date(t.scheduledFor).getTime();
      return { start: s, end: s + 30 * 60 * 1000 }; // 30 min default
    }
    if (t.status === 'completed' && t.startedAt && t.completedAt) {
      return { start: new Date(t.startedAt).getTime(), end: new Date(t.completedAt).getTime() };
    }
    if (t.status === 'in_progress') {
      const s = t.startedAt ? new Date(t.startedAt).getTime() : new Date(t.createdAt).getTime();
      const e = t.eta ? new Date(t.eta).getTime() : now + 30 * 60 * 1000;
      return { start: s, end: e };
    }
    if (t.status === 'pending') {
      const s = new Date(t.createdAt).getTime();
      const e = t.eta ? new Date(t.eta).getTime() : s + 30 * 60 * 1000;
      return { start: s, end: e };
    }
    if (t.status === 'failed' && t.startedAt) {
      const s = new Date(t.startedAt).getTime();
      return { start: s, end: s + 20 * 60 * 1000 };
    }
    return null;
  };

  const tasksWithRange = useMemo(
    () =>
      state.tasks
        .map((t) => ({ task: t, range: taskRange(t) }))
        .filter((x): x is { task: Task; range: { start: number; end: number } } => x.range !== null)
        .filter((x) => x.range.end >= windowStart && x.range.start <= windowEnd),
    [state.tasks, windowStart, windowEnd],
  );

  const posPercent = (t: number) => ((t - windowStart) / (windowEnd - windowStart)) * 100;

  const nowPercent = posPercent(now);

  const stats = useMemo(() => {
    const inWin = tasksWithRange;
    return {
      total: inWin.length,
      inProgress: inWin.filter((x) => x.task.status === 'in_progress').length,
      planned: inWin.filter((x) => x.task.status === 'planned').length,
      completed: inWin.filter((x) => x.task.status === 'completed').length,
    };
  }, [tasksWithRange]);

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <GanttChartSquare size={14} className="text-accent" />
          <span className="text-sm font-medium text-text">ציר זמן מבצעי</span>
          <span className="text-2xs text-text-faint font-mono">
            · {stats.total} משימות בחלון · {stats.inProgress} בביצוע · {stats.planned} מתוכננות
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-bg-sunken border border-panel-border rounded-[5px]">
            <IconButton size="xs" variant="ghost" onClick={() => setOffsetMs((o) => o - cfg.spanMs * 0.25)} title="הקדם">
              <ChevronsRight size={12} />
            </IconButton>
            <button
              onClick={() => setOffsetMs(0)}
              className="h-7 px-2.5 text-2xs text-text-dim hover:text-accent transition-colors border-x border-panel-border"
            >
              עכשיו
            </button>
            <IconButton size="xs" variant="ghost" onClick={() => setOffsetMs((o) => o + cfg.spanMs * 0.25)} title="אחר">
              <ChevronsLeft size={12} />
            </IconButton>
          </div>
          <div className="flex items-center bg-bg-sunken border border-panel-border rounded-[5px] p-0.5 gap-0.5">
            {(Object.keys(zoomConfig) as ZoomLevel[]).map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                className={clsx(
                  'h-6 px-2 text-2xs rounded-[3px] transition-colors',
                  zoom === z ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
                )}
              >
                {zoomConfig[z].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-[140px_1fr] min-h-full">
          {/* lane labels */}
          <div className="bg-bg-elevated border-e border-panel-border sticky start-0 z-10">
            <div className="h-10 border-b border-panel-border flex items-center px-3 text-2xs text-text-faint uppercase tracking-wider font-medium">
              סוכן
            </div>
            {state.agents.map((agent) => {
              const Icon = domainIcon[agent.domain];
              const primary = tasksWithRange.filter((x) => x.task.agentId === agent.id).length;
              const subParticipations = tasksWithRange.filter((x) => x.task.agentId !== agent.id && (x.task.subAgentIds ?? []).includes(agent.id)).length;
              return (
                <div
                  key={agent.id}
                  className="h-16 border-b border-panel-border/60 px-3 flex items-center gap-2"
                >
                  <Icon size={15} className={domainColor[agent.domain]} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-text truncate">{agent.name}</div>
                    <div className="text-2xs text-text-faint font-mono">
                      {primary} בחלון
                      {subParticipations > 0 && <span className="text-accent"> · +{subParticipations} תת</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* timeline */}
          <div className="relative bg-bg" style={{ minWidth: 800 }}>
            {/* tick header */}
            <div className="h-10 border-b border-panel-border bg-bg-elevated/40 relative">
              {ticks.map(({ t }) => (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                  style={{ insetInlineStart: `${posPercent(t)}%`, transform: 'translateX(50%)' }}
                >
                  <span className="text-[10px] text-text-faint font-mono whitespace-nowrap">
                    {cfg.tickFormat(new Date(t))}
                  </span>
                </div>
              ))}
            </div>

            {/* lanes background */}
            <div className="relative">
              {state.agents.map((agent, idx) => (
                <div
                  key={agent.id}
                  className={clsx(
                    'h-16 border-b border-panel-border/60 relative',
                    idx % 2 === 1 && 'bg-bg-elevated/30',
                  )}
                >
                  {/* vertical gridlines */}
                  {ticks.map(({ t }) => (
                    <div
                      key={t}
                      className="absolute top-0 bottom-0 w-px bg-panel-border/40"
                      style={{ insetInlineStart: `${posPercent(t)}%` }}
                    />
                  ))}
                  {/* now line */}
                  {nowPercent >= 0 && nowPercent <= 100 && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-accent z-10 pointer-events-none"
                      style={{ insetInlineStart: `${nowPercent}%`, boxShadow: '0 0 8px rgba(92,225,164,0.5)' }}
                    />
                  )}
                  {/* Primary tasks for this agent (coordinator or solo) */}
                  {tasksWithRange
                    .filter((x) => x.task.agentId === agent.id)
                    .map(({ task, range }) => {
                      const start = Math.max(range.start, windowStart);
                      const end = Math.min(range.end, windowEnd);
                      const left = posPercent(start);
                      const width = Math.max(0.6, posPercent(end) - left);
                      const isMulti = (task.subAgentIds?.length ?? 0) > 0;
                      return (
                        <button
                          key={task.id}
                          onMouseEnter={() => setHovered(task)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => openTask(task.id)}
                          title="לחץ לפרטים ועריכה"
                          className={clsx(
                            'absolute top-2.5 h-11 rounded-[4px] border-s-2 px-2 text-start overflow-hidden transition-all hover:z-20 hover:shadow-glow-accent hover:scale-[1.02] origin-center cursor-pointer',
                            statusBarColor[task.status],
                          )}
                          style={{ insetInlineStart: `${left}%`, width: `${width}%`, minWidth: 32 }}
                        >
                          <div className="text-2xs font-medium text-text leading-tight truncate flex items-center gap-1">
                            {isMulti && (
                              <span className="px-1 py-px text-[8px] rounded bg-bg-sunken/80 text-accent border border-accent/40 font-mono leading-none">
                                +{task.subAgentIds!.length}
                              </span>
                            )}
                            <span className="truncate">{task.title}</span>
                          </div>
                          <div className="text-[9px] text-text/70 font-mono mt-0.5 truncate">
                            {new Date(range.start).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                            {' - '}
                            {new Date(range.end).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          {task.status === 'in_progress' && typeof task.progress === 'number' && (
                            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-info/20">
                              <div className="h-full bg-accent" style={{ width: `${task.progress}%` }} />
                            </div>
                          )}
                        </button>
                      );
                    })}

                  {/* Sub-agent indicator bars (this agent participates in another's task) */}
                  {tasksWithRange
                    .filter((x) => x.task.agentId !== agent.id && (x.task.subAgentIds ?? []).includes(agent.id))
                    .map(({ task, range }) => {
                      const start = Math.max(range.start, windowStart);
                      const end = Math.min(range.end, windowEnd);
                      const left = posPercent(start);
                      const width = Math.max(0.6, posPercent(end) - left);
                      const coord = state.agents.find((a) => a.id === task.agentId);
                      return (
                        <div
                          key={`sub-${task.id}`}
                          onMouseEnter={() => setHovered(task)}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => openTask(task.id)}
                          title="לחץ לפרטים ועריכה"
                          className="absolute bottom-1 h-3 rounded-sm border-s-2 border-dashed opacity-50 hover:opacity-100 transition-opacity overflow-hidden flex items-center px-1 cursor-pointer"
                          style={{
                            insetInlineStart: `${left}%`,
                            width: `${width}%`,
                            minWidth: 24,
                            backgroundColor: 'rgb(var(--panel) / 0.5)',
                            borderInlineStartColor: coord ? `var(--map-bg)` : 'currentColor',
                          }}
                          title={`תת-משימה תחת ${coord?.name ?? ''} · ${task.title}`}
                        >
                          <span className="text-[8px] font-mono text-text-dim truncate">
                            ↳ {coord?.name.replace('סוכן ', '')} · {task.title}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ))}

              {/* now label at top */}
              {nowPercent >= 0 && nowPercent <= 100 && (
                <div
                  className="absolute -top-7 text-[10px] font-mono font-bold text-accent z-20 pointer-events-none px-1 bg-bg-elevated rounded"
                  style={{ insetInlineStart: `${nowPercent}%`, transform: 'translateX(50%)' }}
                >
                  ● עכשיו
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* legend */}
      <div className="border-t border-panel-border bg-bg-elevated px-4 py-2 flex items-center gap-4 text-2xs text-text-dim flex-shrink-0">
        <span className="font-medium text-text-faint uppercase tracking-wider">מקרא:</span>
        {([
          ['in_progress', 'bg-info/70 border-info', 'בביצוע'],
          ['planned', 'bg-warn/70 border-warn', 'מתוכננת'],
          ['pending', 'bg-text-dim/40 border-text-dim', 'ממתינה'],
          ['completed', 'bg-accent/60 border-accent', 'הושלמה'],
          ['failed', 'bg-danger/60 border-danger', 'נכשלה'],
        ] as const).map(([k, cls, label]) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={clsx('w-3 h-2.5 rounded-sm border-s-2', cls)} />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-sm border-s-2 border-dashed border-text-dim bg-panel/50" />
          תת-משימה
        </span>
        <div className="flex-1" />
        {hovered && (
          <span className="inline-flex items-center gap-2">
            <Badge tone="info">{taskStatusLabel[hovered.status]}</Badge>
            <span className="text-text">{hovered.title}</span>
            <span className="font-mono text-text-faint">· {priorityLabel[hovered.priority]}</span>
          </span>
        )}
      </div>
    </div>
  );
}
