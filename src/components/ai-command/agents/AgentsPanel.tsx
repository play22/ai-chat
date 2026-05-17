import { useAICommand } from '../../../state/AICommandContext';
import { AgentCard } from './AgentCard';
import { Users } from 'lucide-react';
import { useContainerWidth } from '../useContainerWidth';

export function AgentsPanel() {
  const { state } = useAICommand();
  const [ref, w] = useContainerWidth<HTMLDivElement>();
  const cols = w >= 1100 ? 3 : w >= 620 ? 2 : 1;

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={14} className="text-accent flex-shrink-0" />
          <span className="text-sm font-medium text-text truncate">סוכני AI</span>
          <span className="text-2xs text-text-faint font-mono whitespace-nowrap">
            · {state.agents.filter((a) => a.status === 'active').length}/{state.agents.length} פעילים
          </span>
        </div>
        <div className="text-2xs text-text-dim whitespace-nowrap hidden sm:block">
          סה"כ משימות פתוחות: <span className="text-text font-mono">{state.agents.reduce((s, a) => s + a.activeTasks, 0)}</span>
        </div>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto p-4">
        <div
          className="grid gap-3 max-w-6xl mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {state.agents.map((a) => (
            <AgentCard key={a.id} agent={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
