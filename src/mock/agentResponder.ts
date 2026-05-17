import type { Agent, ChatMessage, MessageBlock, Task } from '../state/types';

const uid = () => Math.random().toString(36).slice(2, 10);

interface Input {
  prompt: string;
  agent: Agent;
  tasks: Task[]; // agent's tasks (already filtered by caller)
}

/**
 * Per-agent AI responder. Produces a response in the agent's voice (uses
 * style.signature/tone/verbosity from config) and is aware of its own tasks.
 */
export async function generateAgentResponse({ prompt, agent, tasks }: Input): Promise<ChatMessage> {
  await new Promise((r) => setTimeout(r, 500 + Math.random() * 700));

  const p = prompt.toLowerCase();
  const blocks: MessageBlock[] = [];
  const style = agent.config?.style;

  // Status / general overview
  if (/מצב|סטטוס|מה ה|מה אצלך/.test(p)) {
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const planned = tasks.filter((t) => t.status === 'planned').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    blocks.push({
      kind: 'text',
      text: domainStatusReply(agent, inProgress, planned, pending),
    });
    if (tasks.length > 0) {
      blocks.push({
        kind: 'table',
        title: 'משימותיי',
        columns: [
          { key: 'title', label: 'משימה' },
          { key: 'status', label: 'סטטוס', align: 'center' },
          { key: 'priority', label: 'עדיפות', align: 'end' },
        ],
        rows: tasks.slice(0, 5).map((t) => ({
          title: t.title,
          status: t.status === 'in_progress' ? 'בביצוע' : t.status === 'planned' ? 'מתוכננת' : t.status === 'pending' ? 'ממתינה' : t.status === 'completed' ? 'הושלמה' : 'נכשלה',
          priority: t.priority,
        })),
      });
    }
  } else if (/יחיד|פלוג|מי איתי|מי כפוף/.test(p) && agent.config?.units?.length) {
    blocks.push({
      kind: 'text',
      text: `${signature(style)} ${agent.config.units.length} יחידות מקושרות אליי:`,
    });
    blocks.push({
      kind: 'table',
      columns: [
        { key: 'name', label: 'יחידה' },
        { key: 'type', label: 'סוג' },
        { key: 'callsign', label: 'קריאה' },
      ],
      rows: agent.config.units.map((u) => ({
        name: u.name,
        type: u.type,
        callsign: u.callsign ?? '—',
      })),
    });
  } else if (/כלים|יכולות|מה אתה יכול/.test(p)) {
    const enabled = agent.config?.tools.filter((t) => t.enabled) ?? [];
    blocks.push({
      kind: 'text',
      text: `יש לי ${enabled.length} כלים פעילים: ${enabled.map((t) => t.name).join(', ') || 'אין'}.`,
    });
  } else if (/הצעה|המלצה|מה כדאי|מה לעשות/.test(p)) {
    blocks.push({
      kind: 'text',
      text: domainSuggestion(agent),
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'תכנן פעולה חדשה', prompt: domainPlanPrompt(agent) },
        { label: 'מצב יחידותיי', prompt: 'מה מצב היחידות המקושרות אליי?' },
      ],
    });
  } else if (/שלום|הי|היי|hello|hi/.test(p)) {
    blocks.push({
      kind: 'text',
      text: greeting(agent),
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'מה המצב?', prompt: 'מה המצב שלך כעת?' },
        { label: 'הצג משימות', prompt: 'אילו משימות פתוחות לי?' },
        { label: 'מי כפוף אליי?', prompt: 'אילו יחידות מקושרות אליי?' },
      ],
    });
  } else {
    // Generic fallback - acknowledge in agent's voice
    blocks.push({
      kind: 'text',
      text: fallback(agent, prompt),
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'מה המצב?', prompt: 'מה המצב שלך?' },
        { label: 'משימות פתוחות', prompt: 'הצג משימות פעילות' },
        { label: 'הצעות לפעולה', prompt: 'יש לך המלצה לפעולה?' },
      ],
    });
  }

  return {
    id: `am-${uid()}`,
    role: 'assistant',
    timestamp: new Date().toISOString(),
    blocks,
    autonomy: agent.autonomy,
  };
}

// ─── helpers: domain-aware copy ─────────────────────────────────────────

function signature(s: Agent['config'] extends infer T ? (T extends { style: infer S } ? S : never) : never): string {
  // not used directly - kept for symmetry; AI agent_chat header already shows signature
  return '';
}

function greeting(agent: Agent): string {
  const sig = agent.config?.style.signature ?? agent.name;
  const d = agent.domain;
  if (d === 'fire') return `${sig} מדווח. כל הפלוגות בכוננות. במה אסייע?`;
  if (d === 'intel') return `${sig} מאזין. תמונת המודיעין מתעדכנת בזמן אמת. שאל אותי כל דבר.`;
  if (d === 'air') return `${sig} בעמדה. מרחב אווירי תחת בקרה. במה אטפל?`;
  if (d === 'water') return `${sig} בניטור. כל החיישנים פעילים.`;
  if (d === 'logistics') return `${sig} זמין. שרשרת אספקה תקינה.`;
  if (d === 'cyber') return `${sig}. סריקת רשת אקטיבית. ⚠ קיימת תקלת תקשורת ל-feed חיצוני.`;
  return `${sig} בעמדה.`;
}

function domainStatusReply(agent: Agent, inProgress: number, planned: number, pending: number): string {
  const d = agent.domain;
  const sig = agent.config?.style.signature ?? agent.name;
  const baseStats = `${inProgress} משימות בביצוע, ${planned} מתוכננות, ${pending} ממתינות.`;
  if (d === 'fire') return `${sig}: ${baseStats} פלוגות א' ו-ב' מוכנות, תחמושת ב-87% מצאי. ממליץ להתחיל ההיערכות לסקטור צפון.`;
  if (d === 'intel') return `${sig}: ${baseStats} שלושה ניתוחים פעילים במקביל. מקור B-7 דורש אימות נוסף.`;
  if (d === 'air') return `${sig}: ${baseStats} UAV-7 בטיסה, יסעור-12 בכוננות 5. מרחב אווירי נקי.`;
  if (d === 'water') return `${sig}: ${baseStats} ניטור מפלסים תקין. אין חריגות מפרופיל בסיס.`;
  if (d === 'logistics') return `${sig}: ${baseStats} כל הטורים בלוח זמנים. מצאי דלק 78%.`;
  if (d === 'cyber') return `${sig}: ${baseStats} ⚠ feed חיצוני מנותק 47 דקות. דורש התערבות.`;
  return `${sig}: ${baseStats}`;
}

function domainSuggestion(agent: Agent): string {
  const d = agent.domain;
  const sig = agent.config?.style.signature ?? agent.name;
  if (d === 'fire') return `${sig}: ממליץ להתחיל בהיערכות מקדימה לסקטור צפון-מערב. תנועה חריגה זוהתה לפני 12 דקות.`;
  if (d === 'intel') return `${sig}: ממליץ להעמיק חקירה במקור B-7. הצלבת מקורות מעלה רמת ביטחון נמוכה-בינונית.`;
  if (d === 'air') return `${sig}: ממליץ לשלוח סיור נוסף לגזרה הצפון-מזרחית. החלון הקרוב הוא 14:30.`;
  if (d === 'water') return `${sig}: מצב יציב, ללא המלצות לפעולה חריגה כעת.`;
  if (d === 'logistics') return `${sig}: כדאי להקדים אספקת דלק לטור 3. ב-19:00 צפי לחציית סף.`;
  if (d === 'cyber') return `${sig}: ⚠ עדיפות לטפל בתקלת תקשורת ל-feed לפני כל פעולה אחרת.`;
  return `${sig}: אין המלצות מיוחדות כעת.`;
}

function domainPlanPrompt(agent: Agent): string {
  const d = agent.domain;
  if (d === 'fire') return 'תכנן הפעלת אש לסקטור צפון-מערב';
  if (d === 'intel') return 'תכנן חקירה מעמיקה במקור B-7';
  if (d === 'air') return 'תכנן שיגור סיור לצפון-מזרח';
  if (d === 'water') return 'תכנן סריקת מצוף מפלסים';
  if (d === 'logistics') return 'תכנן הקדמת אספקת דלק לטור 3';
  if (d === 'cyber') return 'תכנן אבחון feed החיצוני';
  return 'תכנן פעולה חדשה';
}

function fallback(agent: Agent, prompt: string): string {
  const sig = agent.config?.style.signature ?? agent.name;
  return `${sig}: קיבלתי "${prompt.slice(0, 40)}". אני יכול לסייע במצב, משימות, יחידות מקושרות, ובהצעות לפעולה ספציפיות לדומיין שלי.`;
}
