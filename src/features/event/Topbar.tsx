import ExportButton from '../export/ExportButton';
import ShareButton from '../share/ShareButton';

/** Placeholder owned by track A. Only the wordmark and the track C actions exist yet. */
export default function Topbar() {
  return (
    <header className="flex h-14 flex-none items-center gap-5 border-b border-line bg-panel pl-5 pr-4">
      <a href="/" className="flex items-center gap-2" aria-label="MiMesa">
        <img src="/logo-mark.svg" alt="" width="28" height="28" className="h-7 w-7" />
        <span className="text-[15px] font-extrabold tracking-[-0.02em] text-ink">MiMesa</span>
      </a>
      <div className="ml-auto flex items-center gap-2">
        <ExportButton />
        <ShareButton />
      </div>
    </header>
  );
}
