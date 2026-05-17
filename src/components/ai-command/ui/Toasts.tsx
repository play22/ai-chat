import clsx from 'clsx';
import { CheckCircle2, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';

const icons = {
  success: <CheckCircle2 size={16} className="text-accent" />,
  info: <Info size={16} className="text-info" />,
  warn: <AlertTriangle size={16} className="text-warn" />,
  danger: <AlertOctagon size={16} className="text-danger" />,
};

const borders = {
  success: 'border-accent/40',
  info: 'border-info/40',
  warn: 'border-warn/40',
  danger: 'border-danger/40',
};

export function Toasts() {
  const { state } = useAICommand();
  if (!state.toasts.length) return null;
  return (
    <div className="fixed bottom-4 end-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={clsx(
            'pointer-events-auto bg-bg-elevated border rounded-[6px] px-3.5 py-2.5 shadow-2xl',
            'flex items-center gap-2.5 min-w-[260px] animate-slide-in-right',
            borders[t.variant],
          )}
        >
          {icons[t.variant]}
          <span className="text-xs text-text leading-relaxed">{t.text}</span>
        </div>
      ))}
    </div>
  );
}
