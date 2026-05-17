import { useEffect, useRef } from 'react';
import { useAICommand } from '../../../state/AICommandContext';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { Terminal, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

export function ChatPanel() {
  const { state, dispatch } = useAICommand();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length]);

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-accent" />
          <span className="text-sm font-medium text-text">שיחה פעילה</span>
          <span className="text-2xs text-text-faint font-mono">
            · {state.messages.filter((m) => !m.pending).length} הודעות
          </span>
        </div>
        <Button
          variant="ghost"
          size="xs"
          icon={<RotateCcw size={12} />}
          onClick={() => dispatch({ type: 'CLEAR_MESSAGES' })}
        >
          איפוס
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {state.messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
        </div>
      </div>

      <ChatInput />
    </div>
  );
}
