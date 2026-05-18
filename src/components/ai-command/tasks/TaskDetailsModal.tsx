import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Save, Ban, X, MapPin, Trash2, Clock, CalendarClock, Users as UsersIcon,
  CheckCircle2, AlertTriangle, ListChecks, FileText, Sparkles, Pencil, Eye,
} from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { MockMap } from '../map/MockMap';
import {
  domainIcon, domainColor, domainHex, priorityLabel, priorityTone,
  taskStatusLabel, taskStatusTone, autonomyLabel, formatRelative, formatTime,
} from '../shared';
import type { Task, Priority, TaskStatus, GeoContext } from '../../../state/types';

export function TaskDetailsModal() {
  const { state, dispatch, toast } = useAICommand();
  const task = state.tasks.find((t) => t.id === state.editingTaskId);

  const [draft, setDraft] = useState<Task | null>(null);
  const [dirty, setDirty] = useState(false);
  const [readOnly, setReadOnly] = useState(true);

  useEffect(() => {
    if (task) {
      setDraft(JSON.parse(JSON.stringify(task)));
      setDirty(false);
      setReadOnly(true);
    }
  }, [task?.id]);

  // Pick up geo from MapPickerModal
  useEffect(() => {
    if (!task || !state.pendingTaskGeo) return;
    if (state.pendingTaskGeo.taskId !== task.id) return;
    const { kind, points, point } = state.pendingTaskGeo;
    setDraft((d) => {
      if (!d) return d;
      const next: Task = {
        ...d,
        geo: kind === 'area' && points
          ? { label: d.geo?.label ?? 'אזור משימה', kind: 'area', area: points }
          : kind === 'point' && point
            ? { label: d.geo?.label ?? 'נקודת משימה', kind: 'point', point }
            : d.geo,
      };
      return next;
    });
    setDirty(true);
    setReadOnly(false);
    dispatch({ type: 'CLEAR_PENDING_TASK_GEO' });
  }, [state.pendingTaskGeo, task, dispatch]);

  if (!task || !draft) return null;

  const coordinator = state.agents.find((a) => a.id === draft.agentId);
  const subAgentIds = draft.subAgentIds ?? [];

  const updateDraft = (patch: Partial<Task>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };

  const close = () => {
    if (dirty && !confirm('יש שינויים שלא נשמרו. לסגור בכל זאת?')) return;
    dispatch({ type: 'CLOSE_TASK_EDITOR' });
  };

  const save = () => {
    if (!draft.title.trim()) {
      toast('יש להזין כותרת', 'warn');
      return;
    }
    if (!draft.agentId) {
      toast('יש לבחור סוכן אחראי', 'warn');
      return;
    }
    dispatch({ type: 'UPDATE_TASK', taskId: draft.id, patch: draft });
    toast('המשימה עודכנה', 'success');
    setDirty(false);
    setReadOnly(true);
  };

  const cancelTask = () => {
    if (!confirm(`לבטל את המשימה "${draft.title}"?`)) return;
    dispatch({ type: 'CANCEL_TASK', taskId: draft.id });
    toast(`המשימה בוטלה`, 'warn');
    dispatch({ type: 'CLOSE_TASK_EDITOR' });
  };

  const markCompleted = () => {
    dispatch({
      type: 'UPDATE_TASK',
      taskId: draft.id,
      patch: {
        ...draft,
        status: 'completed',
        completedAt: new Date().toISOString(),
        progress: 100,
      },
    });
    toast('המשימה סומנה כהושלמה', 'success');
    dispatch({ type: 'CLOSE_TASK_EDITOR' });
  };

  const toggleSubAgent = (id: string) => {
    const has = subAgentIds.includes(id);
    updateDraft({
      subAgentIds: has ? subAgentIds.filter((x) => x !== id) : [...subAgentIds, id],
    });
  };

  const openGeoPicker = () => {
    dispatch({
      type: 'OPEN_MAP_PICKER',
      purpose: 'task_geo',
      taskId: draft.id,
      initialPolygon: draft.geo?.kind === 'area' ? draft.geo.area : undefined,
      initialPoint: draft.geo?.kind === 'point' ? draft.geo.point : undefined,
    });
  };

  const isFinal = draft.status === 'completed' || draft.status === 'failed';
  const CoordIcon = coordinator ? domainIcon[coordinator.domain] : null;

  return (
    <Modal
      open={true}
      onClose={close}
      title=""
      size="xl"
      footer={
        <>
          {dirty && (
            <span className="text-2xs text-warn inline-flex items-center gap-1 me-auto">
              <AlertTriangle size={11} /> יש שינויים שלא נשמרו
            </span>
          )}
          {!isFinal && (
            <Button
              variant="ghost"
              icon={<Ban size={13} />}
              onClick={cancelTask}
              className="text-danger hover:!bg-danger/10"
            >
              בטל משימה
            </Button>
          )}
          {!isFinal && draft.status === 'in_progress' && (
            <Button variant="subtle" icon={<CheckCircle2 size={13} />} onClick={markCompleted}>
              סמן כהושלמה
            </Button>
          )}
          <Button variant="ghost" onClick={close}>
            סגור
          </Button>
          <Button variant="primary" icon={<Save size={14} />} onClick={save} disabled={!dirty}>
            שמור שינויים
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[240px_1fr] gap-5 -m-5 min-h-[560px]">
        {/* Left rail: at-a-glance summary */}
        <aside className="bg-bg-sunken border-e border-panel-border p-4 flex flex-col gap-4">
          <div>
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">משימה #</div>
            <div className="text-2xs font-mono text-text-dim truncate">{draft.id}</div>
          </div>

          {/* Status + priority */}
          <div className="flex flex-col gap-2">
            <Badge tone={taskStatusTone[draft.status]} dot pulse={draft.status === 'in_progress'}>
              {taskStatusLabel[draft.status]}
            </Badge>
            <Badge tone={priorityTone[draft.priority]} dot>
              עדיפות: {priorityLabel[draft.priority]}
            </Badge>
          </div>

          {/* Coordinator */}
          {coordinator && CoordIcon && (
            <div>
              <div className="text-2xs text-text-faint uppercase tracking-wider mb-1.5">
                {subAgentIds.length > 0 ? 'מתאם' : 'סוכן אחראי'}
              </div>
              <div
                className="flex items-center gap-2.5 p-2.5 rounded-[5px] border"
                style={{
                  borderColor: domainHex[coordinator.domain] + '55',
                  backgroundColor: domainHex[coordinator.domain] + '10',
                }}
              >
                <CoordIcon size={18} className={domainColor[coordinator.domain]} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-text truncate">{coordinator.name}</div>
                  <div className="text-[10px] text-text-faint">{autonomyLabel[coordinator.autonomy]}</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-agents preview */}
          {subAgentIds.length > 0 && (
            <div>
              <div className="text-2xs text-text-faint uppercase tracking-wider mb-1.5">
                תתי-סוכנים ({subAgentIds.length})
              </div>
              <div className="flex flex-col gap-1">
                {subAgentIds.map((id) => {
                  const a = state.agents.find((ag) => ag.id === id);
                  if (!a) return null;
                  const Icon = domainIcon[a.domain];
                  return (
                    <div key={id} className="flex items-center gap-2 p-1.5 bg-panel border border-panel-border rounded text-2xs">
                      <Icon size={11} className={domainColor[a.domain]} />
                      <span className="text-text">{a.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress */}
          {typeof draft.progress === 'number' && (draft.status === 'in_progress' || draft.status === 'completed' || draft.status === 'failed') && (
            <div>
              <div className="text-2xs text-text-faint uppercase tracking-wider mb-1.5">התקדמות</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={
                      draft.status === 'failed' ? 'h-full bg-danger' :
                      draft.status === 'completed' ? 'h-full bg-accent' : 'h-full bg-info'
                    }
                    style={{ width: `${draft.progress}%` }}
                  />
                </div>
                <span className="text-2xs font-mono text-text">{draft.progress}%</span>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-panel-border pt-3 space-y-2 text-2xs">
            <TimeStat label="נוצרה" value={draft.createdAt} />
            {draft.scheduledFor && <TimeStat label="מתוזמן ל-" value={draft.scheduledFor} tone="warn" />}
            {draft.startedAt && <TimeStat label="החלה" value={draft.startedAt} tone="info" />}
            {draft.eta && draft.status === 'in_progress' && <TimeStat label="ETA" value={draft.eta} tone="info" />}
            {draft.completedAt && <TimeStat label="הושלמה" value={draft.completedAt} tone="success" />}
          </div>
        </aside>

        {/* Right side: editable form */}
        <section className="p-5 overflow-y-auto max-h-[70vh] flex flex-col gap-5">
          {/* Edit mode toggle bar */}
          <div className="flex items-center justify-between pb-3 border-b border-panel-border">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-accent" />
              <h2 className="text-base font-semibold text-text">פרטי משימה</h2>
              {isFinal && (
                <Badge tone="neutral">לקריאה בלבד · {taskStatusLabel[draft.status]}</Badge>
              )}
            </div>
            {!isFinal && (
              <Button
                variant={readOnly ? 'subtle' : 'primary'}
                size="sm"
                icon={readOnly ? <Pencil size={13} /> : <Eye size={13} />}
                onClick={() => setReadOnly((v) => !v)}
              >
                {readOnly ? 'ערוך' : 'תצוגה'}
              </Button>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block">כותרת</label>
            {readOnly ? (
              <div className="text-base font-medium text-text">{draft.title}</div>
            ) : (
              <input
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full bg-bg-sunken border border-panel-border text-text text-base rounded-[5px] px-3 h-10 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40"
              />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block">תיאור / צעדי ביצוע</label>
            {readOnly ? (
              <div className="text-sm text-text-dim whitespace-pre-wrap leading-relaxed bg-bg-sunken border border-panel-border rounded-[5px] p-3 min-h-[60px]">
                {draft.description || <span className="text-text-faint">אין תיאור.</span>}
              </div>
            ) : (
              <Textarea
                value={draft.description ?? ''}
                onChange={(e) => updateDraft({ description: e.target.value })}
                rows={4}
                placeholder="הוסף תיאור או רשימת צעדי ביצוע..."
              />
            )}
          </div>

          {/* Status / Priority / Coordinator selectors */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block">סטטוס</label>
              {readOnly ? (
                <Badge tone={taskStatusTone[draft.status]}>{taskStatusLabel[draft.status]}</Badge>
              ) : (
                <Select
                  value={draft.status}
                  onChange={(e) => updateDraft({ status: e.target.value as TaskStatus })}
                  options={[
                    { value: 'planned', label: 'מתוכננת' },
                    { value: 'pending', label: 'ממתינה' },
                    { value: 'in_progress', label: 'בביצוע' },
                    { value: 'completed', label: 'הושלמה' },
                    { value: 'failed', label: 'נכשלה' },
                  ]}
                  className="w-full"
                />
              )}
            </div>
            <div>
              <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block">עדיפות</label>
              {readOnly ? (
                <Badge tone={priorityTone[draft.priority]} dot>{priorityLabel[draft.priority]}</Badge>
              ) : (
                <Select
                  value={draft.priority}
                  onChange={(e) => updateDraft({ priority: e.target.value as Priority })}
                  options={[
                    { value: 'low', label: priorityLabel.low },
                    { value: 'medium', label: priorityLabel.medium },
                    { value: 'high', label: priorityLabel.high },
                    { value: 'critical', label: priorityLabel.critical },
                  ]}
                  className="w-full"
                />
              )}
            </div>
            <div>
              <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block">סוכן אחראי</label>
              {readOnly ? (
                <div className="text-sm text-text">{coordinator?.name ?? '—'}</div>
              ) : (
                <Select
                  value={draft.agentId}
                  onChange={(e) => updateDraft({ agentId: e.target.value })}
                  options={state.agents.map((a) => ({ value: a.id, label: a.name }))}
                  className="w-full"
                />
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block inline-flex items-center gap-1">
                <CalendarClock size={11} /> מתוזמן ל-
              </label>
              {readOnly ? (
                <div className="text-sm text-text font-mono">
                  {draft.scheduledFor ? `${formatTime(draft.scheduledFor)} · ${formatRelative(draft.scheduledFor)}` : <span className="text-text-faint">לא מתוזמן</span>}
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={draft.scheduledFor ? draft.scheduledFor.slice(0, 16) : ''}
                  onChange={(e) =>
                    updateDraft({
                      scheduledFor: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="w-full bg-bg-sunken border border-panel-border text-text text-sm rounded-[5px] px-3 h-9 focus:outline-none focus:border-accent/60"
                />
              )}
            </div>
            <div>
              <label className="text-2xs text-text-faint uppercase tracking-wider mb-1 block inline-flex items-center gap-1">
                <Clock size={11} /> ETA
              </label>
              {readOnly ? (
                <div className="text-sm text-text font-mono">
                  {draft.eta ? `${formatTime(draft.eta)} · ${formatRelative(draft.eta)}` : <span className="text-text-faint">—</span>}
                </div>
              ) : (
                <input
                  type="datetime-local"
                  value={draft.eta ? draft.eta.slice(0, 16) : ''}
                  onChange={(e) =>
                    updateDraft({ eta: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                  }
                  className="w-full bg-bg-sunken border border-panel-border text-text text-sm rounded-[5px] px-3 h-9 focus:outline-none focus:border-accent/60"
                />
              )}
            </div>
          </div>

          {/* Sub-agents */}
          <div>
            <label className="text-2xs text-text-faint uppercase tracking-wider mb-2 block inline-flex items-center gap-1">
              <UsersIcon size={11} /> תתי-סוכנים
              {subAgentIds.length > 0 && <span className="text-accent font-mono normal-case tracking-normal ms-2">{subAgentIds.length} נבחרו</span>}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {state.agents
                .filter((a) => a.id !== draft.agentId)
                .map((a) => {
                  const SubIcon = domainIcon[a.domain];
                  const selected = subAgentIds.includes(a.id);
                  return (
                    <button
                      key={a.id}
                      disabled={readOnly}
                      onClick={() => toggleSubAgent(a.id)}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-1 text-2xs rounded-[4px] border transition-all',
                        selected
                          ? 'bg-accent/10 border-accent/50 text-text'
                          : 'bg-bg-sunken border-panel-border text-text-dim hover:border-accent/30 hover:text-text',
                        readOnly && 'pointer-events-none opacity-60',
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
          </div>

          {/* Geo */}
          <div>
            <label className="text-2xs text-text-faint uppercase tracking-wider mb-2 block inline-flex items-center gap-1">
              <MapPin size={11} /> אזור פעולה גיאוגרפי
            </label>
            <div className="grid grid-cols-[1fr_200px] gap-3 items-start">
              <div className="flex flex-col gap-2">
                {draft.geo ? (
                  <>
                    <Input
                      label="תווית האזור"
                      value={draft.geo.label}
                      disabled={readOnly}
                      onChange={(e) => updateDraft({ geo: { ...draft.geo!, label: e.target.value } })}
                    />
                    <div className="text-2xs text-text-dim">
                      סוג: {draft.geo.kind === 'area' ? `פוליגון (${draft.geo.area?.length ?? 0} נקודות)` : 'נקודה'}
                    </div>
                    {!readOnly && (
                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="sm" icon={<MapPin size={13} />} onClick={openGeoPicker}>
                          ערוך במפה
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={13} />}
                          onClick={() => updateDraft({ geo: undefined })}
                          className="text-danger"
                        >
                          הסר
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-bg-sunken border border-dashed border-panel-border rounded-[6px] p-4 text-center flex flex-col items-center gap-2">
                    <MapPin size={18} className="text-text-faint" />
                    <div className="text-xs text-text-dim">לא הוגדר אזור</div>
                    {!readOnly && (
                      <Button variant="primary" size="sm" icon={<MapPin size={13} />} onClick={openGeoPicker}>
                        סמן אזור במפה
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <MockMap
                  height={140}
                  miniature
                  showControls={false}
                  previewGeo={draft.geo && coordinator ? { geo: draft.geo, agentDomain: coordinator.domain } : null}
                />
              </div>
            </div>
          </div>

          {/* Bottom hint */}
          <div className="text-2xs text-text-faint bg-info/5 border border-info/20 rounded-[5px] p-2.5 leading-relaxed mt-auto">
            💡 שינוי הסטטוס ל"הושלמה" יקבע אוטומטית את שעת הסיום והתקדמות 100%. ביטול משימה מסמן אותה כ"נכשלה" ולא ניתן לשחזר ישירות (ניתן ליצור חדשה).
          </div>
        </section>
      </div>
    </Modal>
  );
}

function TimeStat({ label, value, tone }: { label: string; value: string; tone?: 'info' | 'warn' | 'success' }) {
  const c = tone === 'info' ? 'text-info' : tone === 'warn' ? 'text-warn' : tone === 'success' ? 'text-accent' : 'text-text';
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-text-faint">{label}</span>
      <span className={`font-mono ${c}`} title={new Date(value).toLocaleString('he-IL')}>
        {formatRelative(value)}
      </span>
    </div>
  );
}
