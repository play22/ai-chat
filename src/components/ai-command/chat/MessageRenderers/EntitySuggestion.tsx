import { useState } from 'react';
import { MapPin, Pencil, Check, X, Sparkles } from 'lucide-react';
import type { EntitySuggestionBlock, MapEntity } from '../../../../state/types';
import { Card, CardBody } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { MockMap } from '../../map/MockMap';
import { entityTypeLabel } from '../../shared';
import { useAICommand } from '../../../../state/AICommandContext';

export function EntitySuggestionRenderer({ block }: { block: EntitySuggestionBlock }) {
  const { dispatch, toast } = useAICommand();
  const [entity, setEntity] = useState<MapEntity>(block.entity);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(entity.label);

  const approve = () => {
    const confirmed: MapEntity = { ...entity, label: editLabel, status: 'confirmed' };
    dispatch({ type: 'ADD_ENTITY', entity: confirmed });
    setStatus('approved');
    toast(`הישות "${editLabel}" נוספה לתמונת המצב`, 'success');
  };

  const reject = () => {
    setStatus('rejected');
    toast('הצעת הישות נדחתה', 'info');
  };

  const editPosition = () => {
    // Add entity as suggested first if not exists, then open picker
    dispatch({ type: 'ADD_ENTITY', entity });
    dispatch({ type: 'OPEN_MAP_PICKER', purpose: 'place_entity', entityId: entity.id });
  };

  return (
    <Card className="overflow-hidden">
      <CardBody className="!p-0">
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-panel-border bg-bg-elevated/50">
          <Sparkles size={13} className="text-accent" />
          <span className="text-2xs font-medium text-accent uppercase tracking-wider">הצעה ליצירת ישות</span>
        </div>
        <div className="grid grid-cols-[1fr_220px] gap-0">
          <div className="p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Badge tone="critical" dot>
                {entityTypeLabel[entity.type]}
              </Badge>
              {status === 'approved' && <Badge tone="success">✓ נוספה</Badge>}
              {status === 'rejected' && <Badge tone="neutral">✕ נדחתה</Badge>}
            </div>
            {editing ? (
              <input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                onBlur={() => setEditing(false)}
                onKeyDown={(e) => e.key === 'Enter' && setEditing(false)}
                autoFocus
                className="bg-bg-sunken border border-accent/40 rounded px-2 py-1 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent/60"
              />
            ) : (
              <button
                onClick={() => status === 'pending' && setEditing(true)}
                className="text-start text-sm font-semibold text-text hover:text-accent transition-colors disabled:cursor-default"
                disabled={status !== 'pending'}
              >
                {editLabel}
              </button>
            )}
            <p className="text-xs text-text-dim leading-relaxed">{block.rationale}</p>
            <div className="flex items-center gap-2 font-mono text-2xs text-text-faint">
              <MapPin size={11} />
              X: {entity.position.x.toFixed(1)} · Y: {entity.position.y.toFixed(1)}
            </div>
            {status === 'pending' && (
              <div className="flex flex-wrap gap-2 mt-1">
                <Button variant="primary" size="sm" icon={<Check size={14} />} onClick={approve}>
                  אשר ושמור
                </Button>
                <Button variant="subtle" size="sm" icon={<Pencil size={14} />} onClick={editPosition}>
                  ערוך מיקום במפה
                </Button>
                <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={reject}>
                  דחה
                </Button>
              </div>
            )}
          </div>
          <div className="border-s border-panel-border">
            <MockMap
              entities={[entity]}
              height={180}
              miniature
              highlightEntityId={entity.id}
              showControls={false}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
