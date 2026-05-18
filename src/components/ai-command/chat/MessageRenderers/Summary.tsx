import clsx from 'clsx';
import { useState } from 'react';
import {
  FileText, TrendingUp, TrendingDown, Minus, Activity, AlertTriangle,
  CheckCircle2, AlertOctagon, Info, Sparkles, Download, Eye, Clock,
  ListChecks,
} from 'lucide-react';
import type { SummaryBlock, SummaryEvent, SummaryEventSeverity } from '../../../../state/types';
import { Card, CardBody } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { useAICommand } from '../../../../state/AICommandContext';
import { domainIcon, domainColor, domainHex, formatTime } from '../../shared';

const severityIcon: Record<SummaryEventSeverity, React.ReactNode> = {
  success: <CheckCircle2 size={12} className="text-accent" />,
  info: <Info size={12} className="text-info" />,
  warn: <AlertTriangle size={12} className="text-warn" />,
  critical: <AlertOctagon size={12} className="text-danger" />,
};

const severityBorder: Record<SummaryEventSeverity, string> = {
  success: 'border-accent/40 bg-accent/5',
  info: 'border-info/40 bg-info/5',
  warn: 'border-warn/40 bg-warn/5',
  critical: 'border-danger/50 bg-danger/5',
};

export function SummaryRenderer({ block }: { block: SummaryBlock }) {
  const { state, toast } = useAICommand();
  const [expanded, setExpanded] = useState<'events' | 'agents' | 'all'>('all');

  const peakAgent = block.agentActivity
    .slice()
    .sort((a, b) => b.tasksCompleted + b.tasksInProgress - (a.tasksCompleted + a.tasksInProgress))[0];

  return (
    <Card className="overflow-hidden border-accent/40">
      <CardBody className="!p-0">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-panel-border bg-accent/5">
          <div className="w-8 h-8 rounded-[6px] flex items-center justify-center bg-bg-elevated border border-accent/40">
            <FileText size={16} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text">{block.title}</h3>
              <Badge tone="accent" dot pulse>
                LIVE
              </Badge>
            </div>
            <div className="text-2xs text-text-faint font-mono mt-0.5 inline-flex items-center gap-1.5">
              <Clock size={10} />
              {block.periodLabel}
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            icon={<Download size={11} />}
            onClick={() => toast('דו"ח יוצא ל-PDF (הדגמה)', 'info')}
          >
            ייצא
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-px bg-panel-border/60">
          {block.metrics.map((m) => (
            <MetricCell key={m.key} metric={m} />
          ))}
        </div>

        {/* Highlights */}
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-accent" />
            <span className="text-2xs uppercase tracking-wider text-text-faint font-medium">תובנות עיקריות</span>
          </div>
          <ul className="flex flex-col gap-1.5">
            {block.highlights.map((h, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-text leading-relaxed"
                dangerouslySetInnerHTML={{ __html: '<span class="text-accent mt-0.5">▸</span> ' + h.replace(/\*\*(.+?)\*\*/g, '<strong class="text-warn">$1</strong>') }}
              />
            ))}
          </ul>
        </div>

        {/* Timeline */}
        {(expanded === 'events' || expanded === 'all') && block.events.length > 0 && (
          <div className="px-4 py-3 border-t border-panel-border">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <Activity size={12} className="text-accent" />
                <span className="text-2xs uppercase tracking-wider text-text-faint font-medium">
                  ציר אירועים
                </span>
                <span className="text-2xs text-text-faint font-mono">· {block.events.length}</span>
              </div>
            </div>
            <ol className="flex flex-col gap-1.5">
              {block.events.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </ol>
          </div>
        )}

        {/* Agent activity */}
        {(expanded === 'agents' || expanded === 'all') && (
          <div className="px-4 py-3 border-t border-panel-border">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <ListChecks size={12} className="text-accent" />
                <span className="text-2xs uppercase tracking-wider text-text-faint font-medium">
                  פעילות לפי סוכן
                </span>
              </div>
              {peakAgent && (
                <span className="text-2xs text-text-dim">
                  שיא:{' '}
                  <span className="text-accent font-medium">
                    {state.agents.find((a) => a.id === peakAgent.agentId)?.name}
                  </span>
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {block.agentActivity
                .filter((a) => a.tasksCompleted + a.tasksInProgress + a.tasksFailed > 0)
                .map((act) => (
                  <AgentActivityRow key={act.agentId} activity={act} />
                ))}
              {block.agentActivity.every(
                (a) => a.tasksCompleted + a.tasksInProgress + a.tasksFailed === 0,
              ) && (
                <div className="text-2xs text-text-faint text-center py-2">אין פעילות בתקופה</div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {block.recommendations && block.recommendations.length > 0 && (
          <div className="px-4 py-3 border-t border-panel-border bg-bg-elevated/40">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={12} className="text-warn" />
              <span className="text-2xs uppercase tracking-wider text-warn font-medium">המלצות פעולה</span>
            </div>
            <ul className="flex flex-col gap-1.5">
              {block.recommendations.map((r, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-text leading-relaxed pl-2 border-r-2 border-warn/40 pr-2"
                >
                  <span className="text-warn font-bold mt-0.5">{i + 1}.</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-t border-panel-border bg-bg-elevated/30">
          <div className="flex items-center gap-1">
            <TabBtn active={expanded === 'all'} onClick={() => setExpanded('all')}>
              הכל
            </TabBtn>
            <TabBtn active={expanded === 'events'} onClick={() => setExpanded('events')}>
              אירועים
            </TabBtn>
            <TabBtn active={expanded === 'agents'} onClick={() => setExpanded('agents')}>
              סוכנים
            </TabBtn>
          </div>
          <div className="text-2xs text-text-faint inline-flex items-center gap-1">
            <Eye size={10} />
            נוצר {formatTime(block.rangeEnd)}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'h-6 px-2 text-2xs rounded-[3px] transition-colors',
        active ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
      )}
    >
      {children}
    </button>
  );
}

function MetricCell({ metric }: { metric: SummaryBlock['metrics'][number] }) {
  const valueColor =
    metric.tone === 'success'
      ? 'text-accent'
      : metric.tone === 'warn'
        ? 'text-warn'
        : metric.tone === 'danger'
          ? 'text-danger'
          : metric.tone === 'info'
            ? 'text-info'
            : 'text-text';
  const DeltaIcon =
    metric.delta?.direction === 'up'
      ? TrendingUp
      : metric.delta?.direction === 'down'
        ? TrendingDown
        : Minus;
  const deltaColor =
    metric.delta?.direction === 'up'
      ? 'text-accent'
      : metric.delta?.direction === 'down'
        ? 'text-danger'
        : 'text-text-dim';
  return (
    <div className="bg-bg-elevated p-3">
      <div className="text-2xs text-text-faint uppercase tracking-wider mb-1.5">{metric.label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className={clsx('text-2xl font-mono font-bold leading-none', valueColor)}>{metric.value}</span>
        {metric.unit && <span className="text-2xs text-text-faint">{metric.unit}</span>}
      </div>
      {metric.delta && (
        <div className={clsx('inline-flex items-center gap-0.5 text-2xs mt-1', deltaColor)}>
          <DeltaIcon size={9} />
          {metric.delta.pct != null && <span>{metric.delta.pct}%</span>}
          <span className="text-text-faint">· {metric.delta.vsLabel}</span>
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: SummaryEvent }) {
  const { state } = useAICommand();
  const agent = event.agentId ? state.agents.find((a) => a.id === event.agentId) : null;
  const Icon = agent ? domainIcon[agent.domain] : null;
  return (
    <li
      className={clsx(
        'flex items-start gap-2.5 p-2 rounded-[4px] border',
        severityBorder[event.severity],
      )}
    >
      <span className="mt-0.5 flex-shrink-0">{severityIcon[event.severity]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xs font-mono text-text-faint">{formatTime(event.timestamp)}</span>
          <span className="text-xs text-text font-medium">{event.title}</span>
        </div>
        {event.description && (
          <div className="text-2xs text-text-dim mt-0.5">{event.description}</div>
        )}
      </div>
      {agent && Icon && (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-panel border border-panel-border text-[10px] flex-shrink-0">
          <Icon size={9} className={domainColor[agent.domain]} />
          {agent.name.replace('סוכן ', '')}
        </span>
      )}
    </li>
  );
}

function AgentActivityRow({ activity }: { activity: SummaryBlock['agentActivity'][number] }) {
  const { state } = useAICommand();
  const agent = state.agents.find((a) => a.id === activity.agentId);
  if (!agent) return null;
  const Icon = domainIcon[agent.domain];
  const total = activity.tasksCompleted + activity.tasksInProgress + activity.tasksFailed;
  return (
    <div className="flex items-center gap-2.5 p-2 bg-bg-elevated rounded-[4px] border border-panel-border">
      <Icon size={14} className={domainColor[agent.domain]} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-text truncate">{agent.name}</div>
        <div className="text-2xs text-text-faint font-mono">
          {activity.tasksCompleted} הושלמו · {activity.tasksInProgress} בביצוע
          {activity.tasksFailed > 0 && <span className="text-danger"> · {activity.tasksFailed} נכשלו</span>}
        </div>
      </div>
      {total > 0 && (
        <div className="w-16 h-1.5 bg-bg-sunken rounded-full overflow-hidden flex">
          <div
            className="bg-accent"
            style={{ width: `${(activity.tasksCompleted / total) * 100}%` }}
          />
          <div
            className="bg-info"
            style={{ width: `${(activity.tasksInProgress / total) * 100}%` }}
          />
          <div
            className="bg-danger"
            style={{ width: `${(activity.tasksFailed / total) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
