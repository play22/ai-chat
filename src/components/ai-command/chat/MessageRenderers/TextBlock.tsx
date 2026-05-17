import type { TextBlock as TextBlockType } from '../../../../state/types';

export function TextBlock({ block }: { block: TextBlockType }) {
  return <p className="text-sm leading-relaxed text-text whitespace-pre-wrap">{block.text}</p>;
}
