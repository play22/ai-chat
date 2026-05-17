import type { Agent, AgentConfig, AgentDomain } from '../state/types';

const baseStyle = (signature: string): AgentConfig['style'] => ({
  tone: 'tactical',
  verbosity: 'standard',
  language: 'he',
  signature,
  useEmoji: false,
  citeSources: true,
});

const basePerms = (): AgentConfig['permissions'] => ({
  canCreateTasks: true,
  canDispatchUnits: false,
  canEscalateAlerts: true,
  canModifyEntities: false,
  canAccessClassified: false,
  canExecuteAuto: false,
  autoApprovalThreshold: 'low',
  maxParallelTasks: 5,
});

const configFor = (domain: AgentDomain, name: string): AgentConfig => {
  const style = baseStyle(name);
  const permissions = basePerms();
  let units: AgentConfig['units'] = [];
  let boundary: AgentConfig['boundary'];
  let tools: AgentConfig['tools'] = [];

  if (domain === 'fire') {
    units = [
      { id: 'u-1', name: 'פלוגה א׳', type: 'company', callsign: 'אריה' },
      { id: 'u-2', name: 'פלוגה ב׳', type: 'company', callsign: 'נמר' },
      { id: 'u-3', name: 'סוללת תותחים 119', type: 'platform', callsign: 'רעם' },
    ];
    boundary = {
      label: 'אחריות גזרה צפון-מערב',
      kind: 'area',
      area: [{ x: 5, y: 5 }, { x: 45, y: 5 }, { x: 48, y: 35 }, { x: 8, y: 38 }],
    };
    permissions.canDispatchUnits = true;
    permissions.autoApprovalThreshold = 'medium';
    tools = [
      { id: 't-1', name: 'חישוב פרמטרי ירי', description: 'מחשב טווח/אזימוט/זמן טיסה לפי קואורדינטות', type: 'analysis', enabled: true, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
      { id: 't-2', name: 'דיווח BDA', description: 'יוצר דו"ח Battle Damage Assessment אוטומטי', type: 'action', enabled: true, createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
    ];
  } else if (domain === 'intel') {
    units = [
      { id: 'u-4', name: 'תחנת SIGINT צפון', type: 'sensor', callsign: 'אוזן' },
      { id: 'u-5', name: 'תא ניתוח 8200', type: 'cell' },
    ];
    permissions.canAccessClassified = true;
    permissions.maxParallelTasks = 10;
    tools = [
      { id: 't-3', name: 'הצלבת מקורות', description: 'מצליב מידע מ-OSINT, SIGINT ו-HUMINT', type: 'analysis', enabled: true, createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
      { id: 't-4', name: 'שאילתת מאגר ביומטרי', description: 'חיפוש זהויות במאגר', type: 'query', enabled: true, createdAt: new Date(Date.now() - 86400000 * 45).toISOString() },
      { id: 't-5', name: 'webhook ל-Mossad-API', description: 'משיכת רשימות עניין מצד שלישי', type: 'webhook', endpoint: 'https://internal/api/mossad', enabled: false, createdAt: new Date(Date.now() - 86400000 * 7).toISOString() },
    ];
  } else if (domain === 'air') {
    units = [
      { id: 'u-6', name: 'UAV-7', type: 'platform', callsign: 'ינשוף' },
      { id: 'u-7', name: 'מסוק יסעור-12', type: 'platform', callsign: 'נחש' },
      { id: 'u-8', name: 'מטח-3', type: 'platform' },
    ];
    boundary = {
      label: 'מרחב אווירי דרום',
      kind: 'area',
      area: [{ x: 22, y: 60 }, { x: 78, y: 60 }, { x: 80, y: 95 }, { x: 20, y: 95 }],
    };
    permissions.canDispatchUnits = true;
    permissions.canExecuteAuto = true;
    permissions.autoApprovalThreshold = 'high';
    tools = [
      { id: 't-6', name: 'תכנן מסלול UAV', description: 'מייצר waypoints עם הימנעות מאזורי סיכון', type: 'analysis', enabled: true, createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
      { id: 't-7', name: 'הקצאת מטרה', description: 'מקצה מטרה לפלטפורמה הקרובה ביותר', type: 'action', enabled: true, createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
    ];
  } else if (domain === 'water') {
    units = [
      { id: 'u-9', name: 'מצוף ניטור 4', type: 'sensor' },
      { id: 'u-10', name: 'ספינת דבור-22', type: 'platform' },
    ];
    boundary = { label: 'מרחב נמל ומפרץ', kind: 'area', area: [{ x: 60, y: 50 }, { x: 90, y: 52 }, { x: 92, y: 70 }, { x: 62, y: 68 }] };
    tools = [
      { id: 't-8', name: 'ניתוח מפלסים', description: 'מזהה חריגות במפלס מים בזמן אמת', type: 'analysis', enabled: true, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
    ];
  } else if (domain === 'logistics') {
    units = [
      { id: 'u-11', name: 'טור 3', type: 'company' },
      { id: 'u-12', name: 'מחסן צפון', type: 'cell' },
    ];
    permissions.canDispatchUnits = true;
    tools = [
      { id: 't-9', name: 'אופטימיזציית מסלול הספקה', description: 'מחשב מסלול מיטבי בין מחסנים ויחידות', type: 'analysis', enabled: true, createdAt: new Date(Date.now() - 86400000 * 75).toISOString() },
      { id: 't-10', name: 'תזכורת אספקה', description: 'שולח אוטומטית התרעה כאשר מצאי יורד מסף', type: 'action', enabled: true, createdAt: new Date(Date.now() - 86400000 * 10).toISOString() },
    ];
  } else if (domain === 'cyber') {
    permissions.canAccessClassified = true;
    permissions.canModifyEntities = false;
    tools = [
      { id: 't-11', name: 'סריקת רשת', description: 'מאתר פורטים פתוחים וסיכונים', type: 'query', enabled: true, createdAt: new Date(Date.now() - 86400000 * 200).toISOString() },
    ];
  }

  return { style, permissions, units, boundary, tools };
};

export const initialAgents: Agent[] = [
  {
    id: 'agent-fire',
    name: 'סוכן אש',
    domain: 'fire',
    status: 'active',
    autonomy: 'recommend',
    activeTasks: 3,
    successRate: 0.94,
    lastActivity: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    config: configFor('fire', 'סוכן אש'),
  },
  {
    id: 'agent-intel',
    name: 'סוכן מודיעין',
    domain: 'intel',
    status: 'active',
    autonomy: 'recommend',
    activeTasks: 7,
    successRate: 0.88,
    lastActivity: new Date(Date.now() - 1000 * 30).toISOString(),
    config: configFor('intel', 'סוכן מודיעין'),
  },
  {
    id: 'agent-water',
    name: 'סוכן אגם',
    domain: 'water',
    status: 'idle',
    autonomy: 'observe',
    activeTasks: 1,
    successRate: 0.97,
    lastActivity: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
    config: configFor('water', 'סוכן אגם'),
  },
  {
    id: 'agent-air',
    name: 'סוכן אוויר',
    domain: 'air',
    status: 'active',
    autonomy: 'autonomous',
    activeTasks: 5,
    successRate: 0.91,
    lastActivity: new Date(Date.now() - 1000 * 60).toISOString(),
    config: configFor('air', 'סוכן אוויר'),
  },
  {
    id: 'agent-logistics',
    name: 'סוכן לוגיסטיקה',
    domain: 'logistics',
    status: 'active',
    autonomy: 'recommend',
    activeTasks: 2,
    successRate: 0.99,
    lastActivity: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    config: configFor('logistics', 'סוכן לוגיסטיקה'),
  },
  {
    id: 'agent-cyber',
    name: 'סוכן סייבר',
    domain: 'cyber',
    status: 'error',
    autonomy: 'observe',
    activeTasks: 0,
    successRate: 0.82,
    lastActivity: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    config: configFor('cyber', 'סוכן סייבר'),
  },
];
