import type { ReactNode } from "react";
import { AgendaSheet } from "@/components/agenda/AgendaSheet";
import { cn } from "@/lib/utils";

export type MenuAction = { label: string; icon: ReactNode; onClick: () => void; danger?: boolean; disabled?: boolean; hint?: string };

/** Menú ⋯ de una sesión o de un evento, como hoja chica. */
export default function AgendaItemMenu({ title, subtitle, actions, onClose }: { title: string; subtitle: string; actions: MenuAction[]; onClose: () => void }) {
  return (
    <AgendaSheet title={title} subtitle={subtitle} onClose={onClose} small>
      <ul className="divide-y divide-border/60 pb-2">
        {actions.map((action) => (
          <li key={action.label}>
            <button
              type="button"
              disabled={action.disabled}
              onClick={() => { onClose(); action.onClick(); }}
              className={cn(
                "flex min-h-14 w-full items-center gap-4 py-2 text-left text-lg font-extrabold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
                action.danger ? "text-rose-700" : "text-[#2b2145]",
              )}
            >
              <span aria-hidden>{action.icon}</span>
              <span>
                {action.label}
                {action.hint && <span className="block text-sm font-medium text-muted-foreground">{action.hint}</span>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </AgendaSheet>
  );
}
