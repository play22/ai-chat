import { Flame, Eye, Droplets, Truck, Shield, Plane, type LucideIcon } from 'lucide-react';
import type { AgentDomain, AutonomyLevel, Priority, EntityType, AgentStatus, TaskStatus } from '../../state/types';

export const domainIcon: Record<AgentDomain, LucideIcon> = {
  fire: Flame,
  intel: Eye,
  water: Droplets,
  logistics: Truck,
  cyber: Shield,
  air: Plane,
};

export const domainColor: Record<AgentDomain, string> = {
  fire: 'text-danger',
  intel: 'text-info',
  water: 'text-info',
  logistics: 'text-warn',
  cyber: 'text-accent',
  air: 'text-accent',
};

export const domainHex: Record<AgentDomain, string> = {
  fire: '#ef4444',
  intel: '#60a5fa',
  water: '#3b82f6',
  air: '#5ce1a4',
  logistics: '#f5a524',
  cyber: '#a78bfa',
};

export const autonomyLabel: Record<AutonomyLevel, string> = {
  observe: 'תצפית בלבד',
  recommend: 'המלצה לפעולה',
  autonomous: 'פעולה אוטומטית',
};

export const autonomyTone: Record<AutonomyLevel, 'neutral' | 'info' | 'warn'> = {
  observe: 'neutral',
  recommend: 'info',
  autonomous: 'warn',
};

export const priorityLabel: Record<Priority, string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  critical: 'קריטית',
};

export const priorityTone: Record<Priority, 'neutral' | 'info' | 'warn' | 'critical'> = {
  low: 'neutral',
  medium: 'info',
  high: 'warn',
  critical: 'critical',
};

export const statusLabel: Record<AgentStatus, string> = {
  active: 'פעיל',
  idle: 'סרק',
  error: 'שגיאה',
  offline: 'מנותק',
};

export const statusTone: Record<AgentStatus, 'success' | 'neutral' | 'danger' | 'warn'> = {
  active: 'success',
  idle: 'neutral',
  error: 'danger',
  offline: 'warn',
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  planned: 'מתוכננת',
  pending: 'ממתינה',
  in_progress: 'בביצוע',
  completed: 'הושלמה',
  failed: 'נכשלה',
};

export const taskStatusTone: Record<TaskStatus, 'neutral' | 'info' | 'success' | 'danger' | 'warn'> = {
  planned: 'warn',
  pending: 'neutral',
  in_progress: 'info',
  completed: 'success',
  failed: 'danger',
};

export const entityTypeLabel: Record<EntityType, string> = {
  threat: 'איום',
  asset: 'נכס',
  unit: 'יחידה',
  poi: 'נקודת עניין',
};

export const entityTypeColor: Record<EntityType, string> = {
  threat: '#ef4444',
  asset: '#5ce1a4',
  unit: '#60a5fa',
  poi: '#f5a524',
};

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'הרגע';
  if (min < 60) return `לפני ${min} ד׳`;
  const h = Math.floor(min / 60);
  if (h < 24) return `לפני ${h} ש׳`;
  const d = Math.floor(h / 24);
  return `לפני ${d} ימים`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}
