import clsx from 'clsx';
import { MessageSquareText, Users, Workflow, History, ChevronsLeft, Radar, ListTodo, GanttChartSquare } from 'lucide-react';
import { useAICommand } from '../../../state/AICommandContext';
import type { PanelTab } from '../../../state/types';

interface NavItem {
  id: PanelTab;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function Sidebar() {
  const { state, dispatch } = useAICommand();

  const items: NavItem[] = [
    { id: 'chat', label: 'שיחה', icon: <MessageSquareText size={16} /> },
    {
      id: 'agents',
      label: 'סוכנים',
      icon: <Users size={16} />,
      badge: state.agents.filter((a) => a.status === 'active').length,
    },
    {
      id: 'tasks',
      label: 'משימות',
      icon: <ListTodo size={16} />,
      badge: state.tasks.filter((t) => t.status === 'in_progress').length,
    },
    {
      id: 'timeline',
      label: 'ציר זמן',
      icon: <GanttChartSquare size={16} />,
    },
    {
      id: 'automation',
      label: 'אוטומציה',
      icon: <Workflow size={16} />,
      badge: state.rules.filter((r) => r.enabled).length,
    },
    { id: 'history', label: 'היסטוריה', icon: <History size={16} /> },
  ];

  return (
    <aside className="w-[68px] bg-bg-elevated border-e border-panel-border flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="w-10 h-10 rounded-[6px] bg-accent/10 border border-accent/40 flex items-center justify-center mb-3 shadow-glow-accent">
        <Radar size={18} className="text-accent" />
      </div>
      {items.map((it) => {
        const active = state.activeTab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => dispatch({ type: 'SET_TAB', tab: it.id })}
            className={clsx(
              'relative w-12 h-12 rounded-[6px] flex flex-col items-center justify-center gap-0.5 transition-all',
              active
                ? 'bg-accent/10 text-accent border border-accent/40'
                : 'text-text-dim hover:bg-panel-hover hover:text-text border border-transparent',
            )}
            title={it.label}
          >
            {it.icon}
            <span className="text-[9px] font-medium">{it.label}</span>
            {active && <span className="absolute end-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-accent rounded-l" />}
            {it.badge !== undefined && it.badge > 0 && (
              <span className="absolute top-1 start-1 min-w-[16px] h-4 px-1 text-[9px] font-mono font-bold bg-accent text-bg-sunken rounded-full flex items-center justify-center">
                {it.badge}
              </span>
            )}
          </button>
        );
      })}
      <div className="flex-1" />
      <button
        className="w-12 h-12 rounded-[6px] flex items-center justify-center text-text-faint hover:bg-panel-hover hover:text-text transition-colors"
        title="כווץ"
      >
        <ChevronsLeft size={16} />
      </button>
    </aside>
  );
}
