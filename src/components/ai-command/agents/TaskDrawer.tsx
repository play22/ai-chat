import { useState } from 'react';
import clsx from 'clsx';
import { useAICommand } from '../../../state/AICommandContext';
import { Drawer } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { domainIcon, domainColor, priorityLabel, priorityTone, taskStatusLabel, taskStatusTone, formatRelative } from '../shared';
import { Ban, Clock, ListTodo, MessageSquareText, Users as UsersIcon, MapPin } from 'lucide-react';
import { AgentChatPanel } from './AgentChatPanel';

type Tab = 'tasks' | 'chat';

export function TaskDrawer() {
  const { state, dispatch, toast } = useAICommand();
  const [tab, setTab] = useState<Tab>('tasks');
  const agent = state.agents.find((a) => a.id === state.selectedAgentId);

  // Include both primary and sub-agent assignments
  const tasks = state.tasks.filter(
    (t) => t.agentId === state.selectedAgentId || (t.subAgentIds ?? []).includes(state.selectedAgentId ?? ''),
  );

  const close = () => dispatch({ type: 'SELECT_AGENT', agentId: null });
  const cancel = (taskId: string, title: string) => {
    dispatch({ type: 'CANCEL_TASK', taskId });
    toast(`בוטלה משימה: ${title}`, 'warn');
  };

  if (!agent) return null;
  const Icon = domainIcon[agent.domain];

  const chatCount = state.agentChats[agent.id]?.length ?? 0;

  return (
    <Drawer open={!!agent} onClose={close} title={`${agent.name}`} width={520}>
      {/* Tabs */}
      <div className="flex items-stretch border-b border-panel-border bg-bg-elevated/40 px-3">
        <TabButton active={tab === 'tasks'} onClick={() => setTab('tasks')} icon={<ListTodo size={13} />} label="משימות" badge={tasks.length} />
        <TabButton active={tab === 'chat'} onClick={() => setTab('chat')} icon={<MessageSquareText size={13} />} label="שיחה" badge={chatCount > 0 ? Math.floor(chatCount / 2) : undefined} />
      </div>

      {/* Agent header card (always visible) */}
      <div className="p-3 border-b border-panel-border">
        <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-[6px] border border-panel-border">
          <Icon size={22} className={domainColor[agent.domain]} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-text">{agent.name}</div>
            <div className="text-2xs text-text-dim">
              {tasks.length} משימות סה"כ · {tasks.filter((t) => t.status === 'in_progress').length} בביצוע
              {agent.config?.units?.length ? ` · ${agent.config.units.length} יחידות` : ''}
            </div>
          </div>
          <Badge tone={agent.status === 'active' ? 'success' : agent.status === 'error' ? 'danger' : 'neutral'} dot pulse={agent.status === 'active'}>
            {agent.status === 'active' ? 'פעיל' : agent.status === 'error' ? 'שגיאה' : agent.status === 'idle' ? 'סרק' : 'מנותק'}
          </Badge>
        </div>
      </div>

      {/* Tab content */}
      {tab === 'tasks' ? (
        <div className="p-3 flex flex-col gap-2">
          {tasks.length === 0 && (
            <div className="text-xs text-text-faint text-center py-6">אין משימות פתוחות לסוכן זה</div>
          )}
          {tasks.map((t) => {
            const isSub = t.agentId !== agent.id;
            const otherAgents = [t.agentId, ...(t.subAgentIds ?? [])].filter((id) => id !== agent.id);
            return (
              <div
                key={t.id}
                className={clsx(
                  'p-3 bg-bg-elevated border rounded-[6px] hover:border-accent/30 transition-colors',
                  isSub ? 'border-info/30' : 'border-panel-border',
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isSub && <Badge tone="info">תת-משימה</Badge>}
                    <h4 className="text-sm font-medium text-text leading-tight truncate">{t.title}</h4>
                  </div>
                  <Badge tone={priorityTone[t.priority]} dot>
                    {priorityLabel[t.priority]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-2xs text-text-faint mb-2 flex-wrap">
                  <Badge tone={taskStatusTone[t.status]}>{taskStatusLabel[t.status]}</Badge>
                  <span className="font-mono">נוצרה {formatRelative(t.createdAt)}</span>
                  {t.eta && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock size={10} /> ETA {formatRelative(t.eta)}
                    </span>
                  )}
                  {t.geo && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={10} /> {t.geo.label}
                    </span>
                  )}
                </div>
                {otherAgents.length > 0 && (
                  <div className="flex items-center gap-1.5 text-2xs text-text-dim mb-2">
                    <UsersIcon size={10} />
                    <span>{isSub ? 'מתואם ע"י:' : 'משתתפים:'}</span>
                    <AgentChips agentIds={otherAgents} />
                  </div>
                )}
                {typeof t.progress === 'number' && t.status !== 'pending' && (
                  <div className="h-1 bg-bg-sunken rounded-full overflow-hidden mb-2">
                    <div
                      className={
                        t.status === 'failed'
                          ? 'h-full bg-danger'
                          : t.status === 'completed'
                            ? 'h-full bg-accent'
                            : 'h-full bg-accent/70'
                      }
                      style={{ width: `${t.progress}%` }}
                    />
                  </div>
                )}
                {(t.status === 'pending' || t.status === 'in_progress') && (
                  <Button
                    variant="ghost"
                    size="xs"
                    icon={<Ban size={11} />}
                    onClick={() => cancel(t.id, t.title)}
                  >
                    בטל משימה
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <AgentChatPanel agentId={agent.id} />
      )}
    </Drawer>
  );
}

function TabButton({
  active, onClick, icon, label, badge,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2.5 text-xs border-b-2 transition-colors',
        active
          ? 'border-accent text-accent'
          : 'border-transparent text-text-dim hover:text-text',
      )}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={clsx('px-1.5 py-0.5 text-[10px] rounded-full font-mono', active ? 'bg-accent/15 text-accent' : 'bg-panel text-text-dim')}>
          {badge}
        </span>
      )}
    </button>
  );
}

function AgentChips({ agentIds }: { agentIds: string[] }) {
  const { state } = useAICommand();
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      {agentIds.map((id) => {
        const a = state.agents.find((ag) => ag.id === id);
        if (!a) return null;
        const Icon = domainIcon[a.domain];
        return (
          <span
            key={id}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-panel border border-panel-border rounded text-[10px]"
          >
            <Icon size={9} className={domainColor[a.domain]} />
            {a.name.replace('סוכן ', '')}
          </span>
        );
      })}
    </span>
  );
}
