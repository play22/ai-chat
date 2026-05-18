import type { Agent, AutomationRule, EntityType, Priority } from '../state/types';

export interface ParseResult {
  patch: Partial<AutomationRule>;
  understood: string[];   // human-readable bullets of what we extracted
  warnings: string[];     // missing/uncertain things
}

const AGENT_RX: { rx: RegExp; domain: Agent['domain']; verb: string }[] = [
  { rx: /אש|ירי|הפגז|תקיפה/, domain: 'fire', verb: 'הקצה אש' },
  { rx: /מודיעי|sigint|osint|זיהוי|הצלב/i, domain: 'intel', verb: 'אסוף מודיעין' },
  { rx: /אוויר|כט"?ב|uav|רחפן|מטוס|טיסה/i, domain: 'air', verb: 'הפעל סיור אווירי' },
  { rx: /אגם|ימי|נמל|מפלס/, domain: 'water', verb: 'הפעל ניטור ימי' },
  { rx: /לוגיסטי|אספק|דלק|תחמוש|תיגבור/, domain: 'logistics', verb: 'הפעל אספקה' },
  { rx: /סייבר|רשת|דיגיטלי/, domain: 'cyber', verb: 'הפעל סריקת רשת' },
];

const ENTITY_RX: { rx: RegExp; entity: EntityType; label: string }[] = [
  { rx: /איום|חשוד|עוין|טרור/, entity: 'threat', label: 'איום' },
  { rx: /יחיד|פלוג|כוח|חיילים?/, entity: 'unit', label: 'יחידה' },
  { rx: /נכס|מתקן|בסיס/, entity: 'asset', label: 'נכס' },
  { rx: /נקודה|מקום/, entity: 'poi', label: 'נקודת עניין' },
];

const AREA_RX: { rx: RegExp; label: string }[] = [
  { rx: /צפון[- ]?מערב/, label: 'גזרה צפון-מערב' },
  { rx: /צפון[- ]?מזרח/, label: 'גזרה צפון-מזרח' },
  { rx: /צפונ|בצפון/, label: 'גזרה צפונית' },
  { rx: /דרומ|בדרום/, label: 'גזרה דרומית' },
  { rx: /נמל|מפרץ|חוף/, label: 'נמל ומפרץ' },
  { rx: /ציר|כביש/, label: 'ציר תנועה מרכזי' },
  { rx: /b[-]?7|ב[-]?7/i, label: 'אזור B-7' },
];

const PRIORITY_RX: { rx: RegExp; p: Priority }[] = [
  { rx: /קריטי|דחוף ?מאוד|מיידי/, p: 'critical' },
  { rx: /דחוף|חירום/, p: 'high' },
  { rx: /גבוה/, p: 'high' },
  { rx: /בינוני|רגיל/, p: 'medium' },
  { rx: /נמוך|רוטיני|שגרת/, p: 'low' },
];

const ACTION_RX: { rx: RegExp; type: 'create_task' | 'notify' | 'dispatch_unit'; label: string }[] = [
  { rx: /הקצ|הפע|שלח (?:כוח|יחיד)|דחוף יחיד/, type: 'dispatch_unit', label: 'הקצה יחידה' },
  { rx: /התרע|התריע|הודע|תזכור/, type: 'notify', label: 'שלח התרעה' },
  { rx: /צור משימ|פתח משימ|תכנן/, type: 'create_task', label: 'צור משימה' },
];

const THRESHOLD_RX = /(\bתנועה\b|\bאיתורים?\b|\bהתרעות?\b|\bמטרות?\b)\s*(>|מעל|<|מתחת|=|שווה)\s*(\d+)/;

const SCHEDULE_RX: { rx: RegExp; build: () => any }[] = [
  { rx: /כל\s*(\d+)\s*שעות/, build: () => null },
  { rx: /כל יום|יומ(י|ית)/, build: () => null },
  { rx: /כל שבוע|שבועי/, build: () => null },
];

export function parseRuleNL(text: string, agents: Agent[]): ParseResult {
  const understood: string[] = [];
  const warnings: string[] = [];
  const patch: Partial<AutomationRule> = { nlDescription: text };

  if (!text.trim()) {
    warnings.push('לא הוזן טקסט. הזן תיאור של החוק.');
    return { patch, understood, warnings };
  }

  // ── Trigger type detection ──────────────────────────────────────────
  const thresholdMatch = text.match(THRESHOLD_RX);
  const scheduleHit = SCHEDULE_RX.find((s) => s.rx.test(text));
  const intervalMatch = text.match(/כל\s*(\d+)\s*שעות/);

  if (thresholdMatch) {
    const metric = thresholdMatch[1];
    const opRaw = thresholdMatch[2];
    const op = /</.test(opRaw) || opRaw === 'מתחת' ? '<' : /=/.test(opRaw) || /שווה/.test(opRaw) ? '=' : '>';
    patch.trigger = {
      type: 'threshold',
      threshold: { metric, op: op as any, value: Number(thresholdMatch[3]) },
    };
    understood.push(`טריגר: חציית סף — ${metric} ${op} ${thresholdMatch[3]}`);
  } else if (scheduleHit) {
    if (intervalMatch) {
      patch.trigger = {
        type: 'schedule',
        schedule: {
          recurrence: 'hourly',
          startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          intervalHours: Number(intervalMatch[1]),
        },
      };
      understood.push(`טריגר: תזמון — כל ${intervalMatch[1]} שעות`);
    } else if (/יומ/.test(text)) {
      patch.trigger = {
        type: 'schedule',
        schedule: { recurrence: 'daily', startAt: new Date().toISOString(), time: '09:00' },
      };
      understood.push('טריגר: תזמון יומי בשעה 09:00 (ערך ברירת מחדל - ניתן לשנות)');
    } else {
      patch.trigger = {
        type: 'schedule',
        schedule: { recurrence: 'weekly', startAt: new Date().toISOString(), weekday: 0, time: '09:00' },
      };
      understood.push('טריגר: תזמון שבועי (ראשון 09:00 - ניתן לשנות)');
    }
  } else {
    // Default to detection
    const entityHit = ENTITY_RX.find((e) => e.rx.test(text));
    const areaHit = AREA_RX.find((a) => a.rx.test(text));
    patch.trigger = {
      type: 'detection',
      entityType: entityHit?.entity ?? 'threat',
      areaLabel: areaHit?.label ?? '',
    };
    understood.push(
      `טריגר: איתור — ${entityHit?.label ?? 'איום'}${areaHit ? ` ב${areaHit.label}` : ''}`,
    );
    if (!entityHit) warnings.push('לא זוהה סוג ישות מפורש — מוגדר כברירת מחדל "איום".');
    if (!areaHit) warnings.push('לא זוהה אזור — השדה ריק (החוק יחול בכל המרחב).');
  }

  // ── Action: target agent ───────────────────────────────────────────
  const agentHit = AGENT_RX.find((a) => a.rx.test(text));
  const agent = agentHit ? agents.find((a) => a.domain === agentHit.domain) : undefined;

  // ── Action: type ───────────────────────────────────────────────────
  const actionHit = ACTION_RX.find((a) => a.rx.test(text));

  // ── Priority ───────────────────────────────────────────────────────
  const priorityHit = PRIORITY_RX.find((p) => p.rx.test(text));

  if (agent) {
    patch.action = {
      type: actionHit?.type ?? 'create_task',
      targetAgentId: agent.id,
      priority: priorityHit?.p ?? 'medium',
      message: agentHit?.verb ?? 'בצע פעולה',
    };
    understood.push(
      `פעולה: ${actionHit?.label ?? 'צור משימה'} ל${agent.name} בעדיפות ${priorityLabel(patch.action.priority)}`,
    );
  } else {
    warnings.push('לא זוהה סוכן יעד — יש לבחור באופן ידני.');
    patch.action = {
      type: actionHit?.type ?? 'create_task',
      targetAgentId: '',
      priority: priorityHit?.p ?? 'medium',
      message: '',
    };
  }

  if (!priorityHit) {
    warnings.push('לא צוינה עדיפות — ברירת מחדל "בינונית".');
  }

  // Auto-generate name
  if (agentHit && (patch.trigger as any).areaLabel) {
    const t = patch.trigger as any;
    patch.name = `${t.entityType === 'threat' ? 'איתור איום' : 'איתור'} ב${t.areaLabel} → ${agent?.name}`;
  } else if (patch.action?.targetAgentId) {
    patch.name = text.length > 60 ? text.slice(0, 60) + '...' : text;
  }

  return { patch, understood, warnings };
}

function priorityLabel(p: Priority): string {
  return p === 'low' ? 'נמוכה' : p === 'medium' ? 'בינונית' : p === 'high' ? 'גבוהה' : 'קריטית';
}

// ─── Reasoning generators (used in RuleEditor + AutomationPanel) ─────

export function describeRuleLogic(rule: AutomationRule, agents: Agent[], globalAutonomy: string): string {
  const agent = agents.find((a) => a.id === rule.action.targetAgentId);
  if (!agent) return 'חוק לא תקין — לא נבחר סוכן יעד.';

  const triggerSent =
    rule.trigger.type === 'detection'
      ? `כאשר תזוהה ישות מסוג "${entityLabel(rule.trigger.entityType ?? 'threat')}"${rule.trigger.areaLabel ? ` באזור "${rule.trigger.areaLabel}"` : ' (בכל מקום)'}`
      : rule.trigger.type === 'threshold' && rule.trigger.threshold
        ? `כאשר ${rule.trigger.threshold.metric} ${rule.trigger.threshold.op} ${rule.trigger.threshold.value}`
        : rule.trigger.type === 'schedule' && rule.trigger.schedule
          ? scheduleSentence(rule.trigger.schedule)
          : '';

  const actionVerb =
    rule.action.type === 'create_task'
      ? 'תיווצר משימה'
      : rule.action.type === 'notify'
        ? 'תישלח התרעה'
        : 'תוקצה יחידה';

  const agentAutonomy = agent.autonomy;
  const effective = agentAutonomy === 'autonomous' || (agentAutonomy === 'recommend' && globalAutonomy === 'autonomous') ? 'autonomous' : agentAutonomy;
  const willExecute =
    effective === 'autonomous'
      ? 'הפעולה תתבצע **אוטומטית** ללא אישור.'
      : effective === 'recommend'
        ? 'תוצג **המלצה** למפקד שתדרוש אישור לפני ביצוע.'
        : 'תוצג **התרעה תצפיתית בלבד** — לא תתבצע פעולה.';

  return `${triggerSent}, ${actionVerb} ל${agent.name} בעדיפות ${priorityLabel(rule.action.priority)}. ${willExecute}`;
}

function entityLabel(e: EntityType): string {
  return e === 'threat' ? 'איום' : e === 'unit' ? 'יחידה' : e === 'asset' ? 'נכס' : 'נקודת עניין';
}

function scheduleSentence(s: any): string {
  if (s.recurrence === 'once') return `בתאריך ${new Date(s.startAt).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}`;
  if (s.recurrence === 'hourly') return `כל ${s.intervalHours ?? 1} שעות`;
  if (s.recurrence === 'daily') return `מדי יום בשעה ${s.time ?? '09:00'}`;
  if (s.recurrence === 'weekly') return `מדי שבוע ביום ${['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][s.weekday ?? 0]} בשעה ${s.time ?? '09:00'}`;
  return '';
}

// Detect conflicts across rules
export interface RuleConflict {
  type: 'duplicate_trigger' | 'overload' | 'cross_priority';
  message: string;
  ruleIds: string[];
}

export function findConflicts(rules: AutomationRule[], agents: Agent[]): RuleConflict[] {
  const conflicts: RuleConflict[] = [];
  const enabled = rules.filter((r) => r.enabled);

  // Same trigger area+entityType → multiple rules
  const detectKey = (r: AutomationRule) =>
    r.trigger.type === 'detection'
      ? `${r.trigger.entityType ?? '*'}|${r.trigger.areaLabel ?? '*'}`
      : null;

  const byKey: Record<string, AutomationRule[]> = {};
  for (const r of enabled) {
    const k = detectKey(r);
    if (!k) continue;
    (byKey[k] ??= []).push(r);
  }
  for (const [k, group] of Object.entries(byKey)) {
    if (group.length > 1) {
      conflicts.push({
        type: 'duplicate_trigger',
        message: `${group.length} חוקים מופעלים על אותו טריגר (${k.replace('|', ' · ')}) — יבוצעו במקביל.`,
        ruleIds: group.map((r) => r.id),
      });
    }
  }

  // Agent overload: agent that's target of 3+ enabled rules
  const byAgent: Record<string, AutomationRule[]> = {};
  for (const r of enabled) {
    (byAgent[r.action.targetAgentId] ??= []).push(r);
  }
  for (const [agentId, group] of Object.entries(byAgent)) {
    if (group.length >= 3) {
      const agent = agents.find((a) => a.id === agentId);
      conflicts.push({
        type: 'overload',
        message: `${agent?.name ?? 'סוכן'} הוא היעד של ${group.length} חוקים פעילים — שקול האם זה עומס סביר.`,
        ruleIds: group.map((r) => r.id),
      });
    }
  }

  return conflicts;
}
