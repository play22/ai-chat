import type { AutomationRule } from '../state/types';

export const initialRules: AutomationRule[] = [
  {
    id: 'rule-1',
    name: 'איתור איום בגזרת צפון → סוכן אש',
    enabled: true,
    trigger: { type: 'detection', entityType: 'threat', areaLabel: 'גזרה צפונית' },
    action: { type: 'create_task', targetAgentId: 'agent-fire', priority: 'high', message: 'הקצה אש לאיתור' },
    lastFired: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    firedCount: 12,
  },
  {
    id: 'rule-2',
    name: 'חציית סף תנועה → סוכן מודיעין',
    enabled: true,
    trigger: { type: 'threshold', threshold: { metric: 'תנועה/דקה', op: '>', value: 30 } },
    action: { type: 'notify', targetAgentId: 'agent-intel', priority: 'medium', message: 'הסלם לאנליסט בכיר' },
    firedCount: 4,
  },
  {
    id: 'rule-3',
    name: 'דו"ח אגם - כל 6 שעות',
    enabled: false,
    trigger: {
      type: 'schedule',
      schedule: {
        recurrence: 'hourly',
        startAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        intervalHours: 6,
      },
    },
    action: { type: 'create_task', targetAgentId: 'agent-water', priority: 'low', message: 'הפק דו"ח מצב מפלסים' },
    firedCount: 28,
  },
];
