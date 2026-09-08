import { useEffect, useRef, useState } from 'react';

import { useEventStore } from '../../store/useEventStore';

export type TableNameEditProps = {
  tableId: string;
  onClose: () => void;
};

/**
 * RF-08: inline rename rendered inside the table centre through `renderCenter`.
 * Pointer and double-click events stop here so the centre-label drag handle
 * (RF-11) never starts a table move while the name is being edited.
 */
export default function TableNameEdit({ tableId, onClose }: TableNameEditProps) {
  const event = useEventStore((state) => state.event);
  const renameTable = useEventStore((state) => state.renameTable);

  const table = event?.tables.find((candidate) => candidate.id === tableId);
  const [value, setValue] = useState(table?.name ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  if (!table) return null;

  // Escape and blur can both fire for one edit; the guard keeps the commit single.
  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    // `renameTable` trims and ignores an empty name, keeping the previous one.
    if (commit) renameTable(tableId, value);
    onClose();
  };

  return (
    <input
      ref={inputRef}
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      className="w-14 border-b border-dashed border-line-2 bg-transparent text-center text-[11px] font-extrabold tracking-[-0.01em] text-ink outline-none"
    />
  );
}
