import type { Agent, AutonomyLevel, ChatMessage, GeoContext, MessageBlock, Task } from '../state/types';

const uid = () => Math.random().toString(36).slice(2, 10);

interface ResponderInput {
  prompt: string;
  attachments?: ChatMessage['attachments'];
  agents: Agent[];
  tasks: Task[];
  autonomy: AutonomyLevel;
}

export async function generateAIResponse(input: ResponderInput): Promise<ChatMessage> {
  const delay = 700 + Math.random() * 900;
  await new Promise((r) => setTimeout(r, delay));

  const p = input.prompt.toLowerCase();
  const blocks: MessageBlock[] = [];

  // ─── Plan proposal: route to relevant agent based on keywords ───
  const planMatch = matchPlanRequest(input.prompt, input.agents);
  if (planMatch) {
    const { agent, subAgentIds, scheduledFor, title, reasoning, steps, priority, geo } = planMatch;
    blocks.push({
      kind: 'text',
      text:
        `קלטתי את הבקשה. ניתחתי את ההקשר ובחרתי ב${agent.name} כסוכן המתאים ביותר${subAgentIds?.length ? ' (כמתאם משימה רב-סוכנית)' : ''}. ` +
        (geo ? `אזור הפעולה זוהה: ${geo.label}. ` : '') +
        `בניתי תוכנית פעולה מפורטת — נא לעבור עליה ולאשר לפני שאהפוך אותה למשימה פעילה.`,
    });
    blocks.push({
      kind: 'plan_proposal',
      agentId: agent.id,
      subAgentIds,
      reasoning,
      title,
      scheduledFor,
      priority,
      steps,
      geo,
    });
    return {
      id: `m-${uid()}`,
      role: 'assistant',
      timestamp: new Date().toISOString(),
      blocks,
      autonomy: input.autonomy,
    };
  }

  // Status query → table
  if (/סטטוס|מצב/.test(p) && /סוכנ/.test(p)) {
    blocks.push({ kind: 'text', text: 'להלן תמונת מצב עדכנית של הסוכנים הפעילים. הסוכן "סייבר" במצב שגיאה ודורש התערבות.' });
    blocks.push({
      kind: 'table',
      title: 'מצב סוכני AI',
      columns: [
        { key: 'name', label: 'סוכן' },
        { key: 'status', label: 'סטטוס' },
        { key: 'tasks', label: 'משימות', align: 'center' },
        { key: 'success', label: 'הצלחה', align: 'end' },
      ],
      rows: input.agents.map((a) => ({
        name: a.name,
        status: statusLabel(a.status),
        tasks: a.activeTasks,
        success: `${Math.round(a.successRate * 100)}%`,
      })),
      rowSeverity: input.agents.reduce<Record<number, any>>((acc, a, i) => {
        if (a.status === 'error') acc[i] = 'critical';
        else if (a.status === 'offline') acc[i] = 'high';
        return acc;
      }, {}),
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'אבחן את סוכן סייבר', prompt: 'בדוק מה הסיבה לתקלה בסוכן הסייבר' },
        { label: 'הצג משימות קריטיות', prompt: 'אילו משימות קריטיות פתוחות כעת?' },
      ],
    });
  } else if (/איום|איתור|מתגלה|התרעה/.test(p)) {
    blocks.push({
      kind: 'text',
      text: 'התקבל איתור חדש בגזרה הצפון-מזרחית. הצלבת מקורות מעלה רמת ביטחון בינונית-גבוהה. מומלץ להפעיל סוכן אש למעקב.',
    });
    blocks.push({
      kind: 'action_card',
      title: 'איום פוטנציאלי - 34.7°N, 32.1°E',
      description: 'תנועה חריגה זוהתה ע"י סורק UAV-7. ב-90 השניות האחרונות התקדמה הישות כ-120 מטר דרומה.',
      severity: 'high',
      actions: [
        { id: 'dispatch_fire', label: 'הקצה סוכן אש', variant: 'primary' },
        { id: 'escalate', label: 'הסלם לאלוף', variant: 'danger' },
        { id: 'dismiss', label: 'דחה', variant: 'ghost' },
      ],
    });
    blocks.push({
      kind: 'entity_suggestion',
      rationale: 'הוסף ישות "איום פוטנציאלי" לתמונת המצב כדי לאפשר מעקב מתמשך והפעלת חוקי אוטומציה.',
      entity: {
        id: `sugg-${uid()}`,
        type: 'threat',
        label: 'איום פוטנציאלי 04',
        position: { x: 58 + Math.random() * 10, y: 28 + Math.random() * 8 },
        status: 'suggested',
        source: 'ai_suggestion',
      },
    });
  } else if (/סכם|תקציר|דוח|דו"ח/.test(p)) {
    blocks.push({
      kind: 'text',
      text:
        'במהלך 6 השעות האחרונות בוצעו 47 פעולות אוטומטיות. 3 חוקי אוטומציה פעלו: ' +
        '"איתור איום בגזרת צפון" הופעל פעמיים והוקצה לסוכן אש. ' +
        '"חציית סף תנועה" יצרה התרעה אחת ב-09:42. ' +
        'מצב כללי תקין, ללא חריגות שמחייבות התערבות מפקדת.',
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'הצג את האירועים המלאים', prompt: 'הצג טבלת אירועים מ-6 השעות האחרונות' },
        { label: 'ייצא דו"ח PDF', prompt: 'צור דו"ח PDF של 6 השעות האחרונות' },
        { label: 'השווה לאתמול', prompt: 'השווה את הפעילות לאתמול באותן השעות' },
      ],
    });
  } else if (/אבחן|תקלה|שגיאה|בדוק/.test(p)) {
    blocks.push({
      kind: 'text',
      text: 'אובחן הסוכן וזוהתה תקלה בתקשורת ל-feed החיצוני מאז 11:14. נסיון התחברות חוזר נכשל 3 פעמים. מומלץ להפעיל אבחון עומק.',
    });
    blocks.push({
      kind: 'action_card',
      title: 'תקלת תקשורת בסוכן סייבר',
      description: 'feed: threat-intel-stream-A · last error: handshake timeout · attempts: 3',
      severity: 'medium',
      actions: [
        { id: 'restart_agent', label: 'הפעל מחדש', variant: 'primary' },
        { id: 'open_logs', label: 'פתח לוגים', variant: 'ghost' },
      ],
    });
  } else if (input.attachments && input.attachments.length) {
    const a = input.attachments[0];
    blocks.push({
      kind: 'text',
      text:
        a.kind === 'area'
          ? `התקבל תיחום אזור (${a.label}). מנתח את האזור עבור ישויות פעילות וחוקי אוטומציה רלוונטיים.`
          : a.kind === 'image'
            ? `התקבלה תמונה (${a.label}). מבצע ניתוח ויזואלי - זמן משוער 8 שניות.`
            : `התקבלה ישות (${a.label}). מציג מידע מצרפי.`,
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'הפק התרעה על כל תנועה', prompt: 'הגדר התרעה לכל תנועה בתיחום' },
        { label: 'הצג ישויות באזור', prompt: 'אילו ישויות נמצאות בתיחום?' },
      ],
    });
  } else {
    blocks.push({
      kind: 'text',
      text:
        'קיבלתי את הבקשה. אני מסוגל לסייע בניהול סוכני AI, ניתוח איומים, יצירת משימות, הגדרת חוקי אוטומציה, והפקת דו"חות מצב. במה תרצה להתחיל?',
    });
    blocks.push({
      kind: 'quick_actions',
      actions: [
        { label: 'מצב סוכנים', prompt: 'מה סטטוס הסוכנים כעת?' },
        { label: 'איומים פעילים', prompt: 'הצג איומים פעילים בשטח' },
        { label: 'תקציר 6 שעות', prompt: 'סכם את 6 השעות האחרונות' },
        { label: 'חוקי אוטומציה פעילים', prompt: 'אילו חוקי אוטומציה פעילים?' },
      ],
    });
  }

  return {
    id: `m-${uid()}`,
    role: 'assistant',
    timestamp: new Date().toISOString(),
    blocks,
    autonomy: input.autonomy,
  };
}

function statusLabel(s: Agent['status']): string {
  return s === 'active' ? '● פעיל' : s === 'idle' ? '○ סרק' : s === 'error' ? '⚠ שגיאה' : '◌ מנותק';
}

interface PlanMatch {
  agent: Agent;
  subAgentIds?: string[];
  title: string;
  reasoning: string;
  scheduledFor?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  steps: { id: string; title: string; estMinutes: number; detail?: string }[];
  geo?: GeoContext;
}

const GEO_ZONES: { rx: RegExp; geo: GeoContext }[] = [
  {
    rx: /צפון[- ]?מערב|צפון מערב/,
    geo: { label: 'גזרה צפון-מערב', kind: 'area', area: [{ x: 8, y: 8 }, { x: 38, y: 6 }, { x: 42, y: 28 }, { x: 12, y: 32 }] },
  },
  {
    rx: /צפון[- ]?מזרח|צפון מזרח/,
    geo: { label: 'גזרה צפון-מזרח', kind: 'area', area: [{ x: 55, y: 8 }, { x: 92, y: 10 }, { x: 88, y: 32 }, { x: 58, y: 30 }] },
  },
  {
    rx: /צפונ|צפון/,
    geo: { label: 'גזרה צפונית', kind: 'area', area: [{ x: 10, y: 6 }, { x: 90, y: 8 }, { x: 88, y: 30 }, { x: 12, y: 32 }] },
  },
  {
    rx: /דרומ|דרום/,
    geo: { label: 'גזרה דרומית', kind: 'area', area: [{ x: 25, y: 70 }, { x: 70, y: 68 }, { x: 75, y: 92 }, { x: 22, y: 94 }] },
  },
  {
    rx: /נמל|מפרץ|חוף/,
    geo: { label: 'נמל ומפרץ', kind: 'area', area: [{ x: 60, y: 50 }, { x: 90, y: 52 }, { x: 92, y: 70 }, { x: 62, y: 68 }] },
  },
  {
    rx: /ציר|טור|תנועה|כביש/,
    geo: { label: 'ציר תנועה מרכזי', kind: 'area', area: [{ x: 30, y: 45 }, { x: 65, y: 47 }, { x: 65, y: 55 }, { x: 30, y: 53 }] },
  },
  {
    rx: /b[-]?7|ב[-]?7/i,
    geo: { label: 'אזור B-7', kind: 'point', point: { x: 48, y: 38 } },
  },
];

function extractGeo(prompt: string): GeoContext | undefined {
  const hit = GEO_ZONES.find((g) => g.rx.test(prompt));
  return hit?.geo;
}

// Map domain keywords → agent domain
const domainKeywords: { rx: RegExp; domain: Agent['domain']; reason: string }[] = [
  { rx: /אש|ירי|הפגז|תקיפ/, domain: 'fire', reason: 'הבקשה כוללת מילים הקשורות לאש/ירי - הסוכן המתמחה הוא סוכן האש.' },
  { rx: /מודיעי|סיגינט|sigint|אוסינט|osint|זיהוי|הצלב/, domain: 'intel', reason: 'הבקשה דורשת איסוף ועיבוד מידע - מופנית לסוכן המודיעין.' },
  { rx: /מטוס|כטב|כט"ב|uav|רחפן|אוויר|טיסה|סייר/, domain: 'air', reason: 'הבקשה עוסקת במרחב האווירי - מופנית לסוכן האוויר.' },
  { rx: /אגם|מים|נמל|ימי|מפלס|חוף/, domain: 'water', reason: 'הבקשה עוסקת במרחב הימי - מופנית לסוכן האגם.' },
  { rx: /לוגיסטי|אספק|דלק|תחמוש|תיגבור|מזון/, domain: 'logistics', reason: 'הבקשה לוגיסטית - מופנית לסוכן הלוגיסטיקה.' },
  { rx: /סייבר|תקיפת רשת|רשת|דיגיט/, domain: 'cyber', reason: 'הבקשה בתחום הסייבר - מופנית לסוכן הסייבר.' },
];

// Extract HH:MM or "בשעה X" and produce ISO scheduledFor in next 24h
function extractScheduledTime(prompt: string): string | undefined {
  const hhmm = prompt.match(/(\d{1,2}):(\d{2})/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      const d = new Date();
      d.setSeconds(0, 0);
      d.setHours(h, m);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      return d.toISOString();
    }
  }
  const hOnly = prompt.match(/בשעה\s*(\d{1,2})\b/);
  if (hOnly) {
    const h = Number(hOnly[1]);
    if (h >= 0 && h < 24) {
      const d = new Date();
      d.setSeconds(0, 0);
      d.setHours(h, 0);
      if (d.getTime() < Date.now()) d.setDate(d.getDate() + 1);
      return d.toISOString();
    }
  }
  const inMin = prompt.match(/בעוד\s*(\d+)\s*דק/);
  if (inMin) {
    return new Date(Date.now() + Number(inMin[1]) * 60 * 1000).toISOString();
  }
  const inHr = prompt.match(/בעוד\s*(\d+)\s*שעות?/);
  if (inHr) {
    return new Date(Date.now() + Number(inHr[1]) * 60 * 60 * 1000).toISOString();
  }
  return undefined;
}

function buildSteps(domain: Agent['domain'], when?: string): PlanMatch['steps'] {
  const id = () => Math.random().toString(36).slice(2, 8);
  if (domain === 'fire') {
    return [
      { id: id(), title: 'איסוף מודיעין יעד וזיהוי קואורדינטות', estMinutes: 4, detail: 'הצלבה עם סוכן מודיעין' },
      { id: id(), title: 'חישוב פרמטרי ירי + תיאום עם פלוגות סמוכות', estMinutes: 5 },
      { id: id(), title: when ? `המתנה לזמן ההפעלה (${new Date(when).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})` : 'אישור פיקוד סופי לפני ביצוע', estMinutes: 3 },
      { id: id(), title: 'ביצוע הירי ובקרה מיידית', estMinutes: 6 },
      { id: id(), title: 'דיווח BDA ועדכון תמונת מצב', estMinutes: 5 },
    ];
  }
  if (domain === 'intel') {
    return [
      { id: id(), title: 'הגדרת מקורות (SIGINT / OSINT / HUMINT)', estMinutes: 3 },
      { id: id(), title: 'איסוף ראשוני וסינון רעש', estMinutes: 10 },
      { id: id(), title: 'הצלבה ואימות מקורות', estMinutes: 8 },
      { id: id(), title: 'גיבוש דו"ח מודיעיני', estMinutes: 6 },
      { id: id(), title: 'הפצה לגורמים רלוונטיים', estMinutes: 2 },
    ];
  }
  if (domain === 'air') {
    return [
      { id: id(), title: 'בדיקת מרחב אווירי וטסים פעילים', estMinutes: 3 },
      { id: id(), title: 'תכנון מסלול ומתווה משימה', estMinutes: 6 },
      { id: id(), title: when ? `המתנה לחלון ההפעלה (${new Date(when).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})` : 'תיאום עם בקרת אווירית', estMinutes: 4 },
      { id: id(), title: 'שיגור והפעלת חיישנים', estMinutes: 5 },
      { id: id(), title: 'נחיתה ודיווח ממצאים', estMinutes: 8 },
    ];
  }
  if (domain === 'water') {
    return [
      { id: id(), title: 'סקירת מצב ימי נוכחי', estMinutes: 3 },
      { id: id(), title: 'הפעלת חיישני ניטור באזור', estMinutes: 5 },
      { id: id(), title: 'איסוף נתונים והשוואה לפרופיל', estMinutes: 10 },
      { id: id(), title: 'דיווח חריגות וסיכום', estMinutes: 4 },
    ];
  }
  if (domain === 'logistics') {
    return [
      { id: id(), title: 'אימות מצאי קיים ודרישות', estMinutes: 4 },
      { id: id(), title: 'הקצאת אמצעי הובלה', estMinutes: 3 },
      { id: id(), title: when ? `יציאה מתוזמנת (${new Date(when).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})` : 'יציאה לטור', estMinutes: 2 },
      { id: id(), title: 'הובלה והגעה ליעד', estMinutes: 30 },
      { id: id(), title: 'מסירה ואישור קבלה', estMinutes: 5 },
    ];
  }
  // cyber default
  return [
    { id: id(), title: 'הגדרת יעד התקיפה / ההגנה', estMinutes: 3 },
    { id: id(), title: 'סריקה ראשונית ומיפוי משטח', estMinutes: 8 },
    { id: id(), title: 'ביצוע הפעולה', estMinutes: 10 },
    { id: id(), title: 'תיעוד וסיכום', estMinutes: 4 },
  ];
}

function matchPlanRequest(prompt: string, agents: Agent[]): PlanMatch | null {
  const p = prompt.toLowerCase();
  // require an action verb
  if (!/הפעל|תכנן|בצע|הפק|שגר|הכן|תקיפ|הזז|תזמן|תכניס/.test(p)) return null;

  // Detect ALL matching domains - if multiple, first is coordinator, rest are sub-agents
  const domainHits = domainKeywords.filter((d) => d.rx.test(p));
  if (domainHits.length === 0) return null;

  // Multi-domain request flag (e.g. "משולב" / "תקיפה משולבת" / "ביחד")
  const isExplicitlyJoint = /משולב|ביחד|בשיתוף|רב.?זרועי|רב.?תחומי/.test(p);

  const domainHit = domainHits[0];
  const agent = agents.find((a) => a.domain === domainHit.domain);
  if (!agent) return null;

  // Sub-agents = additional matched domains, OR auto-suggest based on coordinator domain
  let subAgentIds: string[] = [];
  if (domainHits.length > 1) {
    subAgentIds = domainHits.slice(1)
      .map((d) => agents.find((a) => a.domain === d.domain)?.id)
      .filter((x): x is string => !!x);
  } else if (isExplicitlyJoint) {
    // Auto-suggest common sub-agents for coordinator domain
    const auto: Record<string, string[]> = {
      fire: ['intel', 'air'],
      intel: ['cyber'],
      air: ['intel'],
      logistics: ['intel'],
    };
    const wanted = auto[agent.domain] ?? [];
    subAgentIds = wanted
      .map((d) => agents.find((a) => a.domain === d)?.id)
      .filter((x): x is string => !!x);
  }

  const scheduledFor = extractScheduledTime(prompt);
  const geo = extractGeo(prompt);
  const priority: PlanMatch['priority'] = /קריטי|דחוף|מיידי/.test(p) ? 'critical' : /גבוה/.test(p) ? 'high' : scheduledFor ? 'medium' : 'high';

  // Build a title from the prompt (truncated cleaned)
  const title = prompt.trim().replace(/\s+/g, ' ').slice(0, 80);

  let reasoning = domainHit.reason;
  if (subAgentIds.length > 0) {
    const subNames = subAgentIds.map((id) => agents.find((a) => a.id === id)?.name).filter(Boolean).join(', ');
    reasoning += ` משימה רב-סוכנית — ${agent.name} מתאם, תתי-סוכנים: ${subNames}.`;
  }
  if (geo) {
    reasoning += ` אזור פעולה זוהה: ${geo.label}.`;
  }
  if (scheduledFor) {
    const dt = new Date(scheduledFor);
    reasoning += ` זמן הפעלה זוהה: ${dt.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}.`;
  }
  reasoning += ` רמת הצלחה היסטורית של הסוכן: ${Math.round(agent.successRate * 100)}%.`;

  return {
    agent,
    subAgentIds: subAgentIds.length > 0 ? subAgentIds : undefined,
    title,
    reasoning,
    scheduledFor,
    priority,
    steps: buildSteps(agent.domain, scheduledFor),
    geo,
  };
}
