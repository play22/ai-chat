import { useMemo, useState } from 'react';
import { Plus, Workflow, Bot, AlertTriangle, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { RuleCard } from './RuleCard';
import { RuleEditor } from './RuleEditor';
import { describeRuleLogic, findConflicts } from '../../../mock/ruleNLParser';
import { autonomyLabel, domainIcon, domainColor } from '../shared';

export function AutomationPanel() {
  const { state, dispatch } = useAICommand();
  const [insightsOpen, setInsightsOpen] = useState(true);

  const enabled = state.rules.filter((r) => r.enabled);
  const conflicts = useMemo(() => findConflicts(state.rules, state.agents), [state.rules, state.agents]);

  const agentLoadMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of enabled) {
      m[r.action.targetAgentId] = (m[r.action.targetAgentId] ?? 0) + 1;
    }
    return m;
  }, [enabled]);

  const autoCount = enabled.filter((r) => {
    const a = state.agents.find((ag) => ag.id === r.action.targetAgentId);
    if (!a) return false;
    return a.autonomy === 'autonomous' || (a.autonomy === 'recommend' && state.globalAutonomy === 'autonomous');
  }).length;
  const recommendCount = enabled.length - autoCount;

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2 min-w-0">
          <Workflow size={14} className="text-accent flex-shrink-0" />
          <span className="text-sm font-medium text-text truncate">חוקי אוטומציה</span>
          <span className="text-2xs text-text-faint font-mono whitespace-nowrap">
            · {enabled.length}/{state.rules.length} פעילים
          </span>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={13} />}
          onClick={() => dispatch({ type: 'OPEN_RULE_EDITOR', ruleId: null })}
        >
          חוק חדש
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {/* AI Logic Insights Panel */}
          <div className="bg-bg-elevated border border-accent/30 rounded-[6px] overflow-hidden">
            <button
              onClick={() => setInsightsOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-panel-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bot size={14} className="text-accent" />
                <span className="text-sm font-semibold text-text">לוגיקת אוטומציה כוללת</span>
                <Badge tone="accent">ניתוח AI</Badge>
              </div>
              <div className="flex items-center gap-3 text-2xs text-text-faint">
                <span>{enabled.length} חוקים פעילים</span>
                {conflicts.length > 0 && (
                  <Badge tone="warn" dot>
                    {conflicts.length} התנגשויות
                  </Badge>
                )}
                {insightsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {insightsOpen && (
              <div className="border-t border-panel-border bg-bg-sunken/30 p-4 flex flex-col gap-4">
                {/* Top KPI line */}
                <div className="grid grid-cols-3 gap-2">
                  <KpiBox
                    label="פעולות אוטומטיות"
                    value={autoCount}
                    hint="ירוצו ללא אישור"
                    tone="warn"
                  />
                  <KpiBox
                    label="ידרשו אישור"
                    value={recommendCount}
                    hint="המלצה למפקד"
                    tone="info"
                  />
                  <KpiBox
                    label="התנגשויות"
                    value={conflicts.length}
                    hint={conflicts.length > 0 ? 'בדוק למטה' : 'אין'}
                    tone={conflicts.length > 0 ? 'danger' : 'neutral'}
                  />
                </div>

                {/* Per-agent load */}
                {Object.keys(agentLoadMap).length > 0 && (
                  <div>
                    <div className="text-2xs text-text-faint uppercase tracking-wider mb-2">
                      עומס לפי סוכן (כמה חוקים מכוונים אליו):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(agentLoadMap)
                        .sort(([, a], [, b]) => b - a)
                        .map(([id, count]) => {
                          const agent = state.agents.find((a) => a.id === id);
                          if (!agent) return null;
                          const Icon = domainIcon[agent.domain];
                          const heavy = count >= 3;
                          return (
                            <div
                              key={id}
                              className={clsx(
                                'inline-flex items-center gap-1.5 px-2 py-1 rounded border text-2xs',
                                heavy
                                  ? 'bg-warn/10 border-warn/40 text-warn'
                                  : 'bg-panel border-panel-border text-text-dim',
                              )}
                            >
                              <Icon size={11} className={domainColor[agent.domain]} />
                              <span className="text-text font-medium">{agent.name.replace('סוכן ', '')}</span>
                              <span className="font-mono">{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Rule-by-rule reasoning */}
                {enabled.length > 0 && (
                  <div>
                    <div className="text-2xs text-text-faint uppercase tracking-wider mb-2">
                      מה יקרה — חוק אחר חוק:
                    </div>
                    <ol className="flex flex-col gap-2">
                      {enabled.map((r, i) => (
                        <li key={r.id} className="flex items-start gap-2.5 text-xs">
                          <span className="w-5 h-5 flex-shrink-0 rounded-full bg-accent/10 border border-accent/40 text-2xs font-mono font-bold text-accent flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-text font-medium">{r.name}</div>
                            <div
                              className="text-2xs text-text-dim leading-relaxed mt-0.5"
                              dangerouslySetInnerHTML={{
                                __html: describeRuleLogic(r, state.agents, state.globalAutonomy).replace(
                                  /\*\*(.+?)\*\*/g,
                                  '<strong class="text-accent">$1</strong>',
                                ),
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Conflicts list */}
                {conflicts.length > 0 && (
                  <div>
                    <div className="text-2xs text-text-faint uppercase tracking-wider mb-2 inline-flex items-center gap-1">
                      <AlertTriangle size={11} className="text-warn" />
                      התנגשויות ושיקולים:
                    </div>
                    <ul className="flex flex-col gap-1.5">
                      {conflicts.map((c, i) => (
                        <li
                          key={i}
                          className={clsx(
                            'flex items-start gap-2 p-2 rounded border text-xs',
                            c.type === 'overload'
                              ? 'bg-warn/5 border-warn/30 text-warn'
                              : 'bg-info/5 border-info/30 text-info',
                          )}
                        >
                          <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                          <span className="text-text leading-relaxed">{c.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Global autonomy reminder */}
                <div className="text-2xs text-text-faint border-t border-panel-border pt-3 inline-flex items-center gap-2">
                  <Activity size={11} />
                  רמת אוטונומיה גלובלית כעת:{' '}
                  <span className="text-accent font-medium">{autonomyLabel[state.globalAutonomy]}</span>
                  <span className="text-text-faint">·</span>
                  <span>שינוי הרמה ב-Header ישפיע מיידית על כל החוקים.</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-text-dim leading-relaxed bg-info/5 border border-info/20 rounded-[6px] px-3.5 py-2.5">
            חוקי אוטומציה מאפשרים תגובה אוטומטית של מערכת ה-AI לאירועים בשטח. כל חוק מגדיר טריגר (מתי) ופעולה (מה לעשות).
            ניתן ליצור חוקים בהגדרה מובנית או בשפה חופשית — ה-AI יפענח את הכוונה.
          </div>

          {state.rules.map((r) => (
            <RuleCard key={r.id} rule={r} />
          ))}
        </div>
      </div>
      <RuleEditor />
    </div>
  );
}

function KpiBox({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: 'warn' | 'info' | 'danger' | 'neutral' }) {
  const c =
    tone === 'warn' ? 'text-warn' : tone === 'info' ? 'text-info' : tone === 'danger' ? 'text-danger' : 'text-text';
  return (
    <div className="bg-bg-elevated border border-panel-border rounded-[5px] p-3">
      <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">{label}</div>
      <div className={clsx('text-2xl font-mono font-bold leading-none', c)}>{value}</div>
      <div className="text-2xs text-text-faint mt-1">{hint}</div>
    </div>
  );
}
