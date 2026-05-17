import clsx from 'clsx';
import type { ReactNode } from 'react';

type Tone = 'accent' | 'warn' | 'danger' | 'critical' | 'info' | 'neutral' | 'success';

const tones: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent border-accent/30',
  success: 'bg-accent/10 text-accent border-accent/30',
  warn: 'bg-warn/10 text-warn border-warn/30',
  danger: 'bg-danger/10 text-danger border-danger/30',
  critical: 'bg-critical/15 text-critical border-critical/50',
  info: 'bg-info/10 text-info border-info/30',
  neutral: 'bg-panel-hover text-text-dim border-panel-border',
};

interface Props {
  tone?: Tone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export function Badge({ tone = 'neutral', children, dot, pulse, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-2xs font-medium rounded-[4px] border whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full',
            tone === 'accent' || tone === 'success' ? 'bg-accent' : '',
            tone === 'warn' ? 'bg-warn' : '',
            tone === 'danger' ? 'bg-danger' : '',
            tone === 'critical' ? 'bg-critical' : '',
            tone === 'info' ? 'bg-info' : '',
            tone === 'neutral' ? 'bg-text-dim' : '',
            pulse && 'animate-pulse-dot',
          )}
        />
      )}
      {children}
    </span>
  );
}
