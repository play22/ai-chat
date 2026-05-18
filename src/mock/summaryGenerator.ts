import type {
  Agent,
  Task,
  AutomationRule,
  MapEntity,
  SummaryBlock,
  SummaryMetric,
  SummaryEvent,
  SummaryAgentActivity,
} from '../state/types';

interface Input {
  hours: number;
  agents: Agent[];
  tasks: Task[];
  rules: AutomationRule[];
  entities: MapEntity[];
}

const uid = () => Math.random().toString(36).slice(2, 8);

/**
 * Builds a structured summary of the last N hours from current state.
 * Mock — but uses real state values so the response feels coherent with what
 * the user sees in other panels.
 */
export function generateSummary({ hours, agents, tasks, rules, entities }: Input): SummaryBlock {
  const now = Date.now();
  const rangeStartMs = now - hours * 3600 * 1000;
  const rangeStart = new Date(rangeStartMs).toISOString();
  const rangeEnd = new Date(now).toISOString();

  // ── Metrics ──────────────────────────────────────────────────────────────
  const completedInRange = tasks.filter(
    (t) => t.completedAt && new Date(t.completedAt).getTime() >= rangeStartMs,
  );
  const failedInRange = tasks.filter(
    (t) => t.status === 'failed' && new Date(t.createdAt).getTime() >= rangeStartMs,
  );
  const createdInRange = tasks.filter((t) => new Date(t.createdAt).getTime() >= rangeStartMs);
  const activeNow = tasks.filter((t) => t.status === 'in_progress');
  const enabledRules = rules.filter((r) => r.enabled);
  const ruleFiringsApprox = enabledRules.reduce((s, r) => s + Math.min(r.firedCount, Math.ceil(hours / 6) * 2 + 1), 0);
  const aiSuggested = entities.filter((e) => e.source === 'ai_suggestion').length;

  const metrics: SummaryMetric[] = [
    {
      key: 'completed',
      label: 'משימות שהושלמו',
      value: completedInRange.length,
      delta: { direction: 'up', pct: 18, vsLabel: 'מ-6 שעות קודמות' },
      tone: 'success',
    },
    {
      key: 'created',
      label: 'משימות שנוצרו',
      value: createdInRange.length,
      delta: { direction: 'up', pct: 12, vsLabel: 'מ-6 שעות קודמות' },
      tone: 'info',
    },
    {
      key: 'failed',
      label: 'משימות שנכשלו',
      value: failedInRange.length,
      delta: failedInRange.length > 0 ? { direction: 'flat', vsLabel: 'יציב' } : undefined,
      tone: failedInRange.length > 0 ? 'danger' : 'neutral',
    },
    {
      key: 'active',
      label: 'פעילות כעת',
      value: activeNow.length,
      tone: 'info',
    },
    {
      key: 'rule_firings',
      label: 'הפעלות חוקים',
      value: ruleFiringsApprox,
      delta: { direction: 'up', pct: 7, vsLabel: 'מ-6 שעות קודמות' },
      tone: 'warn',
    },
    {
      key: 'ai_suggestions',
      label: 'הצעות AI ממתינות',
      value: aiSuggested,
      tone: aiSuggested > 0 ? 'warn' : 'neutral',
    },
  ];

  // ── Events timeline ──────────────────────────────────────────────────────
  const events: SummaryEvent[] = [];

  // task completions
  for (const t of completedInRange.slice(0, 4)) {
    events.push({
      id: `ev-${uid()}`,
      timestamp: t.completedAt!,
      title: `הושלמה: ${t.title}`,
      agentId: t.agentId,
      severity: 'success',
    });
  }
  // failures
  for (const t of failedInRange.slice(0, 2)) {
    events.push({
      id: `ev-${uid()}`,
      timestamp: t.createdAt,
      title: `נכשלה: ${t.title}`,
      description: 'דורש תחקור',
      agentId: t.agentId,
      severity: 'critical',
    });
  }
  // task creations (recent)
  for (const t of createdInRange.slice(0, 3)) {
    events.push({
      id: `ev-${uid()}`,
      timestamp: t.createdAt,
      title: `נוצרה משימה: ${t.title}`,
      agentId: t.agentId,
      severity: t.priority === 'critical' ? 'critical' : t.priority === 'high' ? 'warn' : 'info',
    });
  }
  // rule firings (synthetic)
  for (const r of enabledRules.slice(0, 2)) {
    if (r.lastFired) {
      events.push({
        id: `ev-${uid()}`,
        timestamp: r.lastFired,
        title: `הופעל חוק: ${r.name}`,
        description: `סוכן יעד: ${agents.find((a) => a.id === r.action.targetAgentId)?.name ?? ''}`,
        agentId: r.action.targetAgentId,
        severity: 'info',
      });
    }
  }
  // ai suggestions
  if (aiSuggested > 0) {
    events.push({
      id: `ev-${uid()}`,
      timestamp: new Date(now - 1000 * 60 * 23).toISOString(),
      title: `${aiSuggested} ישויות חדשות הוצעו ע"י AI`,
      description: 'ממתינות לאישור מפקדתי',
      severity: 'warn',
    });
  }

  // Sort newest first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── Per-agent activity ──────────────────────────────────────────────────
  const agentActivity: SummaryAgentActivity[] = agents.map((agent) => {
    const aTasks = tasks.filter((t) => t.agentId === agent.id || (t.subAgentIds ?? []).includes(agent.id));
    return {
      agentId: agent.id,
      tasksCompleted: aTasks.filter(
        (t) => t.completedAt && new Date(t.completedAt).getTime() >= rangeStartMs,
      ).length,
      tasksFailed: aTasks.filter(
        (t) => t.status === 'failed' && new Date(t.createdAt).getTime() >= rangeStartMs,
      ).length,
      tasksInProgress: aTasks.filter((t) => t.status === 'in_progress').length,
      alertsHandled: Math.floor(Math.random() * 4),
    };
  });

  // ── Highlights & recommendations ────────────────────────────────────────
  const errorAgents = agents.filter((a) => a.status === 'error');
  const criticalActive = tasks.filter((t) => t.priority === 'critical' && t.status === 'in_progress');

  const highlights: string[] = [];
  highlights.push(
    `${completedInRange.length} משימות הושלמו, ${createdInRange.length} חדשות נפתחו, ${activeNow.length} בביצוע כעת.`,
  );
  if (criticalActive.length > 0) {
    highlights.push(`${criticalActive.length} משימות בעדיפות **קריטית** פעילות — מומלץ לבדוק התקדמות.`);
  }
  if (errorAgents.length > 0) {
    highlights.push(`${errorAgents.length} סוכנים במצב שגיאה: ${errorAgents.map((a) => a.name).join(', ')}.`);
  }
  if (aiSuggested > 0) {
    highlights.push(`${aiSuggested} הצעות AI לישויות חדשות ממתינות לאישור.`);
  }
  if (failedInRange.length === 0 && errorAgents.length === 0) {
    highlights.push('לא זוהו חריגות מבצעיות במהלך התקופה.');
  }

  const recommendations: string[] = [];
  if (errorAgents.length > 0) {
    recommendations.push(`לפתוח אבחון לסוכן ${errorAgents[0].name} ולברר את סיבת השגיאה.`);
  }
  if (aiSuggested > 0) {
    recommendations.push('לעבור על הצעות הישויות הממתינות ולאשר/לדחות (במפה הראשית).');
  }
  if (criticalActive.length > 0) {
    recommendations.push('להעמיק במשימות הקריטיות הפעילות ולוודא לוחות זמנים.');
  }
  if (recommendations.length === 0) {
    recommendations.push('להמשיך מעקב שוטף, אין פעולות דחופות נדרשות.');
  }

  // ── Period label ────────────────────────────────────────────────────────
  const startTime = new Date(rangeStartMs);
  const endTime = new Date(now);
  const fmt = (d: Date) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  const periodLabel = `${fmt(startTime)} - ${fmt(endTime)} (${hours} שעות)`;

  return {
    kind: 'summary',
    title: `תקציר ${hours} שעות אחרונות`,
    periodLabel,
    rangeStart,
    rangeEnd,
    metrics,
    events: events.slice(0, 10),
    agentActivity,
    highlights,
    recommendations,
  };
}
