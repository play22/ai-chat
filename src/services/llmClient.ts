import type {
  Agent,
  Task,
  AutomationRule,
  MapEntity,
  AutonomyLevel,
  MessageBlock,
} from '../state/types';

export interface StreamCallbacks {
  onPending?: () => void;
  onBlock: (block: MessageBlock) => void;
  onDone?: (meta?: { autonomy?: AutonomyLevel }) => void;
  onError: (err: Error) => void;
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

/** Whether the real-LLM mode is enabled by env. */
export const isRealLLMEnabled = (): boolean =>
  String(import.meta.env.VITE_USE_REAL_LLM ?? '').toLowerCase() === 'true';

/** Quick connectivity probe — used for graceful fallback. */
export async function pingBackend(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
    return r.ok;
  } catch {
    return false;
  }
}

// ─── SSE parsing ──────────────────────────────────────────────────────────

/** Reads SSE events from a fetch Response body and dispatches to callbacks. */
async function consumeSSE(response: Response, cbs: StreamCallbacks): Promise<void> {
  if (!response.body) throw new Error('No response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Process complete events (terminated by \n\n)
    let sepIdx: number;
    while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
      const rawEvent = buffer.slice(0, sepIdx);
      buffer = buffer.slice(sepIdx + 2);

      let eventName = 'message';
      const dataLines: string[] = [];
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      const dataStr = dataLines.join('\n');
      if (!dataStr) continue;

      let payload: any;
      try {
        payload = JSON.parse(dataStr);
      } catch {
        continue;
      }

      if (eventName === 'pending') cbs.onPending?.();
      else if (eventName === 'block') cbs.onBlock(payload.block);
      else if (eventName === 'done') cbs.onDone?.(payload);
      else if (eventName === 'error') cbs.onError(new Error(payload?.message ?? 'stream error'));
    }
  }
}

// ─── Context shapers (strip down full state to what the backend needs) ───

function compactAgent(a: Agent) {
  return {
    id: a.id,
    name: a.name,
    domain: a.domain,
    status: a.status,
    autonomy: a.autonomy,
    activeTasks: a.activeTasks,
    successRate: a.successRate,
  };
}

function compactTask(t: Task) {
  return {
    id: t.id,
    agentId: t.agentId,
    subAgentIds: t.subAgentIds,
    title: t.title,
    status: t.status,
    priority: t.priority,
    createdAt: t.createdAt,
    scheduledFor: t.scheduledFor,
    eta: t.eta,
    geo: t.geo ? { label: t.geo.label } : undefined,
  };
}

// ─── Public API: streamMainChat, streamAgentChat ──────────────────────────

export interface MainChatInput {
  prompt: string;
  agents: Agent[];
  tasks: Task[];
  rules: AutomationRule[];
  entities: MapEntity[];
  autonomy: AutonomyLevel;
}

export async function streamMainChat(input: MainChatInput, cbs: StreamCallbacks): Promise<void> {
  try {
    const body = {
      prompt: input.prompt,
      context: {
        agents: input.agents.map(compactAgent),
        tasks: input.tasks.map(compactTask),
        rules: input.rules.map((r) => ({ id: r.id, name: r.name, enabled: r.enabled })),
        entities: input.entities.map((e) => ({ id: e.id, type: e.type, label: e.label, status: e.status })),
        autonomy: input.autonomy,
      },
    };
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    await consumeSSE(res, cbs);
  } catch (err) {
    cbs.onError(err instanceof Error ? err : new Error(String(err)));
  }
}

export interface AgentChatInput {
  prompt: string;
  agent: Agent;
  tasks: Task[];
}

export async function streamAgentChat(input: AgentChatInput, cbs: StreamCallbacks): Promise<void> {
  try {
    const body = {
      prompt: input.prompt,
      context: {
        agent: {
          ...compactAgent(input.agent),
          config: input.agent.config
            ? {
                style: input.agent.config.style,
                units: input.agent.config.units,
                tools: input.agent.config.tools.map((t) => ({
                  id: t.id,
                  name: t.name,
                  description: t.description,
                  enabled: t.enabled,
                })),
                boundary: input.agent.config.boundary
                  ? { label: input.agent.config.boundary.label }
                  : undefined,
              }
            : undefined,
        },
        tasks: input.tasks.map(compactTask),
      },
    };
    const res = await fetch(`${API_BASE}/api/agent-chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    await consumeSSE(res, cbs);
  } catch (err) {
    cbs.onError(err instanceof Error ? err : new Error(String(err)));
  }
}
