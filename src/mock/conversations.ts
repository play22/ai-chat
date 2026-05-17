import type { Conversation } from '../state/types';

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000).toISOString();

export const initialConversations: Conversation[] = [
  { id: 'c-1', title: 'תחקיר אירוע 0312', startedAt: hoursAgo(2), messageCount: 14, preview: 'סיכום פעולות וניתוח החלטות במהלך האירוע' },
  { id: 'c-2', title: 'תכנון מבצע "ברק כחול"', startedAt: hoursAgo(8), messageCount: 32, preview: 'יעדים, ציר התקדמות, חלוקת אש בין הסוכנים' },
  { id: 'c-3', title: 'הערכת מצב בוקר', startedAt: hoursAgo(18), messageCount: 9, preview: 'סטטוס יחידות, מזג אוויר, התרעות בתוקף' },
  { id: 'c-4', title: 'בירור התרעת סייבר', startedAt: hoursAgo(26), messageCount: 21, preview: 'ניתוח דפוס תקיפה, המלצות לפעולה' },
  { id: 'c-5', title: 'דו"ח שבועי לאלוף', startedAt: hoursAgo(72), messageCount: 5, preview: 'תקציר הישגים ולקחים מהשבוע החולף' },
];
