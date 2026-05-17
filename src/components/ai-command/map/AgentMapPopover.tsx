import { X, Activity, ListTodo, Clock, CalendarClock, ArrowLeftCircle, MapPin, Target, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { Button, IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  domainIcon,
  domainColor,
  domainHex,
  autonomyLabel,
  autonomyTone,
  statusLabel,
  statusTone,
  priorityTone,
  priorityLabel,
  taskStatusLabel,
  taskStatusTone,
  formatRelative,
  formatTime,
} from '../shared';

interface Props {
  agentId: string;
  // Position in % of map container (0-100)
  x: number;
  y: number;
  /** Optional - if set, only tasks in this specific zone label are shown */
  zoneLabel?: string;
  onClose: () => void;
}

export function AgentMapPopover({ agentId, x, y, zoneLabel, onClose }: Props) {
  const { state, dispatch } = useAICommand();
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return null;

  const Icon = domainIcon[agent.domain];

  const allAgentTasks = state.tasks.filter(
    (t) => t.agentId === agent.id || (t.subAgentIds ?? []).includes(agent.id),
  );
  const zoneTasks = zoneLabel
    ? allAgentTasks.filter((t) => t.geo?.label === zoneLabel)
    : allAgentTasks.filter((t) => t.geo);

  const coordCount = zoneTasks.filter((t) => t.agentId === agent.id && (t.subAgentIds?.length ?? 0) > 0).length;
  const subCount = zoneTasks.filter((t) => t.agentId !== agent.id).length;

  const inProgress = zoneTasks.filter((t) => t.status === 'in_progress').length;
  const planned = zoneTasks.filter((t) => t.status === 'planned').length;
  const pending = zoneTasks.filter((t) => t.status === 'pending').length;
  const completed = zoneTasks.filter((t) => t.status === 'completed').length;

  // Decide popover placement: keep on-screen by translating away from edges
  const placeStart = x < 50; // if click on right half (RTL: start is right), open to the start side
  const placeTop = y > 55;
  const translateX = placeStart ? '0%' : '-100%';
  const translateY = placeTop ? '-100%' : '0%';

  const openFullView = () => {
    dispatch({ type: 'HIGHLIGHT_AGENT', agentId: agent.id });
    dispatch({ type: 'SELECT_AGENT', agentId: agent.id });
    onClose();
  };

  const gotoAgentsTab = () => {
    dispatch({ type: 'SET_TAB', tab: 'agents' });
    dispatch({ type: 'HIGHLIGHT_AGENT', agentId: agent.id });
    onClose();
  };

  return (
    <div
      className="absolute z-30 w-[320px] animate-fade-in pointer-events-auto"
      style={{
        insetInlineStart: `${x}%`,
        top: `${y}%`,
        transform: `translate(${translateX}, ${translateY})`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="bg-bg-elevated border rounded-[6px] shadow-2xl overflow-hidden"
        style={{ borderColor: domainHex[agent.domain] + '66' }}
      >
        {/* Pointer arrow */}
        <div
          className="absolute w-2.5 h-2.5 bg-bg-elevated border rotate-45"
          style={{
            borderColor: domainHex[agent.domain] + '66',
            insetInlineStart: placeStart ? '12px' : 'auto',
            insetInlineEnd: placeStart ? 'auto' : '12px',
            top: placeTop ? 'auto' : '-6px',
            bottom: placeTop ? '-6px' : 'auto',
            borderBottomColor: placeTop ? domainHex[agent.domain] + '66' : 'transparent',
            borderEndColor: placeTop ? domainHex[agent.domain] + '66' : 'transparent',
            borderTopColor: placeTop ? 'transparent' : domainHex[agent.domain] + '66',
            borderStartColor: placeTop ? 'transparent' : domainHex[agent.domain] + '66',
          }}
        />

        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-panel-border"
          style={{ backgroundColor: domainHex[agent.domain] + '14' }}
        >
          <div
            className="w-9 h-9 rounded-[6px] flex items-center justify-center bg-bg-sunken border"
            style={{ borderColor: domainHex[agent.domain] + '55' }}
          >
            <Icon size={18} className={domainColor[agent.domain]} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-sm font-semibold text-text truncate">{agent.name}</span>
              <Badge tone={statusTone[agent.status]} dot pulse={agent.status === 'active'}>
                {statusLabel[agent.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-2xs text-text-faint">
              <Badge tone={autonomyTone[agent.autonomy]}>{autonomyLabel[agent.autonomy]}</Badge>
              <span className="inline-flex items-center gap-1 font-mono">
                <Activity size={9} /> {formatRelative(agent.lastActivity)}
              </span>
            </div>
          </div>
          <IconButton size="xs" onClick={onClose} aria-label="סגור">
            <X size={13} />
          </IconButton>
        </div>

        {/* Zone label */}
        {zoneLabel && (
          <div className="px-3.5 py-2 border-b border-panel-border bg-bg-elevated/40 flex items-center gap-2 flex-wrap">
            <MapPin size={11} className="text-accent" />
            <span className="text-2xs text-text-faint uppercase tracking-wider">אזור:</span>
            <span className="text-xs font-medium text-text">{zoneLabel}</span>
            {coordCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                מתאם {coordCount} משימות רב-סוכניות
              </span>
            )}
            {subCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/15 text-info border border-info/30">
                תת-סוכן ב-{subCount} משימות
              </span>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-px bg-panel-border/60">
          <Kpi label="בביצוע" value={inProgress} tone="info" />
          <Kpi label="מתוכננות" value={planned} tone="warn" />
          <Kpi label="ממתינות" value={pending} tone="neutral" />
          <Kpi label="הושלמו" value={completed} tone="success" />
        </div>

        {/* Task list */}
        <div className="px-3.5 py-2.5 border-b border-panel-border">
          <div className="flex items-center gap-1.5 mb-2 text-2xs text-text-faint uppercase tracking-wider">
            <ListTodo size={10} />
            <span>משימות {zoneLabel ? 'באזור' : 'עם הקשר גיאוגרפי'}</span>
            <span className="font-mono">· {zoneTasks.length}</span>
          </div>
          {zoneTasks.length === 0 ? (
            <div className="text-2xs text-text-faint py-2 text-center">אין משימות פעילות</div>
          ) : (
            <ul className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
              {zoneTasks.slice(0, 6).map((t) => {
                const isFuture = t.status === 'planned' && t.scheduledFor;
                const isRunning = t.status === 'in_progress';
                return (
                  <li key={t.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-panel-hover transition-colors">
                    <span
                      className="w-1 h-7 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          t.status === 'in_progress'
                            ? 'rgb(var(--info))'
                            : t.status === 'planned'
                              ? 'rgb(var(--warn))'
                              : t.status === 'completed'
                                ? 'rgb(var(--accent))'
                                : t.status === 'failed'
                                  ? 'rgb(var(--danger))'
                                  : 'rgb(var(--text-faint))',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs text-text truncate font-medium">{t.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-text-faint font-mono flex-wrap">
                        <Badge tone={taskStatusTone[t.status]}>{taskStatusLabel[t.status]}</Badge>
                        <Badge tone={priorityTone[t.priority]} dot>
                          {priorityLabel[t.priority]}
                        </Badge>
                        {isFuture && (
                          <span className="inline-flex items-center gap-1 text-warn">
                            <CalendarClock size={9} /> {formatTime(t.scheduledFor!)} · {formatRelative(t.scheduledFor!)}
                          </span>
                        )}
                        {isRunning && t.eta && (
                          <span className="inline-flex items-center gap-1 text-info">
                            <Clock size={9} /> ETA {formatRelative(t.eta)}
                          </span>
                        )}
                      </div>
                      {isRunning && typeof t.progress === 'number' && (
                        <div className="h-0.5 bg-bg-sunken rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-info" style={{ width: `${t.progress}%` }} />
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
              {zoneTasks.length > 6 && (
                <li className="text-[10px] text-text-faint text-center pt-1">
                  + {zoneTasks.length - 6} נוספות (פתח תצוגה מורחבת לראות הכל)
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 p-2.5 bg-bg-elevated/60">
          <Button variant="primary" size="sm" icon={<ArrowLeftCircle size={13} />} onClick={openFullView} className="flex-1">
            פתח משימות
          </Button>
          <Button
            variant="subtle"
            size="sm"
            icon={<Settings size={13} />}
            onClick={() => {
              dispatch({ type: 'OPEN_AGENT_SETTINGS', agentId: agent.id });
              onClose();
            }}
            title="הגדרות סוכן"
            aria-label="הגדרות"
          />
          <Button variant="subtle" size="sm" icon={<Target size={13} />} onClick={gotoAgentsTab} title="כרטיס סוכן" aria-label="כרטיס" />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'info' | 'warn' | 'neutral' | 'success' }) {
  return (
    <div className="bg-bg-elevated p-2 text-center">
      <div className="text-[9px] text-text-faint uppercase tracking-wider mb-0.5">{label}</div>
      <div
        className={clsx(
          'text-lg font-mono font-bold leading-none',
          tone === 'info' && 'text-info',
          tone === 'warn' && 'text-warn',
          tone === 'success' && 'text-accent',
          tone === 'neutral' && 'text-text',
        )}
      >
        {value}
      </div>
    </div>
  );
}
