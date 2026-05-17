import clsx from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  glow?: boolean;
}

export function Card({ className, interactive, glow, children, ...rest }: Props) {
  return (
    <div
      {...rest}
      className={clsx(
        'bg-panel border border-panel-border rounded-[6px] shadow-panel',
        interactive && 'hover:bg-panel-hover hover:border-accent/30 cursor-pointer transition-colors',
        glow && 'shadow-glow-accent',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, action }: { children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div className={clsx('flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-panel-border', className)}>
      <div className="flex items-center gap-2 min-w-0">{children}</div>
      {action && <div className="flex items-center gap-1">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('p-3.5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between gap-2 px-3.5 py-2.5 border-t border-panel-border', className)}>
      {children}
    </div>
  );
}
