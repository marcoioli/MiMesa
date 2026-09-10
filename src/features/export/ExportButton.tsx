import { useState } from 'react';
import { useEventStore } from '../../store/useEventStore';
import { exportCanvas } from './exportCanvas';

/**
 * Export button for the editor topbar (track C).
 * Zero-prop, default export, label "Exportar PNG".
 */
export default function ExportButton() {
  const event = useEventStore((s) => s.event);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!event || isExporting) return;
    setIsExporting(true);
    try {
      await exportCanvas(event.name, event.tables);
    } catch {
      // Ignore export error
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={!event || isExporting}
      className="inline-flex h-[34px] items-center gap-1.5 rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-semibold text-ink transition hover:bg-ground hover:border-line active:bg-ground disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
    >
      <svg
        className="h-4 w-4 stroke-current stroke-[1.75]"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Exportar PNG
    </button>
  );
}
