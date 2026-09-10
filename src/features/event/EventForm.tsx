import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import {
  MAX_CAPACITY,
  MAX_TABLES,
  MIN_CAPACITY,
  MIN_TABLES,
  TEMPLATE_PRESETS,
} from '../../lib/constants';
import type { TableTemplate } from '../../store/types';
import { useEventStore } from '../../store/useEventStore';

type TemplateOption = '6x8' | '10x10' | '8x6' | 'custom';

export default function EventForm() {
  const createEvent = useEventStore((s) => s.createEvent);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [place, setPlace] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>('6x8');
  const [customCount, setCustomCount] = useState('6');
  const [customCapacity, setCustomCapacity] = useState('8');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewTemplate = useMemo<TableTemplate>(() => {
    if (selectedTemplate === 'custom') {
      const parsedCount = parseInt(customCount, 10);
      const parsedCap = parseInt(customCapacity, 10);
      const count = Number.isFinite(parsedCount) && parsedCount > 0 ? Math.min(parsedCount, 20) : 1;
      const capacity = Number.isFinite(parsedCap) && parsedCap > 0 ? Math.min(parsedCap, 20) : 2;
      return { count, capacity };
    }
    const preset = TEMPLATE_PRESETS.find((p) => p.id === selectedTemplate);
    return preset ? preset.template : { count: 6, capacity: 8 };
  }, [selectedTemplate, customCount, customCapacity]);

  const previewSeats = useMemo(() => {
    const c = previewTemplate.capacity;
    return Array.from({ length: c }, (_, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / c;
      return {
        x: Math.round(18 * Math.cos(angle) * 10) / 10,
        y: Math.round(18 * Math.sin(angle) * 10) / 10,
      };
    });
  }, [previewTemplate.capacity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    const trimmedDate = date.trim();
    const trimmedPlace = place.trim();

    if (!trimmedName || !trimmedDate) {
      setErrorMessage('Completá el nombre y la fecha.');
      return;
    }

    let finalTemplate: TableTemplate;
    if (selectedTemplate === 'custom') {
      const count = parseInt(customCount, 10);
      const capacity = parseInt(customCapacity, 10);

      if (
        isNaN(count) ||
        count < MIN_TABLES ||
        count > MAX_TABLES ||
        isNaN(capacity) ||
        capacity < MIN_CAPACITY ||
        capacity > MAX_CAPACITY
      ) {
        setErrorMessage('Ingresá entre 1 y 20 mesas y una capacidad entre 2 y 20.');
        return;
      }

      finalTemplate = { count, capacity };
    } else {
      const preset = TEMPLATE_PRESETS.find((p) => p.id === selectedTemplate);
      if (!preset) {
        setErrorMessage('Completá el nombre y la fecha.');
        return;
      }
      finalTemplate = preset.template;
    }

    createEvent(trimmedName, trimmedDate, trimmedPlace || undefined, finalTemplate);
    navigate('/plano');
  };

  return (
    <div className="flex min-h-screen flex-col bg-ground">
      <header className="flex h-14 flex-none items-center gap-4 border-b border-line bg-panel px-5">
        <Link
          to="/"
          className="flex items-center gap-2 rounded focus:outline-none focus:ring-2 focus:ring-accent-soft"
        >
          <img src="/logo-mark.svg" alt="" width={28} height={28} className="h-7 w-7" />
          <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">MiMesa</span>
        </Link>

        <Link
          to="/"
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold text-ink-2 transition hover:bg-ground hover:text-ink focus:outline-none focus:ring-2 focus:ring-accent-soft"
        >
          <svg
            className="h-3.5 w-3.5 stroke-current stroke-[2]"
            viewBox="0 0 24 24"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          Volver
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="grid w-full max-w-[1000px] grid-cols-1 overflow-hidden rounded-[14px] border border-line bg-panel shadow-[0_1px_2px_rgba(20,28,45,0.06),0_24px_48px_-24px_rgba(20,28,45,0.2)] md:grid-cols-2">
          {/* Left: form */}
          <div className="flex flex-col gap-[22px] p-8 md:p-10">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink">
                Armá las mesas de tu evento
              </h1>
              <p className="text-[13px] font-medium text-ink-3">
                Creá el evento, elegí cuántas mesas y después arrastrá a cada invitado a su silla.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-[22px]">
              <div className="flex flex-col gap-3.5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-bold text-ink-2">Nombre del evento</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Casamiento Ana y Juan"
                    className="h-[38px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                  />
                </label>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-ink-2">Fecha</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-[38px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-ink-2">Lugar (opcional)</span>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      placeholder="Salón Sur"
                      className="h-[38px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <span className="text-[12px] font-bold text-ink-2">Plantilla de mesas</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('6x8')}
                    className={`flex flex-col gap-1 rounded-[10px] text-left transition ${
                      selectedTemplate === '6x8'
                        ? 'border-2 border-accent bg-accent-soft p-[11px_13px]'
                        : 'border border-line-2 bg-panel p-[12px_14px] hover:border-ink-3'
                    }`}
                  >
                    <b className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">6 mesas de 8</b>
                    <span className="text-[12px] text-ink-3">48 sillas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('10x10')}
                    className={`flex flex-col gap-1 rounded-[10px] text-left transition ${
                      selectedTemplate === '10x10'
                        ? 'border-2 border-accent bg-accent-soft p-[11px_13px]'
                        : 'border border-line-2 bg-panel p-[12px_14px] hover:border-ink-3'
                    }`}
                  >
                    <b className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">10 mesas de 10</b>
                    <span className="text-[12px] text-ink-3">100 sillas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('8x6')}
                    className={`flex flex-col gap-1 rounded-[10px] text-left transition ${
                      selectedTemplate === '8x6'
                        ? 'border-2 border-accent bg-accent-soft p-[11px_13px]'
                        : 'border border-line-2 bg-panel p-[12px_14px] hover:border-ink-3'
                    }`}
                  >
                    <b className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">8 mesas de 6</b>
                    <span className="text-[12px] text-ink-3">48 sillas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('custom')}
                    className={`flex flex-col gap-1 rounded-[10px] text-left transition ${
                      selectedTemplate === 'custom'
                        ? 'border-2 border-accent bg-accent-soft p-[11px_13px]'
                        : 'border border-line-2 bg-panel p-[12px_14px] hover:border-ink-3'
                    }`}
                  >
                    <b className="text-[14px] font-extrabold tracking-[-0.01em] text-ink">Personalizado</b>
                    <span className="text-[12px] text-ink-3">Cantidad de mesas y capacidad</span>
                  </button>
                </div>

                <div
                  className={`grid grid-cols-2 gap-3 transition-opacity ${
                    selectedTemplate === 'custom' ? 'opacity-100' : 'pointer-events-none opacity-45'
                  }`}
                >
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-ink-2">Cantidad de mesas</span>
                    <input
                      type="number"
                      min={MIN_TABLES}
                      max={MAX_TABLES}
                      value={customCount}
                      onChange={(e) => setCustomCount(e.target.value)}
                      disabled={selectedTemplate !== 'custom'}
                      placeholder="1 a 20"
                      className="h-[38px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-bold text-ink-2">Capacidad</span>
                    <input
                      type="number"
                      min={MIN_CAPACITY}
                      max={MAX_CAPACITY}
                      value={customCapacity}
                      onChange={(e) => setCustomCapacity(e.target.value)}
                      disabled={selectedTemplate !== 'custom'}
                      placeholder="2 a 20"
                      className="h-[38px] rounded-lg border border-line-2 bg-panel px-3 text-[13px] font-medium text-ink placeholder:text-ink-3 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                    />
                  </label>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-lg border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger"
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="self-start rounded-lg border border-accent bg-accent px-[18px] py-2.5 text-[14px] font-bold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
              >
                Crear evento
              </button>
            </form>
          </div>

          {/* Right: preview */}
          <div className="flex flex-col gap-[18px] border-t border-line bg-ground p-8 md:border-t-0 md:border-l md:p-9">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-extrabold text-ink-2">Así queda el plano</span>
              <span className="text-[12px] font-semibold text-ink-3">
                {previewTemplate.count} {previewTemplate.count === 1 ? 'mesa' : 'mesas'} ·{' '}
                {previewTemplate.count * previewTemplate.capacity} sillas
              </span>
            </div>

            <div className="flex flex-1 items-start justify-center overflow-auto rounded-[10px] border border-line bg-panel p-6 shadow-inner">
              <div
                className="grid max-h-[340px] w-full grid-cols-3 gap-6 overflow-y-auto p-2"
                style={{
                  backgroundImage: 'radial-gradient(#dfe4ee 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '10px 10px',
                }}
              >
                {Array.from({ length: previewTemplate.count }, (_, idx) => (
                  <div key={idx} className="relative mx-auto h-12 w-12 flex-none">
                    <div className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-empty bg-empty-soft" />
                    {previewSeats.map((pos, sIdx) => (
                      <div
                        key={sIdx}
                        className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-line-2 bg-panel"
                        style={{
                          left: `calc(50% + ${pos.x}px)`,
                          top: `calc(50% + ${pos.y}px)`,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[12px] font-medium leading-relaxed text-ink-3">
              Después vas a poder agregar, quitar y renombrar mesas, y moverlas por el plano.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
