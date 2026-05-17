import { Bell, Map, Maximize2, Minimize2, Square, Sparkles, Cpu, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { Select } from '../ui/Select';
import { IconButton } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { autonomyLabel } from '../shared';
import type { ViewMode } from '../../../state/types';

export function Header() {
  const { state, dispatch } = useAICommand();

  const setMode = (m: ViewMode) => dispatch({ type: 'SET_VIEW_MODE', mode: m });

  return (
    <header className="h-12 bg-bg-elevated border-b border-panel-border px-4 flex items-center gap-4 flex-shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-2.5">
        <Cpu size={16} className="text-accent" />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold text-text glow-text">מרכז פיקוד AI</span>
          <span className="text-[9px] text-text-faint font-mono tracking-wider">C4I · AI COMMAND CENTER</span>
        </div>
      </div>

      <div className="h-6 w-px bg-panel-border" />

      <div className="flex items-center gap-2">
        <Badge tone="success" dot pulse>
          ONLINE
        </Badge>
        <span className="text-2xs text-text-faint font-mono">v2.4.1 · classified</span>
      </div>

      <div className="flex-1" />

      {/* View mode */}
      <div className="flex items-center gap-1 bg-bg-sunken border border-panel-border rounded-[5px] p-0.5">
        <button
          onClick={() => setMode('compact')}
          className={clsx(
            'h-7 px-2 rounded-[3px] text-2xs inline-flex items-center gap-1 transition-colors',
            state.viewMode === 'compact' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
          )}
          title="תצוגה דחוסה"
        >
          <Minimize2 size={11} /> דחוס
        </button>
        <button
          onClick={() => setMode('standard')}
          className={clsx(
            'h-7 px-2 rounded-[3px] text-2xs inline-flex items-center gap-1 transition-colors',
            state.viewMode === 'standard' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
          )}
          title="תצוגה רגילה"
        >
          <Square size={11} /> רגיל
        </button>
        <button
          onClick={() => setMode('expanded')}
          className={clsx(
            'h-7 px-2 rounded-[3px] text-2xs inline-flex items-center gap-1 transition-colors',
            state.viewMode === 'expanded' ? 'bg-accent/15 text-accent' : 'text-text-dim hover:text-text',
          )}
          title="תצוגה מורחבת + מפה"
        >
          <Maximize2 size={11} /> מורחב
        </button>
      </div>

      {/* Map toggle (when not in expanded) */}
      {state.viewMode !== 'expanded' && (
        <IconButton
          active={state.mapVisible}
          onClick={() => dispatch({ type: 'TOGGLE_MAP_VISIBLE' })}
          title="הצג/הסתר מפה"
        >
          <Map size={15} />
        </IconButton>
      )}

      {/* Autonomy selector */}
      <div className="flex items-center gap-2 bg-bg-sunken border border-panel-border rounded-[5px] ps-2.5 pe-1 h-8">
        <Sparkles size={12} className="text-accent" />
        <span className="text-2xs text-text-faint">אוטונומיה:</span>
        <Select
          value={state.globalAutonomy}
          onChange={(e) => dispatch({ type: 'SET_GLOBAL_AUTONOMY', level: e.target.value as any })}
          options={[
            { value: 'observe', label: autonomyLabel.observe },
            { value: 'recommend', label: autonomyLabel.recommend },
            { value: 'autonomous', label: autonomyLabel.autonomous },
          ]}
          className="!min-w-0"
        />
      </div>

      <IconButton
        onClick={() => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' })}
        title={state.theme === 'dark' ? 'מצב בהיר' : 'מצב כהה'}
        aria-label="החלף נושא"
      >
        {state.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </IconButton>
      <IconButton title="התרעות">
        <Bell size={15} />
      </IconButton>
      <div className="flex items-center gap-2 ps-2 border-s border-panel-border">
        <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-2xs font-bold text-accent">
          מ
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs text-text">מפקד שטח</span>
          <span className="text-[9px] text-text-faint font-mono">CMD-001</span>
        </div>
      </div>
    </header>
  );
}
