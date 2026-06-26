import type { ReactNode } from 'react';
import { ChevronLeft, Menu } from 'lucide-react';

type AppHeaderProps = {
  onMenuClick?: () => void;
  onBack?: () => void;
  rightSlot?: ReactNode;
  className?: string;
  position?: 'fixed' | 'sticky';
};

export default function AppHeader({
  onMenuClick,
  onBack,
  rightSlot,
  className = '',
  position = 'sticky',
}: AppHeaderProps) {
  const positionClass = position === 'fixed' ? 'fixed' : 'sticky';

  return (
    <header
      className={`${positionClass} top-0 left-0 right-0 z-50 h-16 border-b border-border bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur ${className}`}
    >
      <div className="relative flex h-full w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Volver"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Abrir menu"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        )}

        <img
          className="absolute left-1/2 h-8 max-w-[132px] -translate-x-1/2 object-contain"
          src="/tandem-logo.png"
          alt="Tandem"
        />

        <div className="flex min-w-11 items-center justify-end gap-3">
          {rightSlot}
        </div>
      </div>
    </header>
  );
}
