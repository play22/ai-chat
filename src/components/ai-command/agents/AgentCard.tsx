import { Activity, ListTodo, Settings, MapPin } from 'lucide-react';
import clsx from 'clsx';
import type { Agent, AutonomyLevel } from '../../../state/types';
import { Card, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { domainIcon, domainColor, domainHex, statusLabel, statusTone, autonomyLabel, formatRelative } from '../shared';
import { useAICommand } from '../../../state/AICommandContext';

export function AgentCard({ agent }: { agent: Agent }) {
  const { state, dispatch, toast } = useAICommand();
  const Icon = domainIcon[agent.domain];

  const geoTasks = state.tasks.filter(
    (t) =>
      t.agentId === agent.id &&
      (t.status === 'in_progress' || t.status === 'planned' || t.status === 'pending') &&
      t.geo,
  );
  const zones = Array.from(new Set(geoTasks.map((t) => t.geo!.label)));

  const showOnMap = () => {
    dispatch({ type: 'SET_MAP_VISIBLE', visible: true });
    dispatch({ type: 'HIGHLIGHT_AGENT', agentId: agent.id });
    toast(`מציג אזורי פעילות של ${agent.name} במפה`, 'info');
  };

  return (
    <Card className="overflow-hidden hover:border-accent/30 transition-colors">
      <CardBody className="!p-0">
        <div className="p-4 flex items-start gap-3">
          <div className={clsx('w-10 h-10 rounded-[6px] flex items-center justify-center bg-bg-sunken border border-panel-border')}>
            <Icon size={20} className={domainColor[agent.domain]} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-text truncate">{agent.name}</h3>
              <Badge tone={statusTone[agent.status]} dot pulse={agent.status === 'active'}>
                {statusLabel[agent.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-2xs text-text-faint">
              <span className="inline-flex items-center gap-1">
                <Activity size={10} /> {formatRelative(agent.lastActivity)}
              </span>
              <span className="font-mono">הצלחה: {Math.round(agent.successRate * 100)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-panel-border/60">
          <div className="bg-bg-elevated p-3">
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">משימות פעילות</div>
            <div className="text-2xl font-mono font-bold text-accent leading-none">{agent.activeTasks}</div>
          </div>
          <div className="bg-bg-elevated p-3">
            <div className="text-2xs text-text-faint uppercase tracking-wider mb-1">רמת אוטונומיה</div>
            <Select
              size="sm"
              value={agent.autonomy}
              onChange={(e) =>
                dispatch({
                  type: 'SET_AGENT_AUTONOMY',
                  agentId: agent.id,
                  level: e.target.value as AutonomyLevel,
                })
              }
              options={[
                { value: 'observe', label: autonomyLabel.observe },
                { value: 'recommend', label: autonomyLabel.recommend },
                { value: 'autonomous', label: autonomyLabel.autonomous },
              ]}
              className="w-full"
            />
          </div>
        </div>

        {zones.length > 0 && (
          <div className="px-3 py-2 border-t border-panel-border bg-bg-elevated/40">
            <div className="flex items-center gap-1.5 text-2xs text-text-faint uppercase tracking-wider mb-1.5">
              <MapPin size={10} className="text-accent" />
              <span>פעיל באזורים</span>
              <span className="font-mono">· {zones.length}</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {zones.map((z) => (
                <span
                  key={z}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-2xs rounded bg-panel border border-panel-border text-text"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: domainHex[agent.domain] }}
                  />
                  {z}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 flex items-center gap-2 border-t border-panel-border">
          <Button
            variant="subtle"
            size="sm"
            icon={<ListTodo size={13} />}
            onClick={() => dispatch({ type: 'SELECT_AGENT', agentId: agent.id })}
            className="flex-1"
          >
            פתח משימות
          </Button>
          {zones.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<MapPin size={13} />}
              onClick={showOnMap}
              title="הצג במפה"
              aria-label="הצג במפה"
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Settings size={13} />}
            onClick={() => dispatch({ type: 'OPEN_AGENT_SETTINGS', agentId: agent.id })}
            title="הגדרות סוכן"
            aria-label="הגדרות"
          />
        </div>
      </CardBody>
    </Card>
  );
}
