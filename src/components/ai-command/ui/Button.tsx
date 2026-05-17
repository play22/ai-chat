import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle' | 'outline';
type Size = 'xs' | 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconEnd?: ReactNode;
  active?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-bg-sunken hover:shadow-glow-accent border border-accent/60 font-medium',
  ghost:
    'bg-transparent text-text hover:bg-panel-hover border border-transparent',
  danger:
    'bg-danger/10 text-danger hover:bg-danger/20 border border-danger/40',
  subtle:
    'bg-panel text-text hover:bg-panel-hover border border-panel-border',
  outline:
    'bg-transparent text-text hover:bg-panel-hover border border-panel-border',
};

const sizes: Record<Size, string> = {
  xs: 'h-6 px-2 text-2xs gap-1 rounded-[4px]',
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-[5px]',
  md: 'h-9 px-4 text-sm gap-2 rounded-[6px]',
};

export function Button({
  variant = 'subtle',
  size = 'sm',
  icon,
  iconEnd,
  active,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center transition-all whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        active && 'ring-1 ring-accent',
        className,
      )}
    >
      {icon}
      {children}
      {iconEnd}
    </button>
  );
}

export function IconButton({
  size = 'sm',
  variant = 'ghost',
  className,
  ...rest
}: Omit<Props, 'icon' | 'iconEnd'>) {
  const dim = size === 'xs' ? 'h-6 w-6' : size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';
  return (
    <button
      {...rest}
      className={clsx(
        'inline-flex items-center justify-center rounded-[5px] transition-all disabled:opacity-40',
        variants[variant],
        dim,
        className,
      )}
    />
  );
}
