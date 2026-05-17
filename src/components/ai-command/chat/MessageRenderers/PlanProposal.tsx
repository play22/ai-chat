import { useState } from 'react';
import { Sparkles, CheckCircle2, X, Pencil, Clock, CalendarClock, ListChecks, Bot, ArrowDown, Save, MapPin, Users as UsersIcon } from 'lucide-react';
import { MockMap } from '../../map/MockMap';
import clsx from 'clsx';
import type { PlanProposalBlock, PlanStep, Task } from '../../../../state/types';
import { Card, CardBody } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { useAICommand } from '../../../../state/AICommandContext';
import { domainIcon, domainColor, domainHex, priorityLabel, priorityTone, formatTime, formatRelative } from '../../shared';

export function PlanProposalRenderer({ block }: { block: PlanProposalBlock }) {
  const { state, dispatch, toast } = useAICommand();
  const agent = state.agents.find((a) => a.id === block.agentId);
  const [steps, setSteps] = useState<PlanStep[]>(block.steps);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [scheduledFor, setScheduledFor] = useState<string | undefined>(block.scheduledFor);
  const [priority, setPriority] = useState(block.priority);
  const [agentId, setAgentId] = useState(block.agentId);
  const [subAgentIds, setSubAgentIds] = useState<string[]>(block.subAgentIds ?? []);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editMode, setEditMode] = useState(false);

  const toggleSubAgent = (id: string) =>
    setSubAgentIds((arr) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]));

  if (!agent) return null;

  const totalMinutes = steps.reduce((s, st) => s + st.estMinutes, 0);
  const selectedAgent = state.agents.find((a) => a.id === agentId) ?? agent;
  const SelectedIcon = domainIcon[selectedAgent.domain];

  const approve = () => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agentId: selectedAgent.id,
      subAgentIds: subAgentIds.length > 0 ? subAgentIds : undefined,
      title: block.title,
      description: steps.map((s, i) => `${i + 1}. ${s.title}`).join('\n'),
      status: scheduledFor ? 'planned' : 'pending',
      priority,
      createdAt: new Date().toISOString(),
      scheduledFor,
      eta: scheduledFor
        ? new Date(new Date(scheduledFor).getTime() + totalMinutes * 60 * 1000).toISOString()
        : new Date(Date.now() + totalMinutes * 60 * 1000).toISOString(),
      progress: 0,
      geo: block.geo,
    };
    dispatch({ type: 'ADD_TASK', task: newTask });
    setStatus('approved');
    toast(
      scheduledFor
        ? `המשימה אושרה ותופעל ב-${formatTime(scheduledFor)} (${selectedAgent.name})`
        : `המשימה אושרה ונשלחה ל${selectedAgent.name}`,
      'success',
    );
  };

  const showOnMap = () => {
    if (!block.geo) return;
    dispatch({ type: 'SET_MAP_VISIBLE', visible: true });
    dispatch({ type: 'HIGHLIGHT_AGENT', agentId: selectedAgent.id });
  };

  const reject = () => {
    setStatus('rejected');
    toast('הצעת התוכנית נדחתה', 'info');
  };

  const updateStep = (id: string, patch: Partial<PlanStep>) =>
    setSteps((arr) => arr.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const removeStep = (id: string) => setSteps((arr) => arr.filter((s) => s.id !== id));

  const addStep = () =>
    setSteps((arr) => [
      ...arr,
      { id: `step-${Date.now()}`, title: 'צעד חדש', estMinutes: 5 },
    ]);

  return (
    <Card className="overflow-hidden border-accent/30">
      <CardBody className="!p-0">
        {/* Header */}
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-panel-border bg-accent/5">
          <Sparkles size={13} className="text-accent" />
          <span className="text-2xs font-semibold text-accent uppercase tracking-wider flex-1">
            תוכנית פעולה מוצעת
          </span>
          {status === 'approved' && <Badge tone="success" dot>✓ אושרה ונשלחה</Badge>}
          {status === 'rejected' && <Badge tone="neutral">✕ נדחתה</Badge>}
          {status === 'pending' && <Badge tone="info" dot pulse>ממתינה לאישור</Badge>}
        </div>

        {/* Agent + title strip */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 border-b border-panel-border">
          <div className="w-11 h-11 rounded-[6px] flex items-center justify-center bg-bg-sunken border border-panel-border">
            <SelectedIcon size={20} className={domainColor[selectedAgent.domain]} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-2xs text-text-faint uppercase tracking-wider">סוכן נבחר</span>
              {editMode && status === 'pending' ? (
                <Select
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  options={state.agents.map((a) => ({ value: a.id, label: a.name }))}
                  className="!min-w-0"
                />
              ) : (
                <span className="text-sm font-semibold text-text">{selectedAgent.name}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-text leading-tight truncate">{block.title}</h3>
          </div>
          <Badge tone={priorityTone[priority]} dot pulse={priority === 'critical'}>
            {priorityLabel[priority]}
          </Badge>
        </div>

        {/* Sub-agents */}
        <div className="px-4 py-2.5 border-b border-panel-border">
          <div className="flex items-center gap-2 mb-1.5 text-2xs text-text-faint uppercase tracking-wider">
            <UsersIcon size={11} className="text-accent" />
            <span>תתי-סוכנים{subAgentIds.length > 0 ? '' : ' (אופציונלי)'}</span>
            {subAgentIds.length > 0 && (
              <span className="font-mono text-accent normal-case tracking-normal">
                {selectedAgent.name} מתאם · {subAgentIds.length} תתי-סוכנים
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {state.agents
              .filter((a) => a.id !== selectedAgent.id)
              .map((a) => {
                const SubIcon = domainIcon[a.domain];
                const selected = subAgentIds.includes(a.id);
                const disabled = status !== 'pending';
                return (
                  <button
                    key={a.id}
                    disabled={disabled}
                    onClick={() => toggleSubAgent(a.id)}
                    className={clsx(
                      'inline-flex items-center gap-1.5 px-2 py-1 text-2xs rounded-[4px] border transition-all',
                      selected
                        ? 'bg-accent/10 border-accent/50 text-text'
                        : 'bg-bg-sunken border-panel-border text-text-dim hover:border-accent/30 hover:text-text',
                      disabled && 'pointer-events-none opacity-60',
                    )}
                    style={selected ? { borderColor: domainHex[a.domain] + 'cc' } : undefined}
                  >
                    <SubIcon size={11} className={domainColor[a.domain]} />
                    {a.name.replace('סוכן ', '')}
                    {selected && <CheckCircle2 size={10} className="text-accent" />}
                  </button>
                );
              })}
          </div>
          {subAgentIds.length > 0 && (
            <div className="mt-2 text-2xs text-text-dim leading-relaxed">
              💡 {selectedAgent.name} יתאם בין הסוכנים שנבחרו ויאצול אליהם משימות-משנה לפי הצורך.
            </div>
          )}
        </div>

        {/* Reasoning */}
        <div className="px-4 py-2.5 border-b border-panel-border bg-bg-elevated/30">
          <div className="flex items-start gap-2">
            <Bot size={12} className="text-accent mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-dim leading-relaxed">
              <span className="text-2xs text-text-faint uppercase tracking-wider me-2">למה הסוכן הזה:</span>
              {block.reasoning}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-px bg-panel-border/60">
          <div className="bg-bg-elevated p-2.5">
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-0.5">משך כולל</div>
            <div className="text-sm font-mono font-semibold text-text flex items-center gap-1">
              <Clock size={11} className="text-text-dim" />
              {totalMinutes} דקות
            </div>
          </div>
          <div className="bg-bg-elevated p-2.5">
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-0.5">זמן הפעלה</div>
            {editMode && status === 'pending' ? (
              <input
                type="datetime-local"
                value={scheduledFor ? scheduledFor.slice(0, 16) : ''}
                onChange={(e) =>
                  setScheduledFor(e.target.value ? new Date(e.target.value).toISOString() : undefined)
                }
                className="bg-bg-sunken border border-panel-border rounded px-2 py-1 text-xs text-text w-full focus:outline-none focus:border-accent/50"
              />
            ) : (
              <div className="text-sm font-mono font-semibold text-text flex items-center gap-1">
                <CalendarClock size={11} className={scheduledFor ? 'text-warn' : 'text-text-dim'} />
                {scheduledFor ? `${formatTime(scheduledFor)} · ${formatRelative(scheduledFor)}` : 'מיידי'}
              </div>
            )}
          </div>
          <div className="bg-bg-elevated p-2.5">
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-0.5">עדיפות</div>
            {editMode && status === 'pending' ? (
              <Select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                options={[
                  { value: 'low', label: priorityLabel.low },
                  { value: 'medium', label: priorityLabel.medium },
                  { value: 'high', label: priorityLabel.high },
                  { value: 'critical', label: priorityLabel.critical },
                ]}
                className="!min-w-0 w-full"
              />
            ) : (
              <div className="text-sm font-semibold text-text">{priorityLabel[priority]}</div>
            )}
          </div>
        </div>

        {/* Geo context */}
        {block.geo && (
          <div className="grid grid-cols-[1fr_180px] gap-0 border-t border-panel-border">
            <div className="p-3 flex flex-col gap-2 justify-center">
              <div className="flex items-center gap-2 text-2xs text-text-faint uppercase tracking-wider">
                <MapPin size={11} className="text-accent" />
                <span>אזור פעולה מוקצה</span>
              </div>
              <div className="text-sm font-semibold text-text">{block.geo.label}</div>
              <div className="text-2xs text-text-dim leading-relaxed">
                {block.geo.kind === 'area'
                  ? `תיחום פוליגון בן ${block.geo.area?.length ?? 0} נקודות. הסוכן יפעל בתוך התיחום בלבד.`
                  : `נקודת פעולה בקואורדינטות ${block.geo.point?.x.toFixed(1)}, ${block.geo.point?.y.toFixed(1)}.`}
              </div>
              <button
                onClick={showOnMap}
                className="self-start inline-flex items-center gap-1.5 text-2xs text-accent hover:underline"
              >
                <MapPin size={11} /> פתח במפה הראשית
              </button>
            </div>
            <div className="border-s border-panel-border">
              <MockMap
                height={140}
                miniature
                previewGeo={{ geo: block.geo, agentDomain: selectedAgent.domain }}
                showControls={false}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="px-4 py-3 border-t border-panel-border">
          <div className="flex items-center gap-2 mb-2.5">
            <ListChecks size={13} className="text-accent" />
            <span className="text-2xs uppercase tracking-wider text-text-faint font-medium">צעדי ביצוע</span>
            <span className="text-2xs text-text-faint font-mono">· {steps.length} צעדים</span>
          </div>
          <ol className="flex flex-col gap-1.5">
            {steps.map((step, i) => (
              <li
                key={step.id}
                className={clsx(
                  'group flex items-center gap-2.5 p-2 rounded-[4px] border transition-colors',
                  editMode && status === 'pending'
                    ? 'bg-bg-sunken border-panel-border hover:border-accent/30'
                    : 'bg-bg-elevated/40 border-transparent',
                )}
              >
                <span className="w-5 h-5 flex-shrink-0 rounded-full bg-accent/10 border border-accent/40 text-2xs font-mono font-bold text-accent flex items-center justify-center">
                  {i + 1}
                </span>
                {editMode && status === 'pending' && editingStepId === step.id ? (
                  <input
                    value={step.title}
                    onChange={(e) => updateStep(step.id, { title: e.target.value })}
                    onBlur={() => setEditingStepId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingStepId(null)}
                    autoFocus
                    className="flex-1 bg-bg-sunken border border-accent/40 rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/60"
                  />
                ) : (
                  <button
                    onClick={() => editMode && status === 'pending' && setEditingStepId(step.id)}
                    className={clsx(
                      'flex-1 text-start text-xs text-text leading-snug min-w-0',
                      editMode && status === 'pending' && 'hover:text-accent cursor-text',
                    )}
                    disabled={!editMode || status !== 'pending'}
                  >
                    {step.title}
                    {step.detail && (
                      <span className="block text-2xs text-text-faint mt-0.5">{step.detail}</span>
                    )}
                  </button>
                )}
                {editMode && status === 'pending' ? (
                  <>
                    <input
                      type="number"
                      min={1}
                      value={step.estMinutes}
                      onChange={(e) => updateStep(step.id, { estMinutes: Number(e.target.value) })}
                      className="w-14 bg-bg-sunken border border-panel-border rounded px-1.5 py-0.5 text-2xs text-text font-mono text-center focus:outline-none focus:border-accent/50"
                    />
                    <span className="text-2xs text-text-faint">דק'</span>
                    <button
                      onClick={() => removeStep(step.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-faint hover:text-danger transition-all"
                      title="מחק צעד"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <span className="text-2xs text-text-faint font-mono whitespace-nowrap">
                    ~{step.estMinutes} דק'
                  </span>
                )}
              </li>
            ))}
          </ol>
          {editMode && status === 'pending' && (
            <button
              onClick={addStep}
              className="mt-2 w-full h-8 border border-dashed border-panel-border rounded-[4px] text-2xs text-text-faint hover:text-accent hover:border-accent/40 transition-colors"
            >
              + הוסף צעד
            </button>
          )}
        </div>

        {/* Flow visualization */}
        {scheduledFor && status !== 'rejected' && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 text-2xs text-text-faint font-mono p-2 bg-bg-sunken/50 rounded">
              <span>עכשיו</span>
              <ArrowDown size={10} className="rotate-90" />
              <span className="text-warn">המתנה {formatRelative(scheduledFor)}</span>
              <ArrowDown size={10} className="rotate-90" />
              <span className="text-info">הפעלה {formatTime(scheduledFor)}</span>
              <ArrowDown size={10} className="rotate-90" />
              <span className="text-accent">
                סיום ~
                {formatTime(new Date(new Date(scheduledFor).getTime() + totalMinutes * 60 * 1000).toISOString())}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {status === 'pending' && (
          <div className="flex items-center gap-2 px-4 py-3 border-t border-panel-border bg-bg-elevated/40">
            <Button
              variant="primary"
              size="sm"
              icon={editMode ? <Save size={14} /> : <CheckCircle2 size={14} />}
              onClick={approve}
            >
              {editMode ? 'שמור ואשר' : 'אשר והפעל'}
            </Button>
            <Button
              variant="subtle"
              size="sm"
              icon={<Pencil size={13} />}
              onClick={() => setEditMode((v) => !v)}
              active={editMode}
            >
              {editMode ? 'סיים עריכה' : 'ערוך תוכנית'}
            </Button>
            <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={reject}>
              דחה
            </Button>
            <div className="flex-1" />
            <span className="text-2xs text-text-faint">
              autonomy: <span className="text-accent">{state.globalAutonomy}</span>
            </span>
          </div>
        )}
        {status === 'approved' && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-accent/30 bg-accent/5">
            <CheckCircle2 size={14} className="text-accent" />
            <span className="text-xs text-accent font-medium">
              נוספה משימה חדשה ל{selectedAgent.name} {scheduledFor ? `· מתוזמנת ל-${formatTime(scheduledFor)}` : '· סטטוס: ממתינה'}
            </span>
            <span className="text-2xs text-text-faint flex-1 text-end">
              צפה בטאב "משימות" או "ציר זמן"
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
