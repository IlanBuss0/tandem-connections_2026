import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Calendar, Check, ChevronDown, Clock, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hoja que sube desde abajo en mobile y es un diálogo centrado en desktop. */
export function AgendaSheet({
  title,
  subtitle,
  onClose,
  footer,
  small = false,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer?: ReactNode;
  /** Hoja chica que se apila sobre otra (ej. lista completa de pacientes). */
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#2b2145]/50 data-[state=open]:animate-in data-[state=open]:fade-in-0 motion-reduce:animate-none" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            "fixed z-50 flex flex-col bg-white shadow-2xl outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-8 motion-reduce:animate-none",
            "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[28px]",
            "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px]",
            small && "max-h-[70dvh]",
          )}
        >
          <div className="mx-auto mt-3 h-1.5 w-11 shrink-0 rounded-full bg-primary/20 sm:hidden" aria-hidden />
          <header className="flex items-start justify-between gap-3 px-5 pb-2 pt-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="font-heading text-2xl font-bold leading-tight text-[#2b2145]">{title}</DialogPrimitive.Title>
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <DialogPrimitive.Close
              aria-label="Cerrar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X size={20} aria-hidden />
            </DialogPrimitive.Close>
          </header>
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-3">{children}</div>
          {footer && <footer className="border-t border-border/70 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-[28px]">{footer}</footer>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Botón de pie fijo de la hoja. */
export function SheetSubmit({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 text-base font-bold text-primary-foreground shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
    >
      <Check size={18} aria-hidden />
      {label}
    </button>
  );
}

export function SheetLabel({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#5f477c]">{children}</p>;
}

export function SheetChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/10 text-primary" : "border-border bg-white text-[#5f477c] hover:bg-primary/5",
      )}
    >
      {selected && <Check size={15} aria-hidden />}
      {children}
    </button>
  );
}

export const sheetInputClass =
  "min-h-12 w-full min-w-0 rounded-2xl border border-primary/20 bg-white px-4 text-base text-[#2b2145] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Campo de día u hora: se ve con el formato de la foto y abre el selector nativo. */
export function PickerField({
  label,
  type,
  value,
  display,
  onChange,
}: {
  label: string;
  type: "date" | "time";
  value: string;
  display: string;
  onChange: (value: string) => void;
}) {
  const Icon = type === "date" ? Calendar : Clock;
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-extrabold text-[#2b2145]">{label}</span>
      <span className="relative flex min-h-12 items-center gap-2 rounded-2xl border border-primary/20 bg-white px-3 focus-within:ring-2 focus-within:ring-primary/20">
        <Icon size={18} className="shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 text-base">{display}</span>
        <input
          type={type}
          value={value}
          aria-label={label}
          onChange={(event) => onChange(event.target.value)}
          onClick={(event) => event.currentTarget.showPicker?.()}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </span>
    </label>
  );
}

/** Bloque plegable (Repetición, Recordatorios). */
export function CollapsibleBlock({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-3xl border border-primary/20">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-3xl px-4 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span>
          <span className="block text-base font-extrabold text-[#2b2145]">{title}</span>
          <span className="block text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown size={20} className={cn("shrink-0 text-primary transition-transform motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
      </button>
      {open && <div className="space-y-4 border-t border-border/60 px-4 py-4">{children}</div>}
    </div>
  );
}

/** Selector numérico con − y +. */
export function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const clamp = (next: number) => onChange(Math.min(max, Math.max(min, next)));
  const buttonClass = "flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-base font-extrabold text-[#2b2145]">{label}</span>
      <div className="flex items-center gap-3">
        <button type="button" className={buttonClass} aria-label="Restar" disabled={value <= min} onClick={() => clamp(value - 1)}><Minus size={18} aria-hidden /></button>
        <span className="w-8 text-center text-lg font-extrabold" aria-live="polite">{value}</span>
        <button type="button" className={buttonClass} aria-label="Sumar" disabled={value >= max} onClick={() => clamp(value + 1)}><Plus size={18} aria-hidden /></button>
      </div>
    </div>
  );
}
