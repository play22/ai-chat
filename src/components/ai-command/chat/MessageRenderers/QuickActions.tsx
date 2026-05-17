import { Zap } from 'lucide-react';
import type { QuickActionsBlock } from '../../../../state/types';
import { useAICommand } from '../../../../state/AICommandContext';

export function QuickActionsRenderer({ block }: { block: QuickActionsBlock }) {
  const { sendUserMessage } = useAICommand();
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="inline-flex items-center gap-1 text-2xs text-text-faint uppercase tracking-wider">
        <Zap size={11} /> פעולות מהירות
      </span>
      {block.actions.map((a, i) => (
        <button
          key={i}
          onClick={() => sendUserMessage(a.prompt)}
          className="inline-flex items-center gap-1.5 px-2.5 h-7 text-xs bg-panel border border-panel-border rounded-full text-text-dim hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
