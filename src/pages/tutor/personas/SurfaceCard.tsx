import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export default function SurfaceCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn('rounded-[24px] border border-[var(--evo-border-1)] bg-white p-4 shadow-[0_10px_26px_rgba(111,76,166,.08)] lg:p-[18px]', className)}>
      {children}
    </section>
  );
}
