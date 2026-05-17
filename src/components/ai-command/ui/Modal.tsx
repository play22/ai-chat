import clsx from 'clsx';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { IconButton } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' };

export function Modal({ open, onClose, title, children, footer, size = 'md' }: Props) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-sunken/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        className={clsx(
          'relative bg-bg-elevated border border-panel-border rounded-[8px] shadow-2xl w-full flex flex-col max-h-[90vh]',
          sizes[size],
        )}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-panel-border">
          <h2 className="text-sm font-semibold text-text glow-text">{title}</h2>
          <IconButton onClick={onClose} aria-label="סגור">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-panel-border flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerProps extends Omit<Props, 'size'> {
  width?: number;
}

export function Drawer({ open, onClose, title, children, footer, width = 420 }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 animate-fade-in">
      <div className="absolute inset-0 bg-bg-sunken/60 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="absolute top-0 bottom-0 start-0 bg-bg-elevated border-e border-panel-border flex flex-col"
        style={{ width }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-panel-border">
          <h2 className="text-sm font-semibold text-text">{title}</h2>
          <IconButton onClick={onClose} aria-label="סגור">
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-panel-border">{footer}</div>}
      </div>
    </div>
  );
}
