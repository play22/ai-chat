import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { Modal } from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { MapPin, ArrowLeft, Sparkles, Wand2, Check, AlertTriangle, Bot, Code2, MessageSquareText } from 'lucide-react';
import { autonomyLabel, priorityLabel } from '../shared';
import type { AutomationRule, Priority, EntityType, Recurrence, ScheduleConfig } from '../../../state/types';
import { parseRuleNL, describeRuleLogic } from '../../../mock/ruleNLParser';

const emptyRule = (): AutomationRule => ({
  id: `rule-${Date.now()}`,
  name: '',
  enabled: true,
  trigger: { type: 'detection', entityType: 'threat', areaLabel: '' },
  action: { type: 'create_task', targetAgentId: '', priority: 'medium', message: '' },
  firedCount: 0,
});

type Mode = 'structured' | 'natural';

export function RuleEditor() {
  const { state, dispatch, toast } = useAICommand();
  const editing = state.rules.find((r) => r.id === state.editingRuleId);
  const [draft, setDraft] = useState<AutomationRule>(emptyRule());
  const [mode, setMode] = useState<Mode>('structured');
  const [nlText, setNlText] = useState('');
  const [lastParse, setLastParse] = useState<ReturnType<typeof parseRuleNL> | null>(null);

  useEffect(() => {
    if (state.ruleEditorOpen) {
      const d = editing ? { ...editing } : emptyRule();
      setDraft(d);
      setMode(d.nlDescription ? 'natural' : 'structured');
      setNlText(d.nlDescription ?? '');
      setLastParse(null);
    }
  }, [state.ruleEditorOpen, state.editingRuleId]);

  const runParse = () => {
    const result = parseRuleNL(nlText, state.agents);
    setLastParse(result);
    setDraft((d) => ({ ...d, ...result.patch }));
    if (result.warnings.length === 0) toast('התיאור פוענח בהצלחה', 'success');
    else toast(`פוענח עם ${result.warnings.length} הערות`, 'warn');
  };

  const reasoning = useMemo(() => describeRuleLogic(draft, state.agents, state.globalAutonomy), [draft, state.agents, state.globalAutonomy]);

  const close = () => dispatch({ type: 'CLOSE_RULE_EDITOR' });

  const save = () => {
    if (!draft.name.trim()) {
      toast('יש להזין שם לחוק', 'warn');
      return;
    }
    if (!draft.action.targetAgentId) {
      toast('יש לבחור סוכן יעד', 'warn');
      return;
    }
    const ruleToSave: AutomationRule = {
      ...draft,
      nlDescription: mode === 'natural' && nlText.trim() ? nlText : draft.nlDescription,
    };
    dispatch({ type: 'SAVE_RULE', rule: ruleToSave });
    toast(editing ? `החוק "${draft.name}" עודכן` : `חוק חדש נוצר: ${draft.name}`, 'success');
  };

  return (
    <Modal
      open={state.ruleEditorOpen}
      onClose={close}
      title={editing ? 'עריכת חוק אוטומציה' : 'חוק אוטומציה חדש'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            ביטול
          </Button>
          <Button variant="primary" onClick={save}>
            {editing ? 'עדכן חוק' : 'צור חוק'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Mode toggle */}
        <div className="flex items-center gap-1 bg-bg-sunken border border-panel-border rounded-[6px] p-1 self-start">
          <button
            onClick={() => setMode('structured')}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 h-8 rounded-[4px] text-xs transition-colors',
              mode === 'structured' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
            )}
          >
            <Code2 size={13} />
            הגדרה מובנית
          </button>
          <button
            onClick={() => setMode('natural')}
            className={clsx(
              'inline-flex items-center gap-1.5 px-3 h-8 rounded-[4px] text-xs transition-colors',
              mode === 'natural' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
            )}
          >
            <MessageSquareText size={13} />
            שפה חופשית
          </button>
        </div>

        {/* Natural language section */}
        {mode === 'natural' && (
          <div className="bg-bg-sunken border border-accent/30 rounded-[6px] p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-accent" />
              <span className="text-2xs uppercase tracking-wider text-accent font-medium">תיאור החוק בשפה חופשית</span>
            </div>
            <Textarea
              placeholder='לדוגמה: "כשמתגלה איום בגזרה הצפונית, הקצה את סוכן האש בעדיפות גבוהה" או "כל 6 שעות שלח דו"ח מודיעין"'
              rows={3}
              value={nlText}
              onChange={(e) => setNlText(e.target.value)}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5 text-2xs text-text-faint">
                <span>דוגמאות מהירות:</span>
                {[
                  'איתור איום בצפון → הקצה סוכן אש בעדיפות גבוהה',
                  'כל 4 שעות צור משימת ניטור למודיעין',
                  'תנועה > 50 → התרעה לסוכן מודיעין',
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNlText(s)}
                    className="px-2 py-0.5 border border-panel-border rounded hover:border-accent/40 hover:text-accent transition-colors"
                  >
                    {s.length > 40 ? s.slice(0, 40) + '...' : s}
                  </button>
                ))}
              </div>
              <Button variant="primary" size="sm" icon={<Wand2 size={13} />} onClick={runParse} disabled={!nlText.trim()}>
                פענח ועדכן
              </Button>
            </div>

            {/* Parse result */}
            {lastParse && (
              <div className="border-t border-panel-border pt-3 flex flex-col gap-2">
                <div className="text-2xs uppercase tracking-wider text-text-faint">פענוח ה-AI:</div>
                {lastParse.understood.map((u, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-text">
                    <Check size={12} className="text-accent mt-0.5 flex-shrink-0" />
                    <span>{u}</span>
                  </div>
                ))}
                {lastParse.warnings.map((w, i) => (
                  <div key={`w${i}`} className="flex items-start gap-2 text-xs text-warn">
                    <AlertTriangle size={12} className="text-warn mt-0.5 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
                <div className="text-2xs text-text-faint pt-1 border-t border-panel-border/50">
                  💡 השדות המובנים למטה עודכנו. ניתן לעבור ללשונית "הגדרה מובנית" כדי לחדד פרטים.
                </div>
              </div>
            )}
          </div>
        )}

        <Input
          label="שם החוק"
          placeholder="לדוגמה: איתור איום בגזרת צפון → סוכן אש"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />

        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
          {/* WHEN */}
          <div className="bg-bg-sunken border border-panel-border rounded-[6px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-faint uppercase tracking-wider">WHEN · טריגר</span>
              <Badge tone="info">תנאי הפעלה</Badge>
            </div>
            <Select
              label="סוג טריגר"
              value={draft.trigger.type}
              onChange={(e) =>
                setDraft({ ...draft, trigger: { ...draft.trigger, type: e.target.value as any } })
              }
              options={[
                { value: 'detection', label: 'איתור בשטח' },
                { value: 'threshold', label: 'חציית סף' },
                { value: 'schedule', label: 'תזמון' },
              ]}
              className="w-full"
            />

            {draft.trigger.type === 'detection' && (
              <>
                <Select
                  label="סוג ישות"
                  value={draft.trigger.entityType ?? 'threat'}
                  onChange={(e) =>
                    setDraft({ ...draft, trigger: { ...draft.trigger, entityType: e.target.value as EntityType } })
                  }
                  options={[
                    { value: 'threat', label: 'איום' },
                    { value: 'unit', label: 'יחידה' },
                    { value: 'asset', label: 'נכס' },
                    { value: 'poi', label: 'נקודת עניין' },
                  ]}
                  className="w-full"
                />
                <Input
                  label="תיאור אזור"
                  placeholder="לדוגמה: גזרה צפונית"
                  value={draft.trigger.areaLabel ?? ''}
                  onChange={(e) => setDraft({ ...draft, trigger: { ...draft.trigger, areaLabel: e.target.value } })}
                />
                <Button
                  variant="outline"
                  size="sm"
                  icon={<MapPin size={13} />}
                  onClick={() => {
                    dispatch({ type: 'OPEN_MAP_PICKER', purpose: 'rule_area' });
                    toast('בחר תיחום במפה (במצב הדגמה - הטקסט מספיק)', 'info');
                  }}
                >
                  בחר תיחום במפה
                </Button>
              </>
            )}

            {draft.trigger.type === 'threshold' && (
              <>
                <Input
                  label="מטריקה"
                  placeholder="לדוגמה: תנועה/דקה"
                  value={draft.trigger.threshold?.metric ?? ''}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      trigger: {
                        ...draft.trigger,
                        threshold: { metric: e.target.value, op: draft.trigger.threshold?.op ?? '>', value: draft.trigger.threshold?.value ?? 0 },
                      },
                    })
                  }
                />
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <Select
                    label="אופרטור"
                    value={draft.trigger.threshold?.op ?? '>'}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        trigger: {
                          ...draft.trigger,
                          threshold: { metric: draft.trigger.threshold?.metric ?? '', op: e.target.value as any, value: draft.trigger.threshold?.value ?? 0 },
                        },
                      })
                    }
                    options={[{ value: '>', label: '>' }, { value: '<', label: '<' }, { value: '=', label: '=' }]}
                    className="w-full"
                  />
                  <Input
                    label="ערך"
                    type="number"
                    value={draft.trigger.threshold?.value ?? 0}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        trigger: {
                          ...draft.trigger,
                          threshold: { metric: draft.trigger.threshold?.metric ?? '', op: draft.trigger.threshold?.op ?? '>', value: Number(e.target.value) },
                        },
                      })
                    }
                  />
                </div>
              </>
            )}

            {draft.trigger.type === 'schedule' && (() => {
              const s: ScheduleConfig = draft.trigger.schedule ?? {
                recurrence: 'daily',
                startAt: new Date().toISOString(),
                time: '09:00',
              };
              const updateSchedule = (patch: Partial<ScheduleConfig>) =>
                setDraft({ ...draft, trigger: { ...draft.trigger, schedule: { ...s, ...patch } } });
              return (
                <>
                  <Select
                    label="סוג חזרה"
                    value={s.recurrence}
                    onChange={(e) => updateSchedule({ recurrence: e.target.value as Recurrence })}
                    options={[
                      { value: 'once', label: 'חד-פעמי' },
                      { value: 'hourly', label: 'כל שעה / מרווח שעות' },
                      { value: 'daily', label: 'יומי בשעה קבועה' },
                      { value: 'weekly', label: 'שבועי ביום קבוע' },
                    ]}
                    className="w-full"
                  />
                  {s.recurrence === 'once' && (
                    <Input
                      label="תאריך ושעה"
                      type="datetime-local"
                      value={s.startAt.slice(0, 16)}
                      onChange={(e) => updateSchedule({ startAt: new Date(e.target.value).toISOString() })}
                    />
                  )}
                  {s.recurrence === 'hourly' && (
                    <Input
                      label="מרווח (שעות)"
                      type="number"
                      min={1}
                      max={24}
                      value={s.intervalHours ?? 1}
                      onChange={(e) => updateSchedule({ intervalHours: Number(e.target.value) })}
                    />
                  )}
                  {s.recurrence === 'daily' && (
                    <Input
                      label="שעת הפעלה"
                      type="time"
                      value={s.time ?? '09:00'}
                      onChange={(e) => updateSchedule({ time: e.target.value })}
                    />
                  )}
                  {s.recurrence === 'weekly' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Select
                        label="יום בשבוע"
                        value={String(s.weekday ?? 0)}
                        onChange={(e) => updateSchedule({ weekday: Number(e.target.value) })}
                        options={[
                          { value: '0', label: 'ראשון' },
                          { value: '1', label: 'שני' },
                          { value: '2', label: 'שלישי' },
                          { value: '3', label: 'רביעי' },
                          { value: '4', label: 'חמישי' },
                          { value: '5', label: 'שישי' },
                          { value: '6', label: 'שבת' },
                        ]}
                        className="w-full"
                      />
                      <Input
                        label="שעה"
                        type="time"
                        value={s.time ?? '09:00'}
                        onChange={(e) => updateSchedule({ time: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="text-2xs text-text-faint bg-bg-elevated rounded p-2 border border-panel-border">
                    הפעלה הבאה משוערת: <span className="text-accent font-mono">
                      {s.recurrence === 'once'
                        ? new Date(s.startAt).toLocaleString('he-IL')
                        : s.recurrence === 'hourly'
                          ? `בעוד ${s.intervalHours ?? 1} שעות`
                          : s.recurrence === 'daily'
                            ? `מחר ב-${s.time ?? '09:00'}`
                            : `${['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][s.weekday ?? 0]} ב-${s.time ?? '09:00'}`}
                    </span>
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex items-center justify-center pt-12">
            <ArrowLeft size={24} className="text-accent" />
          </div>

          {/* THEN */}
          <div className="bg-bg-sunken border border-panel-border rounded-[6px] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs text-text-faint uppercase tracking-wider">THEN · פעולה</span>
              <Badge tone="accent">תוצאה</Badge>
            </div>
            <Select
              label="סוג פעולה"
              value={draft.action.type}
              onChange={(e) => setDraft({ ...draft, action: { ...draft.action, type: e.target.value as any } })}
              options={[
                { value: 'create_task', label: 'צור משימה' },
                { value: 'notify', label: 'שלח התרעה' },
                { value: 'dispatch_unit', label: 'הקצה יחידה' },
              ]}
              className="w-full"
            />
            <Select
              label="סוכן יעד"
              value={draft.action.targetAgentId}
              onChange={(e) => setDraft({ ...draft, action: { ...draft.action, targetAgentId: e.target.value } })}
              options={[
                { value: '', label: 'בחר סוכן...' },
                ...state.agents.map((a) => ({ value: a.id, label: a.name })),
              ]}
              className="w-full"
            />
            <Select
              label="עדיפות"
              value={draft.action.priority}
              onChange={(e) => setDraft({ ...draft, action: { ...draft.action, priority: e.target.value as Priority } })}
              options={[
                { value: 'low', label: priorityLabel.low },
                { value: 'medium', label: priorityLabel.medium },
                { value: 'high', label: priorityLabel.high },
                { value: 'critical', label: priorityLabel.critical },
              ]}
              className="w-full"
            />
            <Input
              label="הודעה / תיאור"
              placeholder="פרט את הפעולה שתבוצע"
              value={draft.action.message}
              onChange={(e) => setDraft({ ...draft, action: { ...draft.action, message: e.target.value } })}
            />
          </div>
        </div>

        {/* AI Reasoning - what will actually happen */}
        <div className="bg-bg-sunken border-2 border-accent/40 rounded-[6px] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} className="text-accent" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wider">מה ה-AI יעשה?</span>
            <Badge tone="accent">ניתוח לוגיקה</Badge>
          </div>
          <p
            className="text-sm text-text leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: reasoning.replace(/\*\*(.+?)\*\*/g, '<strong class="text-accent">$1</strong>'),
            }}
          />
          <div className="mt-3 text-2xs text-text-faint border-t border-panel-border pt-2 leading-relaxed flex flex-wrap items-center gap-3">
            <span>אוטונומיה גלובלית: <span className="text-accent font-medium">{autonomyLabel[state.globalAutonomy]}</span></span>
            {draft.action.targetAgentId && (() => {
              const agent = state.agents.find((a) => a.id === draft.action.targetAgentId);
              return agent ? (
                <span>
                  אוטונומיית סוכן: <span className="text-accent font-medium">{autonomyLabel[agent.autonomy]}</span>
                </span>
              ) : null;
            })()}
          </div>
        </div>
      </div>
    </Modal>
  );
}
