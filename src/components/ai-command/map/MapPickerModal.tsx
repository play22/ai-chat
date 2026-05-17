import { useState } from 'react';
import { useAICommand } from '../../../state/AICommandContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MockMap } from './MockMap';
import type { AreaAttachment } from '../../../state/types';

export function MapPickerModal() {
  const { state, dispatch, toast } = useAICommand();
  const picker = state.mapPickerMode;
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);
  const [polygon, setPolygon] = useState<{ x: number; y: number }[]>([]);

  if (!picker) return null;

  const isArea = picker.purpose === 'attach_area' || picker.purpose === 'rule_area';
  const isPlace = picker.purpose === 'place_entity';

  const title = isArea ? 'בחר תיחום אזור' : 'בחר מיקום במפה';

  const handleClick = (pos: { x: number; y: number }) => {
    if (isPlace) setPoint(pos);
    else if (isArea) setPolygon((p) => [...p, pos]);
  };

  const finalizeArea = (points: { x: number; y: number }[]) => {
    const att: AreaAttachment = {
      kind: 'area',
      id: `att-${Date.now()}`,
      label: `תיחום ${points.length} נקודות`,
      points,
    };
    dispatch({ type: 'ADD_PENDING_ATTACHMENT', attachment: att });
    toast('התיחום צורף להודעה', 'success');
    dispatch({ type: 'CLOSE_MAP_PICKER' });
    setPolygon([]);
  };

  const confirmPlace = () => {
    if (!point || !picker.entityId) return;
    dispatch({ type: 'UPDATE_ENTITY', entityId: picker.entityId, patch: { position: point } });
    toast('מיקום הישות עודכן', 'success');
    dispatch({ type: 'CLOSE_MAP_PICKER' });
    setPoint(null);
  };

  return (
    <Modal
      open={true}
      onClose={() => {
        dispatch({ type: 'CLOSE_MAP_PICKER' });
        setPolygon([]);
        setPoint(null);
      }}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => dispatch({ type: 'CLOSE_MAP_PICKER' })}>
            ביטול
          </Button>
          {isPlace && (
            <Button variant="primary" disabled={!point} onClick={confirmPlace}>
              אשר מיקום
            </Button>
          )}
          {isArea && (
            <Button variant="primary" disabled={polygon.length < 3} onClick={() => finalizeArea(polygon)}>
              סיים תיחום ({polygon.length})
            </Button>
          )}
        </>
      }
    >
      <div className="text-xs text-text-dim mb-3">
        {isArea ? 'לחץ במפה כדי להוסיף נקודות לפוליגון. נדרשות לפחות 3 נקודות.' : 'לחץ במפה כדי לבחור מיקום.'}
      </div>
      <div className="h-[500px] relative">
        <MockMap
          height="100%"
          pickerMode={isArea ? 'polygon' : 'point'}
          onMapClick={handleClick}
          polygonPoints={isArea ? polygon : []}
          selectedPoint={isPlace ? point : null}
        />
        {isPlace && point && (
          <div className="absolute top-3 start-3 bg-bg-sunken/90 border border-accent/40 rounded px-2.5 py-1.5 text-2xs font-mono text-accent">
            מיקום: {point.x.toFixed(1)}, {point.y.toFixed(1)}
          </div>
        )}
        {isArea && polygon.length > 0 && (
          <div className="absolute top-3 start-3 bg-bg-sunken/90 border border-accent/40 rounded px-2.5 py-1.5 text-2xs text-accent">
            {polygon.length} נקודות
          </div>
        )}
      </div>
    </Modal>
  );
}
