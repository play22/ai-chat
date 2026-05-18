// Mirror of relevant types from frontend (src/state/types.ts).
// Kept inline to avoid cross-project import gymnastics. If MessageBlock
// shape changes in the frontend, update here too.

export type AutonomyLevel = 'observe' | 'recommend' | 'autonomous';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EntityType = 'threat' | 'asset' | 'unit' | 'poi';
export type SummaryEventSeverity = 'info' | 'success' | 'warn' | 'critical';

// ─── Lightweight context shapes (frontend sends snapshots) ──────────────
export interface AgentSnapshot {
  id: string;
  name: string;
  domain: string;
  status: string;
  autonomy: AutonomyLevel;
  activeTasks: number;
  successRate: number;
}
export interface TaskSnapshot {
  id: string;
  agentId: string;
  subAgentIds?: string[];
  title: string;
  status: string;
  priority: Priority;
  createdAt: string;
  scheduledFor?: string;
  eta?: string;
  geo?: { label: string };
}
export interface RuleSnapshot {
  id: string;
  name: string;
  enabled: boolean;
}
export interface EntitySnapshot {
  id: string;
  type: EntityType;
  label: string;
  status: string;
}
export interface ChatContext {
  agents: AgentSnapshot[];
  tasks: TaskSnapshot[];
  rules: RuleSnapshot[];
  entities: EntitySnapshot[];
  autonomy: AutonomyLevel;
}
export interface AgentChatContext {
  agent: AgentSnapshot & {
    config?: {
      style?: { signature?: string; tone?: string; verbosity?: string; useEmoji?: boolean };
      units?: { id: string; name: string; type: string; callsign?: string }[];
      tools?: { id: string; name: string; description: string; enabled: boolean }[];
      boundary?: { label: string };
    };
  };
  tasks: TaskSnapshot[];
}

// ─── MessageBlock variants (must match frontend) ────────────────────────
export interface TextBlock { kind: 'text'; text: string; }

export interface TableBlock {
  kind: 'table';
  title?: string;
  columns: { key: string; label: string; align?: 'start' | 'end' | 'center' }[];
  rows: Record<string, string | number>[];
  rowSeverity?: Record<number, Priority>;
}

export interface ActionCardBlock {
  kind: 'action_card';
  title: string;
  description: string;
  severity: Priority;
  actions: { id: string; label: string; variant: 'primary' | 'ghost' | 'danger' }[];
}

export interface EntitySuggestionBlock {
  kind: 'entity_suggestion';
  rationale: string;
  entity: {
    id: string;
    type: EntityType;
    label: string;
    position: { x: number; y: number };
    status: 'suggested';
    source: 'ai_suggestion';
  };
}

export interface QuickActionsBlock {
  kind: 'quick_actions';
  actions: { label: string; prompt: string }[];
}

export interface PlanStep {
  id: string;
  title: string;
  estMinutes: number;
  detail?: string;
}
export interface PlanProposalBlock {
  kind: 'plan_proposal';
  agentId: string;
  subAgentIds?: string[];
  reasoning: string;
  title: string;
  description?: string;
  scheduledFor?: string;
  priority: Priority;
  steps: PlanStep[];
  geo?: { label: string; kind: 'area' | 'point'; area?: { x: number; y: number }[]; point?: { x: number; y: number } };
}

export interface SummaryBlock {
  kind: 'summary';
  title: string;
  periodLabel: string;
  rangeStart: string;
  rangeEnd: string;
  metrics: {
    key: string;
    label: string;
    value: number | string;
    delta?: { direction: 'up' | 'down' | 'flat'; pct?: number; vsLabel: string };
    tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info';
  }[];
  events: {
    id: string;
    timestamp: string;
    title: string;
    description?: string;
    agentId?: string;
    severity: SummaryEventSeverity;
  }[];
  agentActivity: {
    agentId: string;
    tasksCompleted: number;
    tasksFailed: number;
    tasksInProgress: number;
    alertsHandled: number;
  }[];
  highlights: string[];
  recommendations?: string[];
}

export type MessageBlock =
  | TextBlock
  | TableBlock
  | ActionCardBlock
  | EntitySuggestionBlock
  | QuickActionsBlock
  | PlanProposalBlock
  | SummaryBlock;
