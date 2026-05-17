import type { Task, GeoContext } from '../state/types';

const ZONES: Record<string, GeoContext> = {
  north: {
    label: 'גזרה צפון-מערב',
    kind: 'area',
    area: [{ x: 8, y: 8 }, { x: 38, y: 6 }, { x: 42, y: 28 }, { x: 12, y: 32 }],
  },
  northeast: {
    label: 'גזרה צפון-מזרח',
    kind: 'area',
    area: [{ x: 55, y: 8 }, { x: 92, y: 10 }, { x: 88, y: 32 }, { x: 58, y: 30 }],
  },
  south: {
    label: 'גזרה דרומית',
    kind: 'area',
    area: [{ x: 25, y: 70 }, { x: 70, y: 68 }, { x: 75, y: 92 }, { x: 22, y: 94 }],
  },
  harbor: {
    label: 'נמל ומפרץ',
    kind: 'area',
    area: [{ x: 60, y: 50 }, { x: 90, y: 52 }, { x: 92, y: 70 }, { x: 62, y: 68 }],
  },
  centralRoute: {
    label: 'ציר תנועה מרכזי',
    kind: 'area',
    area: [{ x: 30, y: 45 }, { x: 65, y: 47 }, { x: 65, y: 55 }, { x: 30, y: 53 }],
  },
  outpost: {
    label: 'עמדה 4',
    kind: 'point',
    point: { x: 22, y: 42 },
  },
  uavOrbit: {
    label: 'מסלול UAV-7',
    kind: 'point',
    point: { x: 72, y: 48 },
  },
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000).toISOString();
const minutesAhead = (m: number) => new Date(Date.now() + m * 60 * 1000).toISOString();

export const initialTasks: Task[] = [
  { id: 't-1', agentId: 'agent-fire', title: 'הכוונת אש לסקטור צפון-מערב', status: 'in_progress', priority: 'high', createdAt: minutesAgo(12), startedAt: minutesAgo(10), eta: minutesAhead(8), progress: 65, geo: ZONES.north },
  { id: 't-2', agentId: 'agent-fire', title: 'עדכון מצאי תחמושת בעמדה 4', status: 'pending', priority: 'medium', createdAt: minutesAgo(35), eta: minutesAhead(20), progress: 0, geo: ZONES.outpost },
  { id: 't-3', agentId: 'agent-fire', title: 'תיאום עם פלוגה ב׳', status: 'completed', priority: 'low', createdAt: minutesAgo(120), startedAt: minutesAgo(115), completedAt: minutesAgo(95), progress: 100 },
  { id: 't-3b', agentId: 'agent-fire', title: 'אימון הפעלת מערך', status: 'planned', priority: 'low', createdAt: minutesAgo(60), scheduledFor: minutesAhead(180) },

  { id: 't-4', agentId: 'agent-intel', title: 'ניתוח תמונת SIGINT אחרונה', status: 'in_progress', priority: 'critical', createdAt: minutesAgo(4), startedAt: minutesAgo(3), eta: minutesAhead(15), progress: 40, geo: ZONES.northeast },
  { id: 't-5', agentId: 'agent-intel', title: 'הצלבת מקורות OSINT', status: 'in_progress', priority: 'high', createdAt: minutesAgo(22), startedAt: minutesAgo(20), eta: minutesAhead(30), progress: 55 },
  { id: 't-6', agentId: 'agent-intel', title: 'דו"ח יומי לאלוף', status: 'pending', priority: 'medium', createdAt: minutesAgo(60), eta: minutesAhead(120), progress: 0 },
  { id: 't-6b', agentId: 'agent-intel', title: 'הערכת מצב ערב', status: 'planned', priority: 'medium', createdAt: minutesAgo(200), scheduledFor: minutesAhead(240) },
  { id: 't-7', agentId: 'agent-intel', title: 'אימות זהות בכיר באזור B-7', status: 'failed', priority: 'high', createdAt: minutesAgo(200), startedAt: minutesAgo(190), progress: 78, geo: { label: 'אזור B-7', kind: 'point', point: { x: 48, y: 38 } } },
  { id: 't-7b', agentId: 'agent-intel', title: 'סריקה רחבת-טווח גזרה צפון', status: 'completed', priority: 'high', createdAt: minutesAgo(240), startedAt: minutesAgo(230), completedAt: minutesAgo(180), progress: 100 },

  { id: 't-8', agentId: 'agent-water', title: 'ניטור מפלסים בנמל', status: 'in_progress', priority: 'low', createdAt: minutesAgo(45), startedAt: minutesAgo(40), eta: minutesAhead(180), progress: 30, geo: ZONES.harbor },
  { id: 't-8b', agentId: 'agent-water', title: 'דו"ח אגם 6-שעתי', status: 'planned', priority: 'low', createdAt: minutesAgo(10), scheduledFor: minutesAhead(60) },

  { id: 't-9', agentId: 'agent-air', title: 'תכנון מסלול UAV-7', status: 'in_progress', priority: 'high', createdAt: minutesAgo(8), startedAt: minutesAgo(7), eta: minutesAhead(5), progress: 85, geo: ZONES.uavOrbit },
  { id: 't-10', agentId: 'agent-air', title: 'בדיקת מרחב אווירי - גזרה דרום', status: 'completed', priority: 'medium', createdAt: minutesAgo(90), startedAt: minutesAgo(85), completedAt: minutesAgo(60), progress: 100, geo: ZONES.south },
  { id: 't-11', agentId: 'agent-air', title: 'שיגור סורק לאזור איתור', status: 'in_progress', priority: 'critical', createdAt: minutesAgo(2), startedAt: minutesAgo(1), eta: minutesAhead(12), progress: 25, geo: ZONES.northeast },
  { id: 't-11b', agentId: 'agent-air', title: 'סבב סיור 14:00', status: 'planned', priority: 'medium', createdAt: minutesAgo(180), scheduledFor: minutesAhead(45), geo: ZONES.south },
  { id: 't-11c', agentId: 'agent-air', title: 'סבב סיור 17:00', status: 'planned', priority: 'medium', createdAt: minutesAgo(180), scheduledFor: minutesAhead(225), geo: ZONES.north },

  // ─── Multi-agent tasks (coordinator + sub-agents) ───
  {
    id: 't-multi-1',
    agentId: 'agent-fire',
    subAgentIds: ['agent-intel', 'agent-air'],
    title: 'תקיפה משולבת בגזרה צפון-מזרח',
    status: 'in_progress',
    priority: 'critical',
    createdAt: minutesAgo(18),
    startedAt: minutesAgo(15),
    eta: minutesAhead(25),
    progress: 50,
    geo: ZONES.northeast,
  },
  {
    id: 't-multi-2',
    agentId: 'agent-intel',
    subAgentIds: ['agent-air', 'agent-cyber'],
    title: 'איסוף מודיעין רב-מקורי לקראת מבצע',
    status: 'planned',
    priority: 'high',
    createdAt: minutesAgo(50),
    scheduledFor: minutesAhead(120),
    geo: ZONES.north,
  },

  { id: 't-12', agentId: 'agent-logistics', title: 'תיגבור דלק לטור 3', status: 'pending', priority: 'medium', createdAt: minutesAgo(55), eta: minutesAhead(90), progress: 0, geo: ZONES.centralRoute },
  { id: 't-12b', agentId: 'agent-logistics', title: 'אספקת מזון יומית', status: 'planned', priority: 'low', createdAt: minutesAgo(30), scheduledFor: minutesAhead(150), geo: ZONES.centralRoute },
  { id: 't-12c', agentId: 'agent-logistics', title: 'הכנת תיק יציאה', status: 'completed', priority: 'high', createdAt: minutesAgo(300), startedAt: minutesAgo(290), completedAt: minutesAgo(150), progress: 100 },
];
