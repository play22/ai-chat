import clsx from 'clsx';
import { Bot, User, Image as ImageIcon, MapPin, Target } from 'lucide-react';
import type { ChatMessage, Attachment } from '../../../state/types';
import { TextBlock } from './MessageRenderers/TextBlock';
import { TableBlock } from './MessageRenderers/TableBlock';
import { ActionCardRenderer } from './MessageRenderers/ActionCard';
import { EntitySuggestionRenderer } from './MessageRenderers/EntitySuggestion';
import { QuickActionsRenderer } from './MessageRenderers/QuickActions';
import { PlanProposalRenderer } from './MessageRenderers/PlanProposal';
import { Badge } from '../ui/Badge';
import { autonomyLabel, autonomyTone, formatTime } from '../shared';

function AttachmentChip({ a }: { a: Attachment }) {
  const icon = a.kind === 'area' ? <MapPin size={11} /> : a.kind === 'image' ? <ImageIcon size={11} /> : <Target size={11} />;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs bg-panel border border-panel-border rounded text-text-dim">
      {icon}
      {a.label}
    </span>
  );
}

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex gap-3 animate-fade-in', isUser && 'flex-row-reverse')}>
      <div
        className={clsx(
          'flex-shrink-0 w-7 h-7 rounded-full border flex items-center justify-center',
          isUser ? 'bg-panel border-panel-border' : 'bg-accent/10 border-accent/40',
        )}
      >
        {isUser ? <User size={14} className="text-text-dim" /> : <Bot size={14} className="text-accent" />}
      </div>
      <div className={clsx('flex-1 min-w-0 flex flex-col gap-2', isUser ? 'items-end' : 'items-start')}>
        <div className={clsx('flex items-center gap-2', isUser && 'flex-row-reverse')}>
          <span className="text-2xs text-text-faint">{isUser ? 'מפקד' : 'מרכז AI'}</span>
          <span className="text-2xs text-text-faint font-mono">{formatTime(message.timestamp)}</span>
          {!isUser && message.autonomy && (
            <Badge tone={autonomyTone[message.autonomy]}>{autonomyLabel[message.autonomy]}</Badge>
          )}
        </div>

        {message.pending ? (
          <div className="bg-panel border border-panel-border rounded-[6px] px-3.5 py-2.5 flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: '400ms' }} />
            </div>
            <span className="text-xs text-text-dim">מנתח...</span>
          </div>
        ) : (
          <div className={clsx('flex flex-col gap-3 w-full', isUser && 'items-end')}>
            {isUser && message.text && (
              <div className="bg-accent/10 border border-accent/30 rounded-[6px] px-3.5 py-2.5 max-w-[85%]">
                <p className="text-sm text-text whitespace-pre-wrap">{message.text}</p>
              </div>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className={clsx('flex flex-wrap gap-1.5', isUser && 'justify-end')}>
                {message.attachments.map((a) => (
                  <AttachmentChip key={a.id} a={a} />
                ))}
              </div>
            )}
            {!isUser &&
              message.blocks?.map((block, i) => {
                if (block.kind === 'text') return <TextBlock key={i} block={block} />;
                if (block.kind === 'table') return <TableBlock key={i} block={block} />;
                if (block.kind === 'action_card') return <ActionCardRenderer key={i} block={block} />;
                if (block.kind === 'entity_suggestion') return <EntitySuggestionRenderer key={i} block={block} />;
                if (block.kind === 'quick_actions') return <QuickActionsRenderer key={i} block={block} />;
                if (block.kind === 'plan_proposal') return <PlanProposalRenderer key={i} block={block} />;
                return null;
              })}
          </div>
        )}
      </div>
    </div>
  );
}
