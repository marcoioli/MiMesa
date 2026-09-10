import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { useEventStore } from '../../store/useEventStore';
import { QR_MAX_URL } from '../../lib/constants';
import { buildSharePayload } from './buildSharePayload';
import { buildShareUrl } from './encode';

export type ShareDialogProps = {
  open: boolean;
  onClose: () => void;
};

export default function ShareDialog({ open, onClose }: ShareDialogProps) {
  const event = useEventStore((s) => s.event);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClose = useCallback(() => {
    setCopied(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleClose]);

  const url = useMemo(() => {
    if (!event) return '';
    return buildShareUrl(buildSharePayload(event));
  }, [event]);

  if (!open || !event) return null;

  const canRenderQr = url.length > 0 && url.length <= QR_MAX_URL;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignore clipboard error
    }
  };

  return createPortal(
    <div
      data-export-ignore="true"
      role="presentation"
      onClick={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 whitespace-normal"
      style={{ backgroundColor: 'rgba(28,34,48,.45)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[500px] overflow-hidden rounded-[14px] border border-line bg-panel shadow-[0_1px_2px_rgba(20,28,45,.06),0_32px_64px_-24px_rgba(20,28,45,.45)] flex flex-col whitespace-normal"
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 id="share-dialog-title" className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">
            Compartir
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="text-ink-3 transition hover:text-ink p-1 rounded-md"
          >
            <svg
              className="h-4 w-4 stroke-current stroke-[2]"
              viewBox="0 0 24 24"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="px-5 mt-1.5 text-[13px] font-medium leading-[1.5] text-ink-3 whitespace-normal">
          Cada invitado abre el link, busca su nombre y ve en qué mesa está y con quién.
        </p>

        {/* Copy Link Row */}
        <div className="px-5 mt-4 flex items-center gap-2">
          <div
            title={url}
            className="flex-1 flex items-center h-[38px] px-3 border border-line-2 rounded-lg bg-ground text-ink-2 text-[12px] font-medium overflow-hidden whitespace-nowrap text-ellipsis select-all"
          >
            {url}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 h-[38px] px-3.5 rounded-lg border border-accent bg-accent text-white font-bold text-[13px] whitespace-nowrap transition hover:opacity-95 active:opacity-90 flex-none"
          >
            {copied ? (
              <>
                <svg
                  className="h-4 w-4 stroke-current stroke-[2.25]"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                ¡Link copiado!
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4 stroke-current stroke-[1.75]"
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                Copiar link
              </>
            )}
          </button>
        </div>

        {/* QR or Over-limit message */}
        {canRenderQr ? (
          <div className="mx-5 mt-5 flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border border-line bg-ground/40">
            <div className="flex flex-none items-center justify-center p-2 rounded-xl border border-line bg-panel shadow-sm">
              <QRCodeCanvas
                value={url}
                size={256}
                level="L"
                className="h-[150px] w-[150px]"
              />
            </div>
            <div className="flex flex-col gap-1 text-center sm:text-left">
              <span className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">
                Mostralo en pantalla
              </span>
              <p className="text-[13px] font-medium leading-[1.4] text-ink-3">
                Los invitados escanean el QR con el celular y entran directo a la búsqueda.
              </p>
              <p className="mt-1 text-[12px] font-medium leading-[1.4] text-ink-3">
                El link incluye solo a los invitados ya sentados. Si cambiás algo, generá uno nuevo.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-5 mt-5 flex flex-col gap-2 rounded-xl border border-line bg-ground p-4 text-center sm:text-left">
            <p className="text-[13px] font-medium leading-[1.5] text-ink-2">
              El evento es muy grande para generar un QR. Copiá el link y compartilo.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 px-5 py-3 bg-ground border-t border-line flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="h-9 px-3.5 rounded-lg border border-line-2 bg-panel text-ink font-bold text-[13px] transition hover:bg-ground cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
