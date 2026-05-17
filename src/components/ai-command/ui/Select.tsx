import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import type { SelectHTMLAttributes } from 'react';

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: { value: string; label: string }[];
  size?: 'sm' | 'md';
  label?: string;
}

export function Select({ options, size = 'sm', label, className, ...rest }: Props) {
  const h = size === 'sm' ? 'h-8 text-xs' : 'h-9 text-sm';
  return (
    <label className="inline-flex flex-col gap-1">
      {label && <span className="text-2xs text-text-dim uppercase tracking-wider">{label}</span>}
      <div className={clsx('relative inline-flex items-center', className)}>
        <select
          {...rest}
          className={clsx(
            'appearance-none bg-panel border border-panel-border text-text rounded-[5px]',
            'ps-3 pe-8 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40',
            'transition-colors cursor-pointer min-w-[140px]',
            h,
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-panel">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute end-2 pointer-events-none text-text-dim" />
      </div>
    </label>
  );
}
