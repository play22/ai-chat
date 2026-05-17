import { useState } from 'react';
import { History, Search, MessageSquare, Clock } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Card, CardBody } from '../ui/Card';
import { formatRelative } from '../shared';

export function HistoryPanel() {
  const { state, toast, dispatch } = useAICommand();
  const [q, setQ] = useState('');
  const filtered = state.conversations.filter(
    (c) => !q || c.title.includes(q) || c.preview.includes(q),
  );
  return (
    <div className="flex flex-col h-full bg-bg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-panel-border bg-bg-elevated">
        <div className="flex items-center gap-2">
          <History size={14} className="text-accent" />
          <span className="text-sm font-medium text-text">היסטוריית שיחות</span>
          <span className="text-2xs text-text-faint font-mono">· {state.conversations.length} שיחות</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש..."
            className="bg-bg-sunken border border-panel-border text-text text-xs rounded-[5px] h-8 ps-3 pe-8 w-56 placeholder:text-text-faint focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {filtered.map((c) => (
            <Card
              key={c.id}
              interactive
              onClick={() => {
                toast(`נטענת שיחה: ${c.title}`, 'info');
                dispatch({ type: 'SET_TAB', tab: 'chat' });
              }}
            >
              <CardBody className="flex items-start gap-3 !py-3">
                <div className="w-8 h-8 rounded-[5px] bg-bg-sunken border border-panel-border flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={14} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <h3 className="text-sm font-medium text-text truncate">{c.title}</h3>
                    <span className="text-2xs text-text-faint font-mono whitespace-nowrap inline-flex items-center gap-1">
                      <Clock size={10} />
                      {formatRelative(c.startedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-text-dim line-clamp-1">{c.preview}</p>
                  <div className="text-2xs text-text-faint mt-1 font-mono">{c.messageCount} הודעות</div>
                </div>
              </CardBody>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-xs text-text-faint text-center py-12">לא נמצאו שיחות התואמות לחיפוש</div>
          )}
        </div>
      </div>
    </div>
  );
}
