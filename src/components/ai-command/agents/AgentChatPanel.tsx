import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Send, RotateCcw, MessageSquareText, Sparkles } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Button, IconButton } from '../ui/Button';
import { Message } from '../chat/Message';
import { domainIcon, domainColor, domainHex } from '../shared';

interface Props {
  agentId: string;
}

export function AgentChatPanel({ agentId }: Props) {
  const { state, dispatch, sendAgentMessage } = useAICommand();
  const agent = state.agents.find((a) => a.id === agentId);
  const messages = state.agentChats[agentId] ?? [];
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  if (!agent) return null;
  const Icon = domainIcon[agent.domain];
  const sig = agent.config?.style.signature ?? agent.name;

  const suggestions = [
    'מה המצב שלך?',
    'אילו משימות פתוחות?',
    'מי כפוף אליי?',
    'יש לך המלצה לפעולה?',
  ];

  const send = async () => {
    if (!text.trim()) return;
    const t = text;
    setText('');
    await sendAgentMessage(agentId, t);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const empty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Banner */}
      <div
        className="flex items-center gap-2 px-3 py-2 border-b border-panel-border text-2xs"
        style={{ backgroundColor: domainHex[agent.domain] + '10' }}
      >
        <Sparkles size={11} style={{ color: domainHex[agent.domain] }} />
        <span className="text-text-dim">שיחה ישירה עם</span>
        <span className="font-semibold" style={{ color: domainHex[agent.domain] }}>
          {sig}
        </span>
        <span className="text-text-faint">·</span>
        <span className="text-text-faint">תשובות בסגנון הסוכן וביכולותיו</span>
        {messages.length > 0 && (
          <IconButton
            size="xs"
            className="ms-auto"
            onClick={() => dispatch({ type: 'CLEAR_AGENT_MESSAGES', agentId })}
            title="איפוס שיחה"
          >
            <RotateCcw size={11} />
          </IconButton>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        {empty ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: domainHex[agent.domain] + '66', backgroundColor: domainHex[agent.domain] + '14' }}
            >
              <Icon size={22} className={domainColor[agent.domain]} />
            </div>
            <div className="text-sm font-medium text-text">פתח שיחה ישירה עם {sig}</div>
            <div className="text-2xs text-text-dim leading-relaxed max-w-[280px]">
              הסוכן יענה בסגנון התקשורת שמוגדר לו ויהיה מודע למשימות, יחידות, וכלים שלו.
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-[280px] mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendAgentMessage(agentId, s)}
                  className="text-2xs px-3 h-7 rounded-full border border-panel-border text-text-dim hover:text-accent hover:border-accent/40 hover:bg-accent/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-panel-border bg-bg-elevated p-2 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder={`שאל את ${sig}...`}
          rows={2}
          className="flex-1 bg-bg-sunken border border-panel-border text-text text-xs rounded-[5px] px-2.5 py-1.5 resize-none placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 leading-relaxed min-h-[44px] max-h-24"
        />
        <Button variant="primary" size="sm" icon={<Send size={13} />} onClick={send} disabled={!text.trim()}>
          שלח
        </Button>
      </div>
    </div>
  );
}
