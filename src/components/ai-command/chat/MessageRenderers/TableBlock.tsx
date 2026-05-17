import clsx from 'clsx';
import type { TableBlock as TableBlockType } from '../../../../state/types';
import { Card, CardHeader, CardBody } from '../../ui/Card';
import { Table2 } from 'lucide-react';

export function TableBlock({ block }: { block: TableBlockType }) {
  return (
    <Card>
      {block.title && (
        <CardHeader>
          <Table2 size={14} className="text-text-dim" />
          <span className="text-xs font-medium text-text">{block.title}</span>
        </CardHeader>
      )}
      <CardBody className="!p-0 overflow-x-auto">
        <table className="w-full text-xs min-w-[420px]">
          <thead>
            <tr className="border-b border-panel-border">
              {block.columns.map((c) => (
                <th
                  key={c.key}
                  className={clsx(
                    'px-3 py-2 font-medium text-text-dim text-2xs uppercase tracking-wider',
                    c.align === 'end' && 'text-end',
                    c.align === 'center' && 'text-center',
                    (!c.align || c.align === 'start') && 'text-start',
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => {
              const sev = block.rowSeverity?.[i];
              return (
                <tr
                  key={i}
                  className={clsx(
                    'border-b border-panel-border/50 hover:bg-panel-hover transition-colors last:border-b-0',
                    sev === 'critical' && 'bg-critical/5',
                    sev === 'high' && 'bg-warn/5',
                  )}
                >
                  {block.columns.map((c) => (
                    <td
                      key={c.key}
                      className={clsx(
                        'px-3 py-2 text-text',
                        c.align === 'end' && 'text-end font-mono',
                        c.align === 'center' && 'text-center font-mono',
                      )}
                    >
                      {row[c.key]}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardBody>
    </Card>
  );
}
