import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { domainIcon, domainColor } from '../shared';

export function MapAgentLegend() {
  const { state, dispatch } = useAICommand();

  const agentZones = state.agents
    .map((agent) => {
      const tasks = state.tasks.filter(
        (t) =>
          t.agentId === agent.id &&
          (t.status === 'in_progress' || t.status === 'planned' || t.status === 'pending') &&
          t.geo,
      );
      const labels = Array.from(new Set(tasks.map((t) => t.geo!.label)));
      return { agent, tasks, labels };
    })
    .filter((x) => x.labels.length > 0);

  if (agentZones.length === 0) return null;

  const highlighted = state.highlightAgentId;

  return (
    <div className="border-t border-panel-border bg-bg-elevated px-3 py-2 flex flex-col gap-1.5 max-h-32 overflow-y-auto">
      <div className="text-2xs text-text-faint uppercase tracking-wider font-medium flex items-center justify-between">
        <span>אזורי פעילות סוכנים</span>
        {highlighted && (
          <button
            onClick={() => dispatch({ type: 'HIGHLIGHT_AGENT', agentId: null })}
            className="text-accent hover:underline normal-case tracking-normal"
          >
            נקה סינון
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {agentZones.map(({ agent, labels, tasks }) => {
          const Icon = domainIcon[agent.domain];
          const active = highlighted === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() =>
                dispatch({
                  type: 'HIGHLIGHT_AGENT',
                  agentId: highlighted === agent.id ? null : agent.id,
                })
              }
              className={clsx(
                'inline-flex items-center gap-1.5 px-2 py-1 rounded border text-2xs transition-all',
                active
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-panel border-panel-border text-text-dim hover:text-text hover:border-accent/30',
              )}
            >
              <Icon size={11} className={active ? 'text-accent' : domainColor[agent.domain]} />
              <span className="font-medium text-text">{agent.name}</span>
              <span className="font-mono opacity-70">{tasks.length}</span>
              <span className="text-text-faint">·</span>
              <span className="truncate max-w-[200px]">{labels.join(' · ')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
