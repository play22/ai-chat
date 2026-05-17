import type { MapEntity } from '../state/types';

export const initialEntities: MapEntity[] = [
  { id: 'e-1', type: 'threat', label: 'איום ק.אר 09', position: { x: 28, y: 34 }, status: 'confirmed', source: 'manual' },
  { id: 'e-2', type: 'threat', label: 'איום בלתי-מזוהה', position: { x: 64, y: 22 }, status: 'suggested', source: 'ai_suggestion' },
  { id: 'e-3', type: 'unit', label: 'פלוגה ב׳', position: { x: 40, y: 58 }, status: 'confirmed', source: 'manual' },
  { id: 'e-4', type: 'unit', label: 'UAV-7', position: { x: 72, y: 48 }, status: 'confirmed', source: 'manual' },
  { id: 'e-5', type: 'asset', label: 'מצפה דרום', position: { x: 50, y: 80 }, status: 'confirmed', source: 'manual' },
  { id: 'e-6', type: 'poi', label: 'צומת מבוצרת', position: { x: 18, y: 72 }, status: 'confirmed', source: 'manual' },
];
