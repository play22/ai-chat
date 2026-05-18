import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import {
  Settings, User, Shield, Users as UsersIcon, MapPin, Wrench, Plus, Trash2,
  Check, X, AlertTriangle, Eye, Save, Wand2, MessageSquare, Lock, Unlock,
} from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Modal } from '../ui/Modal';
import { Button, IconButton } from '../ui/Button';
import { Input, Textarea } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';
import { Badge } from '../ui/Badge';
import { MockMap } from '../map/MockMap';
import { domainIcon, domainColor, domainHex, autonomyLabel } from '../shared';
import type {
  AgentConfig, AgentTool, CommTone, Verbosity, AgentLang, LinkedUnit, ToolType,
} from '../../../state/types';

type TabId = 'general' | 'style' | 'permissions' | 'units' | 'boundary' | 'tools';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'כללי', icon: <User size={14} /> },
  { id: 'style', label: 'סגנון תקשורת', icon: <MessageSquare size={14} /> },
  { id: 'permissions', label: 'הרשאות', icon: <Shield size={14} /> },
  { id: 'units', label: 'יחידות', icon: <UsersIcon size={14} /> },
  { id: 'boundary', label: 'תיחום', icon: <MapPin size={14} /> },
  { id: 'tools', label: 'כלים', icon: <Wrench size={14} /> },
];

export function AgentSettingsModal() {
  const { state, dispatch, toast } = useAICommand();
  const agent = state.agents.find((a) => a.id === state.agentSettingsId);
  const [tab, setTab] = useState<TabId>('general');
  const [draft, setDraft] = useState<AgentConfig | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (agent?.config) {
      setDraft(JSON.parse(JSON.stringify(agent.config)));
      setDirty(false);
      setTab('general');
    }
  }, [agent?.id]);

  // Pick up polygon from MapPickerModal when it finishes
  useEffect(() => {
    if (!agent || !state.pendingBoundary) return;
    if (state.pendingBoundary.agentId !== agent.id) return;
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        boundary: {
          label: d.boundary?.label ?? `תיחום אחריות · ${agent.name}`,
          kind: 'area',
          area: state.pendingBoundary!.points,
        },
      };
    });
    setDirty(true);
    dispatch({ type: 'CLEAR_PENDING_BOUNDARY' });
  }, [state.pendingBoundary, agent, dispatch]);

  if (!agent || !draft) return null;

  const Icon = domainIcon[agent.domain];

  const updateDraft = (patch: Partial<AgentConfig>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };

  const close = () => {
    if (dirty && !confirm('יש שינויים שלא נשמרו. לסגור בכל זאת?')) return;
    dispatch({ type: 'CLOSE_AGENT_SETTINGS' });
  };

  const save = () => {
    dispatch({ type: 'UPDATE_AGENT_CONFIG', agentId: agent.id, config: draft });
    toast(`הגדרות ${agent.name} נשמרו`, 'success');
    setDirty(false);
  };

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
          <Button variant="ghost" onClick={close}>ביטול</Button>
          <Button variant="primary" icon={<Save size={14} />} onClick={save} disabled={!dirty}>
            שמור שינויים
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-[200px_1fr] gap-5 -m-5 min-h-[560px]">
        {/* Sidebar */}
        <aside className="bg-bg-sunken border-e border-panel-border p-3 flex flex-col">
          <div className="flex items-center gap-2 p-3 mb-3 rounded-[6px] border" style={{ borderColor: domainHex[agent.domain] + '55', backgroundColor: domainHex[agent.domain] + '12' }}>
            <div className="w-10 h-10 rounded-[6px] flex items-center justify-center bg-bg-elevated border border-panel-border">
              <Icon size={20} className={domainColor[agent.domain]} />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-text-faint">הגדרות סוכן</div>
              <div className="text-sm font-semibold text-text truncate">{agent.name}</div>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-[5px] text-xs transition-colors text-start',
                  tab === t.id
                    ? 'bg-accent/10 text-accent border border-accent/30'
                    : 'text-text-dim hover:text-text hover:bg-panel-hover border border-transparent',
                )}
              >
                {t.icon}
                <span className="flex-1">{t.label}</span>
                {tab === t.id && <span className="w-1 h-1 rounded-full bg-accent" />}
              </button>
            ))}
          </nav>
          <div className="flex-1" />
          <div className="text-2xs text-text-faint border-t border-panel-border pt-3 mt-3 leading-relaxed">
            השינויים יחולו רק לאחר לחיצה על "שמור שינויים".
          </div>
        </aside>

        {/* Content */}
        <section className="p-5 overflow-y-auto max-h-[70vh]">
          {tab === 'general' && <GeneralTab agent={agent} draft={draft} />}
          {tab === 'style' && <StyleTab draft={draft} update={updateDraft} />}
          {tab === 'permissions' && <PermissionsTab draft={draft} update={updateDraft} />}
          {tab === 'units' && <UnitsTab draft={draft} update={updateDraft} />}
          {tab === 'boundary' && <BoundaryTab draft={draft} update={updateDraft} agentDomain={agent.domain} agentId={agent.id} />}
          {tab === 'tools' && <ToolsTab draft={draft} update={updateDraft} />}
        </section>
      </div>
    </Modal>
  );
}

// ─── Section components ───

function SectionTitle({ title, sub, icon }: { title: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="mb-5 pb-3 border-b border-panel-border">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent">{icon}</span>
        <h3 className="text-base font-semibold text-text">{title}</h3>
      </div>
      {sub && <p className="text-xs text-text-dim leading-relaxed">{sub}</p>}
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-3 border-b border-panel-border/50 last:border-b-0">
      <div className="pt-1.5">
        <div className="text-xs font-medium text-text">{label}</div>
        {hint && <div className="text-2xs text-text-faint mt-0.5 leading-relaxed">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function GeneralTab({ agent, draft }: { agent: any; draft: AgentConfig }) {
  const Icon = domainIcon[agent.domain];
  return (
    <>
      <SectionTitle title="סקירה כללית" sub="מידע סטטי על הסוכן ותצורתו הנוכחית" icon={<User size={16} />} />
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-bg-elevated border border-panel-border rounded-[6px] p-3">
          <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">דומיין</div>
          <div className="flex items-center gap-2">
            <Icon size={16} className={domainColor[agent.domain]} />
            <span className="text-sm font-semibold text-text">{agent.name}</span>
          </div>
        </div>
        <div className="bg-bg-elevated border border-panel-border rounded-[6px] p-3">
          <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">סטטוס</div>
          <div className="text-sm font-semibold text-text">{agent.status === 'active' ? '● פעיל' : agent.status === 'idle' ? '○ סרק' : agent.status === 'error' ? '⚠ שגיאה' : '◌ מנותק'}</div>
        </div>
        <div className="bg-bg-elevated border border-panel-border rounded-[6px] p-3">
          <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">הצלחה היסטורית</div>
          <div className="text-sm font-semibold text-accent font-mono">{Math.round(agent.successRate * 100)}%</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="רמת אוטונומיה" value={autonomyLabel[agent.autonomy]} />
        <Stat label="משימות פעילות" value={String(agent.activeTasks)} />
        <Stat label="יחידות מקושרות" value={String(draft.units.length)} />
        <Stat label="כלים זמינים" value={`${draft.tools.filter((t) => t.enabled).length} / ${draft.tools.length}`} />
        <Stat label="הרשאת ביצוע אוטומטי" value={draft.permissions.canExecuteAuto ? 'פעיל' : 'לא פעיל'} tone={draft.permissions.canExecuteAuto ? 'warn' : undefined} />
        <Stat label="תיחום אחריות" value={draft.boundary?.label ?? 'לא הוגדר'} />
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'warn' }) {
  return (
    <div className="bg-bg-elevated border border-panel-border rounded-[6px] p-3 flex items-center justify-between">
      <span className="text-2xs text-text-dim">{label}</span>
      <span className={clsx('text-sm font-medium', tone === 'warn' ? 'text-warn' : 'text-text')}>{value}</span>
    </div>
  );
}

function StyleTab({ draft, update }: { draft: AgentConfig; update: (p: Partial<AgentConfig>) => void }) {
  const setStyle = (p: Partial<AgentConfig['style']>) => update({ style: { ...draft.style, ...p } });
  return (
    <>
      <SectionTitle title="סגנון תקשורת" sub="קובע כיצד הסוכן מדבר וכותב - טון, אורך, שפה, חתימה" icon={<MessageSquare size={16} />} />
      <Row label="חתימה" hint="השם שמופיע בהודעות הצ'אט">
        <Input value={draft.style.signature} onChange={(e) => setStyle({ signature: e.target.value })} />
      </Row>
      <Row label="טון" hint="האופי הכללי של ההתבטאות">
        <Select
          value={draft.style.tone}
          onChange={(e) => setStyle({ tone: e.target.value as CommTone })}
          options={[
            { value: 'formal', label: 'רשמי' },
            { value: 'tactical', label: 'טקטי-מבצעי' },
            { value: 'concise', label: 'תמציתי' },
            { value: 'verbose', label: 'מפורט' },
          ]}
          className="w-full max-w-[260px]"
        />
      </Row>
      <Row label="רמת פירוט" hint="כמה פרטים להציג בכל תשובה">
        <Select
          value={draft.style.verbosity}
          onChange={(e) => setStyle({ verbosity: e.target.value as Verbosity })}
          options={[
            { value: 'minimal', label: 'מינימלי - שורה אחת לתשובה' },
            { value: 'standard', label: 'סטנדרטי - פסקה' },
            { value: 'detailed', label: 'מורחב - עם נימוקים ומקורות' },
          ]}
          className="w-full max-w-[260px]"
        />
      </Row>
      <Row label="שפה ראשית">
        <Select
          value={draft.style.language}
          onChange={(e) => setStyle({ language: e.target.value as AgentLang })}
          options={[
            { value: 'he', label: 'עברית' },
            { value: 'en', label: 'אנגלית' },
            { value: 'mixed', label: 'מעורב (HE/EN)' },
          ]}
          className="w-full max-w-[260px]"
        />
      </Row>
      <Row label="שימוש באימוג'י" hint="הוסף סמלים גרפיים לטקסט (לא מומלץ במבצעי)">
        <Toggle checked={draft.style.useEmoji} onChange={(v) => setStyle({ useEmoji: v })} />
      </Row>
      <Row label="ציטוט מקורות" hint="צרף הפניות למקורות מודיעין/נתונים בכל תשובה">
        <Toggle checked={draft.style.citeSources} onChange={(v) => setStyle({ citeSources: v })} />
      </Row>

      {/* Preview */}
      <div className="mt-6 bg-bg-sunken border border-panel-border rounded-[6px] p-4">
        <div className="text-2xs text-text-faint uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Eye size={11} /> תצוגה מקדימה
        </div>
        <div className="text-xs text-text leading-relaxed">
          <span className="font-semibold text-accent">{draft.style.signature}:</span>{' '}
          {previewSample(draft.style)}
        </div>
      </div>
    </>
  );
}

function previewSample(s: AgentConfig['style']): string {
  const emoji = s.useEmoji ? '🎯 ' : '';
  const sources = s.citeSources ? ' [מקור: SIGINT-04, OSINT-12]' : '';
  if (s.tone === 'concise') return `${emoji}איתור בקואורדינטה 34.7, 32.1. רמת ביטחון גבוהה.${sources}`;
  if (s.tone === 'formal') return `${emoji}מתכבד לדווח על איתור חדש בקואורדינטה 34.7°N, 32.1°E. הצלבת מקורות מעלה רמת ביטחון גבוהה.${sources}`;
  if (s.tone === 'verbose') return `${emoji}התקבל איתור חדש. מיקום: 34.7°N, 32.1°E. שלוש מקורות עצמאיים אישרו תנועה חריגה ב-90 השניות האחרונות. רמת הביטחון מוערכת בגבוהה (87%). ממליץ להפעיל סוכן אש למעקב.${sources}`;
  // tactical
  return `${emoji}איתור חדש - 34.7N 32.1E. תנועה חריגה +120m דרומה ב-90s. ביטחון גבוה. ממליץ סוכן אש למעקב.${sources}`;
}

function PermissionsTab({ draft, update }: { draft: AgentConfig; update: (p: Partial<AgentConfig>) => void }) {
  const setPerms = (p: Partial<AgentConfig['permissions']>) => update({ permissions: { ...draft.permissions, ...p } });
  const p = draft.permissions;
  return (
    <>
      <SectionTitle title="הרשאות ומדיניות" sub="מה הסוכן רשאי לעשות אוטונומית ומה דורש אישור" icon={<Shield size={16} />} />

      <div className="mb-5 grid grid-cols-2 gap-2">
        {([
          { key: 'canCreateTasks', label: 'יצירת משימות חדשות', icon: <Plus size={13} /> },
          { key: 'canDispatchUnits', label: 'הקצאת יחידות בשטח', icon: <UsersIcon size={13} /> },
          { key: 'canEscalateAlerts', label: 'הסלמת התרעות', icon: <AlertTriangle size={13} /> },
          { key: 'canModifyEntities', label: 'שינוי ישויות במפה', icon: <MapPin size={13} /> },
          { key: 'canAccessClassified', label: 'גישה למידע מסווג', icon: <Lock size={13} /> },
          { key: 'canExecuteAuto', label: 'ביצוע ללא אישור', icon: <Wand2 size={13} /> },
        ] as const).map(({ key, label, icon }) => {
          const enabled = p[key] as boolean;
          return (
            <button
              key={key}
              onClick={() => setPerms({ [key]: !enabled } as any)}
              className={clsx(
                'flex items-center gap-2 p-3 rounded-[5px] border text-start transition-colors',
                enabled
                  ? 'bg-accent/5 border-accent/40 text-text'
                  : 'bg-bg-sunken border-panel-border text-text-dim hover:border-panel-border/60',
              )}
            >
              <span className={clsx(enabled ? 'text-accent' : 'text-text-faint')}>{icon}</span>
              <span className="flex-1 text-xs">{label}</span>
              {enabled ? <Check size={13} className="text-accent" /> : <X size={13} className="text-text-faint" />}
            </button>
          );
        })}
      </div>

      <Row
        label="סף עדיפות לאישור אוטומטי"
        hint="עדיפות מקסימלית שהסוכן רשאי לבצע ללא אישור אנושי"
      >
        <Select
          value={p.autoApprovalThreshold}
          onChange={(e) => setPerms({ autoApprovalThreshold: e.target.value as any })}
          options={[
            { value: 'never', label: 'אף פעם - תמיד דרוש אישור' },
            { value: 'low', label: 'עד נמוכה' },
            { value: 'medium', label: 'עד בינונית' },
            { value: 'high', label: 'עד גבוהה (כולל)' },
          ]}
          className="w-full max-w-[280px]"
        />
      </Row>
      <Row label="מקסימום משימות מקבילות" hint="מספר משימות פעילות שהסוכן יכול לטפל בו-זמנית">
        <Input
          type="number"
          min={1}
          max={50}
          value={p.maxParallelTasks}
          onChange={(e) => setPerms({ maxParallelTasks: Number(e.target.value) })}
          className="w-32"
        />
      </Row>

      {p.canExecuteAuto && (
        <div className="mt-4 flex items-start gap-2 p-3 bg-warn/10 border border-warn/30 rounded-[6px]">
          <AlertTriangle size={14} className="text-warn flex-shrink-0 mt-0.5" />
          <p className="text-xs text-warn leading-relaxed">
            <span className="font-semibold">שים לב:</span> מצב ביצוע אוטומטי מאפשר לסוכן לבצע פעולות בשטח ללא אישור.
            השתמש בזהירות בהקשרים בהם זמן תגובה קריטי.
          </p>
        </div>
      )}
    </>
  );
}

function UnitsTab({ draft, update }: { draft: AgentConfig; update: (p: Partial<AgentConfig>) => void }) {
  const [adding, setAdding] = useState(false);
  const [newUnit, setNewUnit] = useState<Partial<LinkedUnit>>({ type: 'company' });

  const removeUnit = (id: string) => update({ units: draft.units.filter((u) => u.id !== id) });

  const saveNew = () => {
    if (!newUnit.name?.trim()) return;
    const u: LinkedUnit = {
      id: `u-${Date.now()}`,
      name: newUnit.name,
      type: (newUnit.type as LinkedUnit['type']) ?? 'company',
      callsign: newUnit.callsign,
    };
    update({ units: [...draft.units, u] });
    setNewUnit({ type: 'company' });
    setAdding(false);
  };

  const typeLabel: Record<LinkedUnit['type'], string> = {
    company: 'פלוגה',
    platoon: 'מחלקה',
    platform: 'פלטפורמה',
    sensor: 'חיישן',
    cell: 'תא',
  };

  return (
    <>
      <SectionTitle
        title="יחידות מקושרות"
        sub="יחידות, פלטפורמות וחיישנים שהסוכן מתאם איתם או מפעיל"
        icon={<UsersIcon size={16} />}
      />

      <div className="flex flex-col gap-2 mb-3">
        {draft.units.length === 0 && (
          <div className="text-xs text-text-faint text-center py-8 bg-bg-sunken border border-dashed border-panel-border rounded-[6px]">
            לא קושרו יחידות לסוכן זה
          </div>
        )}
        {draft.units.map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3 bg-bg-elevated border border-panel-border rounded-[6px] hover:border-accent/30 transition-colors">
            <div className="w-8 h-8 rounded-[5px] bg-bg-sunken border border-panel-border flex items-center justify-center">
              <UsersIcon size={14} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text">{u.name}</span>
                <Badge tone="neutral">{typeLabel[u.type]}</Badge>
              </div>
              {u.callsign && (
                <div className="text-2xs text-text-faint font-mono mt-0.5">קריאה: {u.callsign}</div>
              )}
            </div>
            <IconButton size="xs" onClick={() => removeUnit(u.id)} aria-label="הסר">
              <Trash2 size={12} className="text-danger" />
            </IconButton>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="p-3 bg-bg-sunken border border-accent/40 rounded-[6px] flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            <Input label="שם יחידה" value={newUnit.name ?? ''} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} />
            <Select
              label="סוג"
              value={newUnit.type ?? 'company'}
              onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value as LinkedUnit['type'] })}
              options={Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l }))}
              className="w-full"
            />
            <Input label="קריאה (אופציונלי)" value={newUnit.callsign ?? ''} onChange={(e) => setNewUnit({ ...newUnit, callsign: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewUnit({ type: 'company' }); }}>
              ביטול
            </Button>
            <Button variant="primary" size="sm" onClick={saveNew} disabled={!newUnit.name?.trim()}>
              הוסף יחידה
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={() => setAdding(true)}>
          קשר יחידה חדשה
        </Button>
      )}
    </>
  );
}

function BoundaryTab({ draft, update, agentDomain, agentId }: { draft: AgentConfig; update: (p: Partial<AgentConfig>) => void; agentDomain: string; agentId: string }) {
  const { dispatch } = useAICommand();

  const openPicker = (initial?: { x: number; y: number }[]) => {
    dispatch({
      type: 'OPEN_MAP_PICKER',
      purpose: 'agent_boundary',
      agentId,
      initialPolygon: initial,
    });
  };

  return (
    <>
      <SectionTitle
        title="תיחום אחריות גיאוגרפי"
        sub="האזור בו הסוכן רשאי לפעול אוטונומית. פעולות מחוץ לתיחום ידרשו אישור"
        icon={<MapPin size={16} />}
      />

      <div className="grid grid-cols-[1fr_320px] gap-4">
        <div className="flex flex-col gap-3">
          {draft.boundary ? (
            <>
              <Input
                label="שם התיחום"
                value={draft.boundary.label}
                onChange={(e) => update({ boundary: { ...draft.boundary!, label: e.target.value } })}
              />
              <div className="bg-bg-elevated border border-panel-border rounded-[6px] p-3 flex items-center justify-between">
                <div>
                  <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">סוג תיחום</div>
                  <div className="text-sm text-text">
                    {draft.boundary.kind === 'area' ? 'פוליגון' : 'נקודה'}
                    {draft.boundary.kind === 'area' && draft.boundary.area && (
                      <span className="text-2xs text-text-faint ms-2 font-mono">
                        {draft.boundary.area.length} נקודות
                      </span>
                    )}
                  </div>
                </div>
                {draft.boundary.kind === 'area' && (
                  <div className="text-end">
                    <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">שטח משוער</div>
                    <div className="text-sm font-mono text-accent">
                      {draft.boundary.area ? `${polygonArea(draft.boundary.area).toFixed(1)}%` : '—'}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<MapPin size={13} />}
                  onClick={() => openPicker(draft.boundary?.kind === 'area' ? draft.boundary.area : undefined)}
                >
                  ערוך תיחום במפה
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={13} />}
                  onClick={() => update({ boundary: undefined })}
                  className="text-danger"
                >
                  הסר תיחום
                </Button>
              </div>
              <div className="text-2xs text-text-faint bg-info/5 border border-info/20 rounded p-2.5 leading-relaxed">
                💡 לחץ "ערוך תיחום במפה" כדי לפתוח את המפה המלאה. תוכל לסמן נקודות חדשות, לבטל נקודה אחרונה, או לאפס ולהתחיל מחדש. התיחום הקיים נטען כנקודת מוצא.
              </div>
            </>
          ) : (
            <div className="bg-bg-sunken border border-dashed border-panel-border rounded-[6px] p-6 text-center flex flex-col items-center gap-3">
              <Unlock size={24} className="text-text-faint" />
              <div className="text-sm text-text">לא הוגדר תיחום</div>
              <div className="text-2xs text-text-faint leading-relaxed max-w-[280px]">
                הסוכן רשאי לפעול בכל המרחב. הגדר תיחום כדי להגביל אותו לאזור ספציפי — פעולות מחוץ לתיחום ידרשו אישור מפקדתי.
              </div>
              <div className="flex flex-col gap-2 w-full max-w-[260px]">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<MapPin size={13} />}
                  onClick={() => openPicker()}
                >
                  סמן תיחום במפה
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Plus size={13} />}
                  onClick={() =>
                    update({
                      boundary: {
                        label: 'תיחום חדש',
                        kind: 'area',
                        area: [{ x: 30, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 70 }, { x: 30, y: 70 }],
                      },
                    })
                  }
                >
                  או הוסף מלבן ברירת מחדל
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-2xs text-text-faint uppercase tracking-wider">תצוגת מפה מקדימה</div>
          <MockMap
            height={260}
            miniature
            showControls={false}
            previewGeo={draft.boundary ? { geo: draft.boundary, agentDomain } : null}
          />
          {draft.boundary?.kind === 'area' && draft.boundary.area && (
            <div className="text-2xs text-text-faint text-center font-mono">
              גבולות: X[{Math.min(...draft.boundary.area.map((p) => p.x)).toFixed(0)}-{Math.max(...draft.boundary.area.map((p) => p.x)).toFixed(0)}] · Y[{Math.min(...draft.boundary.area.map((p) => p.y)).toFixed(0)}-{Math.max(...draft.boundary.area.map((p) => p.y)).toFixed(0)}]
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Shoelace formula - returns area in % units of the 0-100 viewBox (so out of 10000). */
function polygonArea(points: { x: number; y: number }[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 200; // divided by 2 then converted to percent of 10000
}

function ToolsTab({ draft, update }: { draft: AgentConfig; update: (p: Partial<AgentConfig>) => void }) {
  const [adding, setAdding] = useState(false);
  const [newTool, setNewTool] = useState<Partial<AgentTool>>({ type: 'action', enabled: true });

  const removeTool = (id: string) => update({ tools: draft.tools.filter((t) => t.id !== id) });
  const toggleTool = (id: string) =>
    update({ tools: draft.tools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)) });

  const saveNew = () => {
    if (!newTool.name?.trim() || !newTool.description?.trim()) return;
    const t: AgentTool = {
      id: `tool-${Date.now()}`,
      name: newTool.name,
      description: newTool.description,
      type: (newTool.type as ToolType) ?? 'action',
      endpoint: newTool.endpoint,
      enabled: newTool.enabled ?? true,
      createdAt: new Date().toISOString(),
    };
    update({ tools: [...draft.tools, t] });
    setNewTool({ type: 'action', enabled: true });
    setAdding(false);
  };

  const typeLabel: Record<ToolType, string> = {
    webhook: 'Webhook',
    query: 'שאילתה',
    action: 'פעולה',
    analysis: 'ניתוח',
  };
  const typeTone: Record<ToolType, 'info' | 'warn' | 'accent' | 'neutral'> = {
    webhook: 'warn',
    query: 'info',
    action: 'accent',
    analysis: 'neutral',
  };

  return (
    <>
      <SectionTitle
        title="כלים ויכולות"
        sub="פעולות, ניתוחים, וחיבורים חיצוניים שהסוכן יכול להשתמש בהם"
        icon={<Wrench size={16} />}
      />

      <div className="flex flex-col gap-2 mb-4">
        {draft.tools.length === 0 && (
          <div className="text-xs text-text-faint text-center py-8 bg-bg-sunken border border-dashed border-panel-border rounded-[6px]">
            עדיין אין כלים מוגדרים לסוכן זה
          </div>
        )}
        {draft.tools.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'p-3 border rounded-[6px] transition-colors',
              t.enabled ? 'bg-bg-elevated border-panel-border' : 'bg-bg-sunken border-panel-border/50 opacity-70',
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[5px] bg-bg-sunken border border-panel-border flex items-center justify-center flex-shrink-0">
                <Wrench size={14} className={t.enabled ? 'text-accent' : 'text-text-faint'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-text">{t.name}</span>
                  <Badge tone={typeTone[t.type] as any}>{typeLabel[t.type]}</Badge>
                </div>
                <p className="text-xs text-text-dim leading-relaxed">{t.description}</p>
                {t.endpoint && (
                  <div className="text-2xs text-text-faint font-mono mt-1 truncate">→ {t.endpoint}</div>
                )}
                <div className="text-2xs text-text-faint mt-1">
                  נוצר {new Date(t.createdAt).toLocaleDateString('he-IL')}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Toggle checked={t.enabled} onChange={() => toggleTool(t.id)} />
                <IconButton size="xs" onClick={() => removeTool(t.id)} aria-label="מחק">
                  <Trash2 size={12} className="text-danger" />
                </IconButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      {adding ? (
        <div className="p-4 bg-bg-sunken border border-accent/40 rounded-[6px] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-text">
            <Wand2 size={14} className="text-accent" />
            יצירת כלי חדש
          </div>
          <Input
            label="שם הכלי"
            placeholder="לדוגמה: חישוב טווח אופטימלי"
            value={newTool.name ?? ''}
            onChange={(e) => setNewTool({ ...newTool, name: e.target.value })}
          />
          <Textarea
            label="תיאור"
            placeholder="מה הכלי עושה? באילו תרחישים הוא מופעל?"
            rows={2}
            value={newTool.description ?? ''}
            onChange={(e) => setNewTool({ ...newTool, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="סוג כלי"
              value={newTool.type ?? 'action'}
              onChange={(e) => setNewTool({ ...newTool, type: e.target.value as ToolType })}
              options={Object.entries(typeLabel).map(([v, l]) => ({ value: v, label: l }))}
              className="w-full"
            />
            {newTool.type === 'webhook' && (
              <Input
                label="Endpoint URL"
                placeholder="https://api/..."
                value={newTool.endpoint ?? ''}
                onChange={(e) => setNewTool({ ...newTool, endpoint: e.target.value })}
              />
            )}
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-panel-border mt-1">
            <Toggle
              checked={newTool.enabled ?? true}
              onChange={(v) => setNewTool({ ...newTool, enabled: v })}
              label="הפעל מיידית"
            />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setNewTool({ type: 'action', enabled: true }); }}>
                ביטול
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={saveNew}
                disabled={!newTool.name?.trim() || !newTool.description?.trim()}
              >
                צור כלי
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" icon={<Plus size={13} />} onClick={() => setAdding(true)}>
          צור כלי חדש
        </Button>
      )}
    </>
  );
}
