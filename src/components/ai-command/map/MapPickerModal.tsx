import { useEffect, useState } from 'react';
import { useAICommand } from '../../../state/AICommandContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MockMap } from './MockMap';
import { Crosshair, Pentagon, MapPin as MapPinIcon, RotateCcw, Trash2 } from 'lucide-react';
import type { AreaAttachment } from '../../../state/types';

const TITLES: Record<string, string> = {
  attach_area: 'בחר תיחום אזור לצירוף',
  rule_area: 'בחר אזור לחוק האוטומציה',
  place_entity: 'בחר מיקום במפה',
  agent_boundary: 'הגדר תיחום אחריות לסוכן',
};

const HINTS: Record<string, string> = {
  attach_area: 'לחץ במפה כדי להוסיף נקודות לפוליגון. נדרשות לפחות 3 נקודות.',
  rule_area: 'לחץ במפה כדי להוסיף נקודות לפוליגון של תחום החוק.',
  place_entity: 'לחץ במפה כדי לבחור מיקום.',
  agent_boundary: 'צייר את האזור בו הסוכן רשאי לפעול אוטונומית. פעולות מחוץ לתיחום ידרשו אישור.',
};

export function MapPickerModal() {
  const { state, dispatch, toast } = useAICommand();
  const picker = state.mapPickerMode;
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [polygon, setPolygon] = useState<{ x: number; y: number }[]>([]);

  // Seed polygon with initial value when picker opens
  useEffect(() => {
    if (picker?.initialPolygon) {
      setPolygon(picker.initialPolygon);
    } else {
      setPolygon([]);
    }
    setPoint(null);
  }, [picker?.purpose, picker?.agentId, picker?.entityId]);

  if (!picker) return null;

  const isPlace = picker.purpose === 'place_entity';
  const isArea = !isPlace;

  const handleClick = (pos: { x: number; y: number }) => {
    if (isPlace) setPoint(pos);
    else setPolygon((p) => [...p, pos]);
  };

  const finalize = () => {
    if (isPlace) {
      if (!point || !picker.entityId) return;
      dispatch({ type: 'UPDATE_ENTITY', entityId: picker.entityId, patch: { position: point } });
      toast('מיקום הישות עודכן', 'success');
      dispatch({ type: 'CLOSE_MAP_PICKER' });
      return;
    }
    if (polygon.length < 3) {
      toast('יש לסמן לפחות 3 נקודות', 'warn');
      return;
    }
    if (picker.purpose === 'agent_boundary' && picker.agentId) {
      dispatch({ type: 'SET_PENDING_BOUNDARY', agentId: picker.agentId, points: polygon });
      toast('התיחום נקלט - לחץ "שמור שינויים" בהגדרות הסוכן', 'success');
    } else if (picker.purpose === 'attach_area') {
      const att: AreaAttachment = {
        kind: 'area',
        id: `att-${Date.now()}`,
        label: `תיחום ${polygon.length} נקודות`,
        points: polygon,
      };
      dispatch({ type: 'ADD_PENDING_ATTACHMENT', attachment: att });
      toast('התיחום צורף להודעה', 'success');
    } else if (picker.purpose === 'rule_area') {
      // Future: integrate with RuleEditor draft (currently demo only)
      toast(`תיחום של ${polygon.length} נקודות נשמר לחוק (הדגמה)`, 'info');
    }
    dispatch({ type: 'CLOSE_MAP_PICKER' });
    setPolygon([]);
  };

  const close = () => {
    dispatch({ type: 'CLOSE_MAP_PICKER' });
    setPolygon([]);
    setPoint(null);
  };

  const agent = picker.agentId ? state.agents.find((a) => a.id === picker.agentId) : undefined;

  return (
    <Modal
      open={true}
      onClose={close}
      title={TITLES[picker.purpose] ?? 'בחר במפה'}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            ביטול
          </Button>
          {isArea && polygon.length > 0 && (
            <Button variant="subtle" icon={<RotateCcw size={13} />} onClick={() => setPolygon([])}>
              איפוס
            </Button>
          )}
          {isArea && polygon.length > 0 && (
            <Button variant="ghost" icon={<Trash2 size={13} />} onClick={() => setPolygon((p) => p.slice(0, -1))}>
              בטל נקודה אחרונה
            </Button>
          )}
          {isPlace ? (
            <Button variant="primary" disabled={!point} onClick={finalize}>
              אשר מיקום
            </Button>
          ) : (
            <Button variant="primary" disabled={polygon.length < 3} onClick={finalize}>
              סיים תיחום ({polygon.length})
            </Button>
          )}
        </>
      }
    >
      {/* Hint banner */}
      <div className="flex items-start gap-2 text-xs text-text-dim mb-3 p-2.5 bg-bg-elevated border border-panel-border rounded-[5px]">
        {isPlace ? <MapPinIcon size={14} className="text-accent mt-0.5 flex-shrink-0" /> : <Pentagon size={14} className="text-accent mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <div className="leading-relaxed">{HINTS[picker.purpose]}</div>
          {agent && (
            <div className="text-2xs text-text-faint mt-1">
              סוכן: <span className="text-accent">{agent.name}</span>
              {picker.initialPolygon && picker.initialPolygon.length > 0 && (
                <span> · נטען תיחום קיים ({picker.initialPolygon.length} נקודות) — ניתן לערוך או להחליף</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="h-[520px] relative">
        <MockMap
          height="100%"
          pickerMode={isArea ? 'polygon' : 'point'}
          onMapClick={handleClick}
          polygonPoints={isArea ? polygon : []}
          selectedPoint={isPlace ? point : null}
          showAgentZones={picker.purpose === 'agent_boundary'}
          highlightAgentId={picker.purpose === 'agent_boundary' ? null : null}
        />
        {/* Status badge top-start */}
        <div className="absolute top-3 start-3 bg-bg-sunken/90 border border-accent/40 rounded px-2.5 py-1.5 text-2xs font-mono text-accent flex items-center gap-2">
          {isPlace ? (
            point ? (
              <>
                <Crosshair size={11} /> {point.x.toFixed(1)}, {point.y.toFixed(1)}
              </>
            ) : (
              <>
                <Crosshair size={11} /> בחר נקודה
              </>
            )
          ) : (
            <>
              <Pentagon size={11} /> {polygon.length} נקודות {polygon.length < 3 ? `(עוד ${3 - polygon.length} לפחות)` : '— ניתן לסיים'}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
