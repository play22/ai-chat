import { AlertTriangle, ShieldAlert, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';
import type { ActionCardBlock } from '../../../../state/types';
import { Card, CardBody } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { priorityLabel, priorityTone } from '../../shared';
import { useAICommand } from '../../../../state/AICommandContext';

const sevIcon = {
  critical: <ShieldAlert size={18} className="text-critical" />,
  high: <AlertTriangle size={18} className="text-warn" />,
  medium: <AlertCircle size={18} className="text-info" />,
  low: <Info size={18} className="text-text-dim" />,
};

const sevBorder = {
  critical: 'border-r-2 border-r-critical',
  high: 'border-r-2 border-r-warn',
  medium: 'border-r-2 border-r-info',
  low: 'border-r-2 border-r-text-faint',
};

export function ActionCardRenderer({ block }: { block: ActionCardBlock }) {
  const { toast } = useAICommand();
  const handleAction = (label: string) => {
    toast(`פעולה בוצעה: ${label}`, 'success');
  };
  return (
    <Card className={clsx('overflow-hidden', sevBorder[block.severity])}>
      <CardBody className="!p-0">
        <div className="flex items-start gap-3 p-3.5">
          <div className="mt-0.5">{sevIcon[block.severity]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-text">{block.title}</h3>
              <Badge tone={priorityTone[block.severity]} dot pulse={block.severity === 'critical'}>
                {priorityLabel[block.severity]}
              </Badge>
            </div>
            <p className="text-xs text-text-dim leading-relaxed">{block.description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-3.5 pb-3.5">
          {block.actions.map((a) => (
            <Button key={a.id} variant={a.variant} size="sm" onClick={() => handleAction(a.label)}>
              {a.label}
            </Button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
