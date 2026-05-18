export type AutonomyLevel = 'observe' | 'recommend' | 'autonomous';

export type AgentDomain = 'fire' | 'intel' | 'water' | 'logistics' | 'cyber' | 'air';

export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export type TaskStatus = 'planned' | 'pending' | 'in_progress' | 'completed' | 'failed';

export type EntityType = 'threat' | 'asset' | 'unit' | 'poi';

export type EntityStatus = 'confirmed' | 'suggested' | 'rejected';

export type ViewMode = 'compact' | 'standard' | 'expanded';

export type ColorTheme = 'dark' | 'light';

export type PanelTab = 'chat' | 'agents' | 'tasks' | 'timeline' | 'automation' | 'history';

export type Recurrence = 'once' | 'hourly' | 'daily' | 'weekly';

export type CommTone = 'formal' | 'tactical' | 'concise' | 'verbose';
export type Verbosity = 'minimal' | 'standard' | 'detailed';
export type AgentLang = 'he' | 'en' | 'mixed';

export interface AgentStyle {
  tone: CommTone;
  verbosity: Verbosity;
  language: AgentLang;
  signature: string; // displayed name in chat
  useEmoji: boolean;
  citeSources: boolean;
}

export interface AgentPermissions {
  canCreateTasks: boolean;
  canDispatchUnits: boolean;
  canEscalateAlerts: boolean;
  canModifyEntities: boolean;
  canAccessClassified: boolean;
  canExecuteAuto: boolean; // auto execute without approval
  autoApprovalThreshold: 'never' | 'low' | 'medium' | 'high'; // max priority allowed without human approval
  maxParallelTasks: number;
}

export interface LinkedUnit {
  id: string;
  name: string;
  type: 'company' | 'platoon' | 'platform' | 'sensor' | 'cell';
  callsign?: string;
}

export type ToolType = 'webhook' | 'query' | 'action' | 'analysis';

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  type: ToolType;
  endpoint?: string;
  enabled: boolean;
  createdAt: string;
}

export interface AgentConfig {
  style: AgentStyle;
  permissions: AgentPermissions;
  units: LinkedUnit[];
  boundary?: GeoContext;
  tools: AgentTool[];
}

export interface Agent {
  id: string;
  name: string;
  domain: AgentDomain;
  status: AgentStatus;
  autonomy: AutonomyLevel;
  activeTasks: number;
  successRate: number; // 0..1
  lastActivity: string;
  config?: AgentConfig;
}

export interface GeoContext {
  label: string; // human-readable e.g. "גזרה צפונית", "סקטור B-7"
  kind: 'point' | 'area';
  point?: { x: number; y: number };
  area?: { x: number; y: number }[]; // polygon
}

export interface Task {
  id: string;
  /** The primary owner. If `subAgentIds` is non-empty, this agent acts as the coordinator. */
  agentId: string;
  /** Optional sub-agents involved in execution. The coordinator (`agentId`) can delegate to them. */
  subAgentIds?: string[];
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  scheduledFor?: string; // for planned tasks
  startedAt?: string;
  completedAt?: string;
  eta?: string;
  progress?: number; // 0..100
  geo?: GeoContext;
}

export interface ScheduleConfig {
  recurrence: Recurrence;
  startAt: string; // ISO datetime - first run / specific time
  time?: string;   // HH:MM for daily/weekly
  weekday?: number; // 0-6 for weekly
  intervalHours?: number; // for hourly with custom interval
}

export interface AutomationTrigger {
  type: 'detection' | 'threshold' | 'schedule';
  entityType?: EntityType;
  areaLabel?: string; // human label of polygon
  threshold?: { metric: string; op: '>' | '<' | '='; value: number };
  schedule?: ScheduleConfig;
}

export interface AutomationAction {
  type: 'create_task' | 'notify' | 'dispatch_unit';
  targetAgentId: string;
  priority: Priority;
  message: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  action: AutomationAction;
  /** Optional natural-language description that was used to create/edit this rule. */
  nlDescription?: string;
  lastFired?: string;
  firedCount: number;
}

export interface MapEntity {
  id: string;
  type: EntityType;
  label: string;
  position: { x: number; y: number }; // 0..100 coords in MockMap
  status: EntityStatus;
  source: 'manual' | 'ai_suggestion';
  meta?: Record<string, string>;
}

export interface AreaAttachment {
  kind: 'area';
  id: string;
  label: string;
  points: { x: number; y: number }[];
}
export interface ImageAttachment {
  kind: 'image';
  id: string;
  label: string;
  dataUrl?: string;
}
export interface EntityRefAttachment {
  kind: 'entity';
  id: string;
  entityId: string;
  label: string;
}
export type Attachment = AreaAttachment | ImageAttachment | EntityRefAttachment;

export interface TextBlock {
  kind: 'text';
  text: string;
}
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
  entity: MapEntity;
  rationale: string;
}
export interface QuickActionsBlock {
  kind: 'quick_actions';
  actions: { label: string; prompt: string }[];
}

export type SummaryEventSeverity = 'info' | 'success' | 'warn' | 'critical';

export interface SummaryMetric {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  delta?: { direction: 'up' | 'down' | 'flat'; pct?: number; vsLabel: string };
  tone?: 'neutral' | 'success' | 'warn' | 'danger' | 'info';
}

export interface SummaryEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  agentId?: string;
  severity: SummaryEventSeverity;
}

export interface SummaryAgentActivity {
  agentId: string;
  tasksCompleted: number;
  tasksFailed: number;
  tasksInProgress: number;
  alertsHandled: number;
}

export interface SummaryBlock {
  kind: 'summary';
  title: string;
  periodLabel: string;       // e.g. "16:00 - 22:00" or "6 שעות אחרונות"
  rangeStart: string;        // ISO
  rangeEnd: string;          // ISO
  metrics: SummaryMetric[];
  events: SummaryEvent[];
  agentActivity: SummaryAgentActivity[];
  highlights: string[];
  recommendations?: string[];
}
export interface PlanStep {
  id: string;
  title: string;
  estMinutes: number;
  detail?: string;
}
export interface PlanProposalBlock {
  kind: 'plan_proposal';
  agentId: string;            // coordinator
  subAgentIds?: string[];     // proposed sub-agents
  reasoning: string;
  title: string;
  description?: string;
  scheduledFor?: string;
  priority: Priority;
  steps: PlanStep[];
  geo?: GeoContext;
}
export type MessageBlock =
  | TextBlock
  | TableBlock
  | ActionCardBlock
  | EntitySuggestionBlock
  | QuickActionsBlock
  | PlanProposalBlock
  | SummaryBlock;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  text?: string; // for user messages
  attachments?: Attachment[];
  blocks?: MessageBlock[];
  autonomy?: AutonomyLevel;
  pending?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  startedAt: string;
  messageCount: number;
  preview: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  variant: 'success' | 'info' | 'warn' | 'danger';
}

export interface AppState {
  activeTab: PanelTab;
  viewMode: ViewMode;
  globalAutonomy: AutonomyLevel;
  agents: Agent[];
  tasks: Task[];
  rules: AutomationRule[];
  entities: MapEntity[];
  conversations: Conversation[];
  messages: ChatMessage[];
  pendingAttachments: Attachment[];
  selectedAgentId: string | null;
  ruleEditorOpen: boolean;
  editingRuleId: string | null;
  mapPickerMode: null | {
    purpose: 'attach_area' | 'place_entity' | 'rule_area' | 'agent_boundary' | 'task_geo';
    entityId?: string;
    agentId?: string;
    taskId?: string;
    initialPolygon?: { x: number; y: number }[];
    initialPoint?: { x: number; y: number };
  };
  /** Transient: polygon result from picker, consumed by AgentSettingsModal. */
  pendingBoundary: { agentId: string; points: { x: number; y: number }[] } | null;
  /** Transient: task geo result from picker, consumed by TaskDetailsModal. */
  pendingTaskGeo: { taskId: string; kind: 'area' | 'point'; points?: { x: number; y: number }[]; point?: { x: number; y: number } } | null;
  /** ID of the task currently being viewed/edited in TaskDetailsModal. */
  editingTaskId: string | null;
  toasts: ToastMessage[];
  mapVisible: boolean;
  highlightAgentId: string | null;
  theme: ColorTheme;
  agentSettingsId: string | null;
  mapSplitPercent: number; // 20..70 - map width as % of main area
  agentChats: Record<string, ChatMessage[]>; // per-agent conversation thread
}
