import { Zap, ArrowLeft, Pencil, Trash2, Activity, MessageSquareText } from 'lucide-react';
import type { AutomationRule } from '../../../state/types';
import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Toggle } from '../ui/Toggle';
import { Button } from '../ui/Button';
import { domainIcon, domainColor, priorityLabel, priorityTone, formatRelative } from '../shared';
import { useAICommand } from '../../../state/AICommandContext';

const recurrenceLabel: Record<string, string> = {
  once: 'חד-פעמי',
  hourly: 'כל שעה',
  daily: 'יומי',
  weekly: 'שבועי',
};

const triggerLabel = (t: AutomationRule['trigger']): string => {
  if (t.type === 'detection') return `איתור ${t.entityType ?? ''} ${t.areaLabel ? `ב${t.areaLabel}` : ''}`.trim();
  if (t.type === 'threshold' && t.threshold) return `${t.threshold.metric} ${t.threshold.op} ${t.threshold.value}`;
  if (t.type === 'schedule' && t.schedule) {
    const s = t.schedule;
    if (s.recurrence === 'once') return `חד-פעמי · ${new Date(s.startAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}`;
    if (s.recurrence === 'hourly') return `כל ${s.intervalHours ?? 1} שעות`;
    if (s.recurrence === 'daily') return `יומי · ${s.time ?? '09:00'}`;
    if (s.recurrence === 'weekly') return `שבועי · ${['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][s.weekday ?? 0]} ${s.time ?? '09:00'}`;
    return recurrenceLabel[s.recurrence] ?? 'תזמון';
  }
  return 'טריגר לא ידוע';
};

const actionLabel = (a: AutomationRule['action']): string => {
  const verb = a.type === 'create_task' ? 'צור משימה' : a.type === 'notify' ? 'שלח התרעה' : 'הקצה יחידה';
  return `${verb} · ${a.message}`;
};

export function RuleCard({ rule }: { rule: AutomationRule }) {
  const { state, dispatch, toast } = useAICommand();
  const agent = state.agents.find((a) => a.id === rule.action.targetAgentId);
  const Icon = agent ? domainIcon[agent.domain] : Zap;
  return (
    <Card className="overflow-hidden">
      <CardBody className="!p-0">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-panel-border">
          <Toggle
            checked={rule.enabled}
            onChange={() => {
              dispatch({ type: 'TOGGLE_RULE', ruleId: rule.id });
              toast(`חוק ${rule.enabled ? 'הושבת' : 'הופעל'}: ${rule.name}`, rule.enabled ? 'info' : 'success');
            }}
          />
          <h3 className="text-sm font-semibold text-text flex-1 min-w-0 truncate">{rule.name}</h3>
          {rule.nlDescription && (
            <Badge tone="info" className="!gap-1">
              <MessageSquareText size={9} /> שפה חופשית
            </Badge>
          )}
          {rule.enabled ? (
            <Badge tone="success" dot pulse>
              פעיל
            </Badge>
          ) : (
            <Badge tone="neutral">מושבת</Badge>
          )}
        </div>
        {rule.nlDescription && (
          <div className="px-4 py-2 bg-info/5 border-b border-panel-border text-xs text-text-dim leading-relaxed italic">
            "{rule.nlDescription}"
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3.5 bg-bg-elevated/30">
          <div>
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">WHEN · טריגר</div>
            <div className="text-sm text-text">{triggerLabel(rule.trigger)}</div>
          </div>
          <ArrowLeft size={16} className="text-accent" />
          <div>
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">THEN · פעולה</div>
            <div className="text-sm text-text flex items-center gap-2">
              {agent && (
                <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-panel border border-panel-border rounded text-2xs">
                  <Icon size={11} className={domainColor[agent.domain]} />
                  {agent.name}
                </span>
              )}
              <span className="truncate">{actionLabel(rule.action)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone={priorityTone[rule.action.priority]}>{priorityLabel[rule.action.priority]}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-panel-border">
          <div className="flex items-center gap-3 text-2xs text-text-faint">
            <span className="inline-flex items-center gap-1">
              <Activity size={10} /> הופעל {rule.firedCount} פעמים
            </span>
            {rule.lastFired && <span className="font-mono">אחרון: {formatRelative(rule.lastFired)}</span>}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="xs"
              icon={<Pencil size={11} />}
              onClick={() => dispatch({ type: 'OPEN_RULE_EDITOR', ruleId: rule.id })}
            >
              ערוך
            </Button>
            <Button
              variant="ghost"
              size="xs"
              icon={<Trash2 size={11} />}
              onClick={() => {
                dispatch({ type: 'DELETE_RULE', ruleId: rule.id });
                toast(`חוק נמחק: ${rule.name}`, 'info');
              }}
              className="text-danger hover:!bg-danger/10"
            >
              מחק
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
