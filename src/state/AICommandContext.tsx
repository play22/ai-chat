import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ReactNode } from 'react';
import { reducer, type Action } from './reducer';
import type { AppState, ChatMessage, ToastMessage } from './types';
import { initialAgents } from '../mock/agents';
import { initialTasks } from '../mock/tasks';
import { initialRules } from '../mock/rules';
import { initialEntities } from '../mock/entities';
import { initialConversations } from '../mock/conversations';
import { generateAIResponse } from '../mock/aiResponder';
import { generateAgentResponse } from '../mock/agentResponder';

const initialState: AppState = {
  activeTab: 'chat',
  viewMode: 'standard',
  globalAutonomy: 'recommend',
  agents: initialAgents,
  tasks: initialTasks,
  rules: initialRules,
  entities: initialEntities,
  conversations: initialConversations,
  messages: [
    {
      id: 'm-welcome',
      role: 'assistant',
      timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      blocks: [
        {
          kind: 'text',
          text:
            'שלום מפקד. אני מרכז פיקוד ה-AI שלך. כל הסוכנים מאותחלים וזמינים. ' +
            'רמת האוטונומיות הנוכחית: המלצה לפעולה. במה אוכל לסייע?',
        },
        {
          kind: 'quick_actions',
          actions: [
            { label: 'תכנן אש לצפון-מערב בשעה 15:00', prompt: 'תכנן הפעלת משימת אש לגזרת צפון-מערב בשעה 15:00' },
            { label: 'תקיפה משולבת אש+אוויר+מודיעין', prompt: 'תכנן תקיפה משולבת של אש, אוויר ומודיעין בגזרה צפון-מזרחית בשעה 16:00' },
            { label: 'הפק דו"ח מודיעין', prompt: 'תכנן הפקת דו"ח מודיעין מעודכן בעוד 30 דקות' },
            { label: 'שגר כט"ב לצפון-מזרח', prompt: 'תכנן שיגור כט"ב לסיור בגזרה הצפון-מזרחית בשעה 14:30' },
            { label: 'מצב סוכנים', prompt: 'מה סטטוס הסוכנים כעת?' },
            { label: 'איומים פעילים', prompt: 'הצג איומים פעילים בשטח' },
          ],
        },
      ],
      autonomy: 'recommend',
    },
  ],
  pendingAttachments: [],
  selectedAgentId: null,
  ruleEditorOpen: false,
  editingRuleId: null,
  mapPickerMode: null,
  toasts: [],
  mapVisible: false,
  highlightAgentId: null,
  theme: 'dark',
  agentSettingsId: null,
  mapSplitPercent: 45,
  agentChats: {},
  pendingBoundary: null,
};

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  sendUserMessage: (text: string) => Promise<void>;
  sendAgentMessage: (agentId: string, text: string) => Promise<void>;
  toast: (text: string, variant?: ToastMessage['variant']) => void;
}

const Ctx = createContext<ContextValue | null>(null);

export function AICommandProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const toast = (text: string, variant: ToastMessage['variant'] = 'success') => {
    const t: ToastMessage = { id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, text, variant };
    dispatch({ type: 'ADD_TOAST', toast: t });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id: t.id }), 4000);
  };

  const sendUserMessage = async (text: string) => {
    const s = stateRef.current;
    const attachments = s.pendingAttachments;
    const userMsg: ChatMessage = {
      id: `m-u-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toISOString(),
      text,
      attachments: attachments.length ? [...attachments] : undefined,
    };
    dispatch({ type: 'ADD_MESSAGE', message: userMsg });
    dispatch({ type: 'CLEAR_PENDING_ATTACHMENTS' });

    const pendingId = `m-pending-${Date.now()}`;
    dispatch({
      type: 'ADD_MESSAGE',
      message: {
        id: pendingId,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        pending: true,
        autonomy: s.globalAutonomy,
      },
    });

    const response = await generateAIResponse({
      prompt: text,
      attachments,
      agents: s.agents,
      tasks: s.tasks,
      autonomy: s.globalAutonomy,
    });

    dispatch({ type: 'REMOVE_MESSAGE', messageId: pendingId });
    dispatch({ type: 'ADD_MESSAGE', message: response });
  };

  useEffect(() => {
    // Simulate ambient activity: agent last-activity update every ~10s
    const i = setInterval(() => {
      const agents = stateRef.current.agents;
      const active = agents.filter((a) => a.status === 'active');
      if (active.length) {
        const pick = active[Math.floor(Math.random() * active.length)];
        dispatch({ type: 'UPDATE_AGENT', agentId: pick.id, patch: { lastActivity: new Date().toISOString() } });
      }
    }, 10000);
    return () => clearInterval(i);
  }, []);

  const sendAgentMessage = async (agentId: string, text: string) => {
    const s = stateRef.current;
    const agent = s.agents.find((a) => a.id === agentId);
    if (!agent) return;

    const userMsg: ChatMessage = {
      id: `am-u-${Date.now()}`,
      role: 'user',
      timestamp: new Date().toISOString(),
      text,
    };
    dispatch({ type: 'ADD_AGENT_MESSAGE', agentId, message: userMsg });

    const pendingId = `am-pending-${Date.now()}`;
    dispatch({
      type: 'ADD_AGENT_MESSAGE',
      agentId,
      message: {
        id: pendingId,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        pending: true,
        autonomy: agent.autonomy,
      },
    });

    const agentTasks = s.tasks.filter(
      (t) => t.agentId === agentId || (t.subAgentIds ?? []).includes(agentId),
    );

    const response = await generateAgentResponse({ prompt: text, agent, tasks: agentTasks });
    dispatch({ type: 'REMOVE_AGENT_MESSAGE', agentId, messageId: pendingId });
    dispatch({ type: 'ADD_AGENT_MESSAGE', agentId, message: response });
  };

  const value = useMemo<ContextValue>(
    () => ({ state, dispatch, sendUserMessage, sendAgentMessage, toast }),
    [state],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAICommand() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAICommand must be used inside AICommandProvider');
  return v;
}
