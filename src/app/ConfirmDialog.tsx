export type ConfirmDialogProps = {
  open: boolean;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * The only confirmation surface in the app (RF-03, RF-06, RF-13, RF-17).
 * window.confirm is never used: it cannot be styled and it blocks the canvas.
 */
export default function ConfirmDialog({
  open,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      data-export-ignore="true"
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(28,34,48,.45)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[360px] rounded-[14px] border border-line bg-panel p-4 shadow-[0_1px_2px_rgba(20,28,45,.06),0_12px_32px_-12px_rgba(20,28,45,.28)]"
      >
        <p className="text-[14px] font-extrabold leading-[1.35] tracking-[-0.01em] text-ink">{message}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-8 rounded-lg border border-line-2 bg-panel px-3 text-[12px] font-bold text-ink"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-8 rounded-lg border border-accent bg-accent px-3 text-[12px] font-bold text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
