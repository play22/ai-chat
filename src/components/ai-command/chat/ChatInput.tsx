import { useRef, useState } from 'react';
import { Send, MapPin, Image as ImageIcon, Target, Paperclip, X } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import { Button, IconButton } from '../ui/Button';
import type { ImageAttachment, EntityRefAttachment } from '../../../state/types';

export function ChatInput() {
  const { state, dispatch, sendUserMessage, toast } = useAICommand();
  const [text, setText] = useState('');
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const send = async () => {
    if (!text.trim() && state.pendingAttachments.length === 0) return;
    const t = text;
    setText('');
    await sendUserMessage(t);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const attachArea = () => dispatch({ type: 'OPEN_MAP_PICKER', purpose: 'attach_area' });

  const attachImage = () => {
    const att: ImageAttachment = {
      kind: 'image',
      id: `att-${Date.now()}`,
      label: `תמונה ${state.pendingAttachments.length + 1}`,
    };
    dispatch({ type: 'ADD_PENDING_ATTACHMENT', attachment: att });
    toast('תמונה צורפה', 'info');
  };

  const attachEntity = (entityId: string, label: string) => {
    const att: EntityRefAttachment = {
      kind: 'entity',
      id: `att-${Date.now()}`,
      entityId,
      label,
    };
    dispatch({ type: 'ADD_PENDING_ATTACHMENT', attachment: att });
    setShowEntityPicker(false);
    toast('הישות צורפה', 'info');
  };

  return (
    <div className="border-t border-panel-border bg-bg-elevated">
      {/* Pending attachments */}
      {state.pendingAttachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2 border-b border-panel-border/50">
          {state.pendingAttachments.map((a) => {
            const icon = a.kind === 'area' ? <MapPin size={11} /> : a.kind === 'image' ? <ImageIcon size={11} /> : <Target size={11} />;
            return (
              <span
                key={a.id}
                className="inline-flex items-center gap-1.5 px-2 py-1 text-2xs bg-accent/10 border border-accent/30 rounded text-accent"
              >
                {icon}
                {a.label}
                <button
                  onClick={() => dispatch({ type: 'REMOVE_PENDING_ATTACHMENT', id: a.id })}
                  className="hover:bg-accent/20 rounded p-0.5"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="p-3 flex items-end gap-2">
        <div className="flex flex-col gap-1">
          <IconButton onClick={attachArea} aria-label="צרף תיחום" title="צרף תיחום מהמפה">
            <MapPin size={15} />
          </IconButton>
          <IconButton onClick={attachImage} aria-label="צרף תמונה" title="צרף תמונה">
            <ImageIcon size={15} />
          </IconButton>
          <div className="relative">
            <IconButton onClick={() => setShowEntityPicker((v) => !v)} aria-label="צרף ישות" title="צרף ישות">
              <Target size={15} />
            </IconButton>
            {showEntityPicker && (
              <div className="absolute bottom-full mb-2 start-0 w-56 bg-bg-elevated border border-panel-border rounded-[6px] shadow-2xl p-1 max-h-64 overflow-auto z-20">
                <div className="text-2xs text-text-faint uppercase tracking-wider px-2 py-1.5 border-b border-panel-border mb-1">
                  בחר ישות לצירוף
                </div>
                {state.entities.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => attachEntity(e.id, e.label)}
                    className="w-full text-start px-2 py-1.5 text-xs text-text hover:bg-panel-hover rounded transition-colors flex items-center justify-between"
                  >
                    <span>{e.label}</span>
                    <span className="text-2xs text-text-faint">{e.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <textarea
          ref={taRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="שאל את מרכז ה-AI... (Enter לשליחה · Shift+Enter לשורה חדשה)"
          rows={2}
          className="flex-1 bg-bg-sunken border border-panel-border text-text text-sm rounded-[6px] px-3 py-2 resize-none placeholder:text-text-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/40 leading-relaxed min-h-[60px] max-h-32"
        />

        <Button
          variant="primary"
          size="md"
          icon={<Send size={15} />}
          onClick={send}
          disabled={!text.trim() && state.pendingAttachments.length === 0}
        >
          שלח
        </Button>
      </div>
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-2xs text-text-faint">
          <Paperclip size={10} />
          {state.pendingAttachments.length > 0
            ? `${state.pendingAttachments.length} צירופים`
            : 'אפשר לצרף תיחום מפה, תמונה, או ישות'}
        </div>
        <div className="text-2xs text-text-faint font-mono">
          autonomy: <span className="text-accent">{state.globalAutonomy}</span>
        </div>
      </div>
    </div>
  );
}
