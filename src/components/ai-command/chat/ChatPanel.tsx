import { useEffect, useRef, useState } from 'react';
import { useAICommand } from '../../../state/AICommandContext';
import { Message } from './Message';
import { ChatInput } from './ChatInput';
import { Terminal, RotateCcw, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';

export function ChatPanel() {
  const { state, dispatch, sendUserMessage } = useAICommand();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [summaryMenuOpen, setSummaryMenuOpen] = useState(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [state.messages.length]);

  const requestSummary = (hours: number) => {
    setSummaryMenuOpen(false);
    sendUserMessage(`סכם את ${hours} השעות האחרונות`);
  };

  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2 min-w-0">
          <Terminal size={14} className="text-accent flex-shrink-0" />
          <span className="text-sm font-medium text-text truncate">שיחה פעילה</span>
          <span className="text-2xs text-text-faint font-mono whitespace-nowrap">
            · {state.messages.filter((m) => !m.pending).length} הודעות
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="relative">
            <Button
              variant="subtle"
              size="xs"
              icon={<FileText size={12} />}
              iconEnd={<ChevronDown size={11} className={summaryMenuOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />}
              onClick={() => setSummaryMenuOpen((v) => !v)}
              title="הפק תקציר תקופה"
            >
              תקציר
            </Button>
            {summaryMenuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setSummaryMenuOpen(false)} />
                <div className="absolute end-0 top-full mt-1 z-30 w-44 bg-bg-elevated border border-panel-border rounded-[6px] shadow-2xl p-1 animate-fade-in">
                  <div className="text-2xs text-text-faint uppercase tracking-wider px-2 py-1.5 border-b border-panel-border mb-1">
                    טווח זמן
                  </div>
                  {[
                    { h: 1, label: 'שעה אחרונה' },
                    { h: 6, label: '6 שעות אחרונות' },
                    { h: 12, label: '12 שעות אחרונות' },
                    { h: 24, label: 'יממה אחרונה' },
                    { h: 72, label: '3 ימים אחרונים' },
                  ].map((o) => (
                    <button
                      key={o.h}
                      onClick={() => requestSummary(o.h)}
                      className="w-full text-start px-2 py-1.5 text-xs text-text hover:bg-panel-hover hover:text-accent rounded transition-colors flex items-center justify-between"
                    >
                      <span>{o.label}</span>
                      <span className="text-2xs text-text-faint font-mono">{o.h}h</span>
                    </button>
                  ))}
                </div>
              </>
            )}
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
