import { Plus, Workflow } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Button } from '../ui/Button';
import { RuleCard } from './RuleCard';
import { RuleEditor } from './RuleEditor';

export function AutomationPanel() {
  const { state, dispatch } = useAICommand();
  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <Workflow size={14} className="text-accent" />
          <span className="text-sm font-medium text-text">חוקי אוטומציה</span>
          <span className="text-2xs text-text-faint font-mono">
            · {state.rules.filter((r) => r.enabled).length}/{state.rules.length} פעילים
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
          <div className="text-xs text-text-dim leading-relaxed bg-info/5 border border-info/20 rounded-[6px] px-3.5 py-2.5">
            חוקי אוטומציה מאפשרים תגובה אוטומטית של מערכת ה-AI לאירועים בשטח. כל חוק מגדיר טריגר (מתי) ופעולה (מה לעשות).
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
