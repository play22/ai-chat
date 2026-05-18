import type {
  AppState,
  Agent,
  AutomationRule,
  AutonomyLevel,
  Attachment,
  ChatMessage,
  MapEntity,
  PanelTab,
  Task,
  ToastMessage,
  ViewMode,
} from './types';
export type { ChatMessage, Task };

export type Action =
  | { type: 'SET_TAB'; tab: PanelTab }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'SET_GLOBAL_AUTONOMY'; level: AutonomyLevel }
  | { type: 'SET_AGENT_AUTONOMY'; agentId: string; level: AutonomyLevel }
  | { type: 'SELECT_AGENT'; agentId: string | null }
  | { type: 'CANCEL_TASK'; taskId: string }
  | { type: 'ADD_TASK'; task: Task }
  | { type: 'TOGGLE_RULE'; ruleId: string }
  | { type: 'OPEN_RULE_EDITOR'; ruleId?: string | null }
  | { type: 'CLOSE_RULE_EDITOR' }
  | { type: 'SAVE_RULE'; rule: AutomationRule }
  | { type: 'DELETE_RULE'; ruleId: string }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; messageId: string; patch: Partial<ChatMessage> }
  | { type: 'REMOVE_MESSAGE'; messageId: string }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'ADD_PENDING_ATTACHMENT'; attachment: Attachment }
  | { type: 'REMOVE_PENDING_ATTACHMENT'; id: string }
  | { type: 'CLEAR_PENDING_ATTACHMENTS' }
  | { type: 'ADD_ENTITY'; entity: MapEntity }
  | { type: 'UPDATE_ENTITY'; entityId: string; patch: Partial<MapEntity> }
  | { type: 'REMOVE_ENTITY'; entityId: string }
  | {
      type: 'OPEN_MAP_PICKER';
      purpose: 'attach_area' | 'place_entity' | 'rule_area' | 'agent_boundary' | 'task_geo';
      entityId?: string;
      agentId?: string;
      taskId?: string;
      initialPolygon?: { x: number; y: number }[];
      initialPoint?: { x: number; y: number };
    }
  | { type: 'CLOSE_MAP_PICKER' }
  | { type: 'SET_PENDING_BOUNDARY'; agentId: string; points: { x: number; y: number }[] }
  | { type: 'CLEAR_PENDING_BOUNDARY' }
  | {
      type: 'SET_PENDING_TASK_GEO';
      taskId: string;
      kind: 'area' | 'point';
      points?: { x: number; y: number }[];
      point?: { x: number; y: number };
    }
  | { type: 'CLEAR_PENDING_TASK_GEO' }
  | { type: 'OPEN_TASK_EDITOR'; taskId: string }
  | { type: 'CLOSE_TASK_EDITOR' }
  | { type: 'TOGGLE_MAP_VISIBLE' }
  | { type: 'SET_MAP_VISIBLE'; visible: boolean }
  | { type: 'HIGHLIGHT_AGENT'; agentId: string | null }
  | { type: 'SET_THEME'; theme: import('./types').ColorTheme }
  | { type: 'OPEN_AGENT_SETTINGS'; agentId: string }
  | { type: 'CLOSE_AGENT_SETTINGS' }
  | { type: 'UPDATE_AGENT_CONFIG'; agentId: string; config: import('./types').AgentConfig }
  | { type: 'SET_MAP_SPLIT'; percent: number }
  | { type: 'ADD_AGENT_MESSAGE'; agentId: string; message: ChatMessage }
  | { type: 'UPDATE_AGENT_MESSAGE'; agentId: string; messageId: string; patch: Partial<ChatMessage> }
  | { type: 'REMOVE_AGENT_MESSAGE'; agentId: string; messageId: string }
  | { type: 'CLEAR_AGENT_MESSAGES'; agentId: string }
  | { type: 'UPDATE_TASK'; taskId: string; patch: Partial<Task> }
  | { type: 'ADD_TOAST'; toast: ToastMessage }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'UPDATE_AGENT'; agentId: string; patch: Partial<Agent> };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.mode, mapVisible: action.mode === 'expanded' ? true : state.mapVisible };
    case 'SET_GLOBAL_AUTONOMY':
      return { ...state, globalAutonomy: action.level };
    case 'SET_AGENT_AUTONOMY':
      return {
        ...state,
        agents: state.agents.map((a) => (a.id === action.agentId ? { ...a, autonomy: action.level } : a)),
      };
    case 'UPDATE_AGENT':
      return { ...state, agents: state.agents.map((a) => (a.id === action.agentId ? { ...a, ...action.patch } : a)) };
    case 'SELECT_AGENT':
      return { ...state, selectedAgentId: action.agentId };
    case 'CANCEL_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, status: 'failed' as const } : t)),
      };
    case 'ADD_TASK': {
      const agents = state.agents.map((a) =>
        a.id === action.task.agentId ? { ...a, activeTasks: a.activeTasks + 1 } : a,
      );
      return { ...state, tasks: [action.task, ...state.tasks], agents };
    }
    case 'TOGGLE_RULE':
      return {
        ...state,
        rules: state.rules.map((r) => (r.id === action.ruleId ? { ...r, enabled: !r.enabled } : r)),
      };
    case 'OPEN_RULE_EDITOR':
      return { ...state, ruleEditorOpen: true, editingRuleId: action.ruleId ?? null };
    case 'CLOSE_RULE_EDITOR':
      return { ...state, ruleEditorOpen: false, editingRuleId: null };
    case 'SAVE_RULE': {
      const exists = state.rules.find((r) => r.id === action.rule.id);
      const rules = exists
        ? state.rules.map((r) => (r.id === action.rule.id ? action.rule : r))
        : [action.rule, ...state.rules];
      return { ...state, rules, ruleEditorOpen: false, editingRuleId: null };
    }
    case 'DELETE_RULE':
      return { ...state, rules: state.rules.filter((r) => r.id !== action.ruleId) };
    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((m) => (m.id === action.messageId ? { ...m, ...action.patch } : m)),
      };
    case 'REMOVE_MESSAGE':
      return { ...state, messages: state.messages.filter((m) => m.id !== action.messageId) };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'ADD_PENDING_ATTACHMENT':
      return { ...state, pendingAttachments: [...state.pendingAttachments, action.attachment] };
    case 'REMOVE_PENDING_ATTACHMENT':
      return { ...state, pendingAttachments: state.pendingAttachments.filter((a) => a.id !== action.id) };
    case 'CLEAR_PENDING_ATTACHMENTS':
      return { ...state, pendingAttachments: [] };
    case 'ADD_ENTITY':
      return { ...state, entities: [...state.entities, action.entity] };
    case 'UPDATE_ENTITY':
      return {
        ...state,
        entities: state.entities.map((e) => (e.id === action.entityId ? { ...e, ...action.patch } : e)),
      };
    case 'REMOVE_ENTITY':
      return { ...state, entities: state.entities.filter((e) => e.id !== action.entityId) };
    case 'OPEN_MAP_PICKER':
      return {
        ...state,
        mapPickerMode: {
          purpose: action.purpose,
          entityId: action.entityId,
          agentId: action.agentId,
          taskId: action.taskId,
          initialPolygon: action.initialPolygon,
          initialPoint: action.initialPoint,
        },
        mapVisible: true,
      };
    case 'CLOSE_MAP_PICKER':
      return { ...state, mapPickerMode: null };
    case 'SET_PENDING_BOUNDARY':
      return { ...state, pendingBoundary: { agentId: action.agentId, points: action.points } };
    case 'CLEAR_PENDING_BOUNDARY':
      return { ...state, pendingBoundary: null };
    case 'SET_PENDING_TASK_GEO':
      return {
        ...state,
        pendingTaskGeo: { taskId: action.taskId, kind: action.kind, points: action.points, point: action.point },
      };
    case 'CLEAR_PENDING_TASK_GEO':
      return { ...state, pendingTaskGeo: null };
    case 'OPEN_TASK_EDITOR':
      return { ...state, editingTaskId: action.taskId };
    case 'CLOSE_TASK_EDITOR':
      return { ...state, editingTaskId: null };
    case 'TOGGLE_MAP_VISIBLE':
      return { ...state, mapVisible: !state.mapVisible };
    case 'SET_MAP_VISIBLE':
      return { ...state, mapVisible: action.visible };
    case 'HIGHLIGHT_AGENT':
      return { ...state, highlightAgentId: action.agentId };
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'OPEN_AGENT_SETTINGS':
      return { ...state, agentSettingsId: action.agentId };
    case 'CLOSE_AGENT_SETTINGS':
      return { ...state, agentSettingsId: null };
    case 'UPDATE_AGENT_CONFIG':
      return {
        ...state,
        agents: state.agents.map((a) =>
          a.id === action.agentId ? { ...a, config: action.config } : a,
        ),
      };
    case 'SET_MAP_SPLIT':
      return { ...state, mapSplitPercent: Math.min(70, Math.max(20, action.percent)) };
    case 'ADD_AGENT_MESSAGE': {
      const existing = state.agentChats[action.agentId] ?? [];
      return {
        ...state,
        agentChats: { ...state.agentChats, [action.agentId]: [...existing, action.message] },
      };
    }
    case 'UPDATE_AGENT_MESSAGE': {
      const existing = state.agentChats[action.agentId] ?? [];
      return {
        ...state,
        agentChats: {
          ...state.agentChats,
          [action.agentId]: existing.map((m) => (m.id === action.messageId ? { ...m, ...action.patch } : m)),
        },
      };
    }
    case 'REMOVE_AGENT_MESSAGE': {
      const existing = state.agentChats[action.agentId] ?? [];
      return {
        ...state,
        agentChats: {
          ...state.agentChats,
          [action.agentId]: existing.filter((m) => m.id !== action.messageId),
        },
      };
    }
    case 'CLEAR_AGENT_MESSAGES':
      return { ...state, agentChats: { ...state.agentChats, [action.agentId]: [] } };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.taskId ? { ...t, ...action.patch } : t)),
      };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}
