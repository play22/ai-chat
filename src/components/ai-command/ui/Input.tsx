import clsx from 'clsx';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, ...rest }: InputProps) {
  return (
    <label className="flex flex-col gap-1">
      {label && <span className="text-2xs text-text-dim uppercase tracking-wider">{label}</span>}
      <input
        {...rest}
        className={clsx(
          'bg-bg-sunken border border-panel-border text-text rounded-[5px] px-3 h-9 text-sm',
          'placeholder:text-text-faint focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40',
          'transition-colors',
          className,
        )}
      />
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Textarea({ label, className, ...rest }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1 w-full">
      {label && <span className="text-2xs text-text-dim uppercase tracking-wider">{label}</span>}
      <textarea
        {...rest}
        className={clsx(
          'bg-bg-sunken border border-panel-border text-text rounded-[5px] px-3 py-2 text-sm resize-none',
          'placeholder:text-text-faint focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/40',
          'transition-colors leading-relaxed',
          className,
        )}
      />
    </label>
  );
}
