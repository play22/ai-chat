import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { GripVertical } from 'lucide-react';

interface Props {
  /** Called continuously during drag with the new percentage (0-100) representing
   * the position from the LEFT edge of the container in absolute pixels.
   * In RTL layouts where the map is on the left, this percentage equals the map width. */
  onResize: (percentFromLeft: number) => void;
  /** Container rect provider so the handle can compute its position. */
  getContainerRect: () => DOMRect | null;
  /** Reset to default size (double-click). */
  onReset?: () => void;
}

export function ResizeHandle({ onResize, getContainerRect, onReset }: Props) {
  const [dragging, setDragging] = useState(false);
  const handleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      const rect = getContainerRect();
      if (!rect) return;
      const pxFromLeft = e.clientX - rect.left;
      const pct = (pxFromLeft / rect.width) * 100;
      onResize(pct);
    };
    const up = () => setDragging(false);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging, onResize, getContainerRect]);

  return (
    <div
      ref={handleRef}
      onMouseDown={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDoubleClick={() => onReset?.()}
      role="separator"
      aria-orientation="vertical"
      title="גרור לשינוי גודל · קליק כפול לאיפוס"
      className={clsx(
        'relative flex-shrink-0 w-1 group cursor-col-resize bg-panel-border transition-colors',
        'hover:bg-accent/60',
        dragging && '!bg-accent',
      )}
    >
      {/* Wider invisible hit area for easier grabbing */}
      <div className="absolute inset-y-0 -inset-x-1.5" />
      {/* Grip indicator */}
      <div
        className={clsx(
          'absolute top-1/2 -translate-y-1/2 inset-x-0 flex items-center justify-center pointer-events-none',
          'opacity-50 group-hover:opacity-100 transition-opacity',
          dragging && '!opacity-100',
        )}
      >
        <div
          className={clsx(
            'flex items-center justify-center w-4 h-10 -mx-1.5 rounded-[3px] border bg-bg-elevated',
            dragging ? 'border-accent text-accent' : 'border-panel-border text-text-faint group-hover:border-accent/60 group-hover:text-accent',
          )}
        >
          <GripVertical size={11} />
        </div>
      </div>
    </div>
  );
}
