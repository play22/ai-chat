import clsx from 'clsx';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: Props) {
  return (
    <label className={clsx('inline-flex items-center gap-2 cursor-pointer', disabled && 'opacity-40 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative w-9 h-5 rounded-full border transition-colors flex-shrink-0',
          checked ? 'bg-accent/30 border-accent/60' : 'bg-panel border-panel-border',
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all',
            checked ? 'bg-accent end-0.5 shadow-glow-accent' : 'bg-text-dim end-[18px]',
          )}
        />
      </button>
      {label && <span className="text-xs text-text">{label}</span>}
    </label>
  );
}
