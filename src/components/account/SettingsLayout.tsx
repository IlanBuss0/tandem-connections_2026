import { ArrowLeft, Loader2, Save } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type SettingsCategory<Id extends string = string> = {
  id: Id;
  label: string;
  description: string;
  icon: LucideIcon;
};

export default function SettingsLayout<Id extends string>({
  title = 'Configuración',
  description = 'Personalizá cómo querés usar TÁNDEM.',
  categories,
  active,
  onChange,
  children,
  footer,
}: {
  title?: string;
  description?: string;
  categories: SettingsCategory<Id>[];
  active: Id;
  onChange: (id: Id) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      <header>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#17142f] sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-[#716581] sm:text-base">{description}</p>
      </header>
      {footer}
      <div className="grid gap-5 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <nav aria-label="Categorías de configuración" className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-2 xl:mx-0 xl:block xl:overflow-visible xl:rounded-[28px] xl:border xl:border-[#ebe3f3] xl:bg-white xl:p-4 xl:shadow-[0_10px_30px_rgba(73,45,103,.065)]">
          {categories.map(category => {
            const Icon = category.icon;
            const selected = category.id === active;

            return (
              <button key={category.id} type="button" onClick={() => onChange(category.id)} aria-current={selected ? 'page' : undefined} className={`flex min-h-12 shrink-0 items-center gap-3 rounded-2xl border px-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b35b5] xl:mb-2 xl:w-full xl:border-0 xl:py-3 ${selected ? 'border-[#6b35b5] bg-[#6b35b5] text-white shadow-md xl:bg-[#f0e6fc] xl:text-[#4e238d] xl:shadow-none' : 'border-[#ddd0eb] bg-white text-[#5f526d] hover:bg-[#f8f3fd]'}`}>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-white/15 xl:bg-[#6b35b5] xl:text-white' : 'bg-[#f0e6fc] text-[#6933b4]'}`}>
                  <Icon size={19} aria-hidden />
                </span>
                <span>
                  <span className="block whitespace-nowrap text-sm font-bold">{category.label}</span>
                  <span className={`hidden text-xs xl:block ${selected ? 'text-[#755d91]' : 'text-[#8d8297]'}`}>{category.description}</span>
                </span>
              </button>
            );
          })}
        </nav>
        <main className="min-w-0 rounded-[28px] border border-[#ebe3f3] bg-white p-4 shadow-[0_10px_30px_rgba(73,45,103,.065)] sm:p-5 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export function SettingsSectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return <header className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#6b35b5] text-white"><Icon size={20} aria-hidden /></span><div><h2 className="text-xl font-bold text-[#201932]">{title}</h2><p className="mt-0.5 text-sm text-[#80748c]">{description}</p></div></header>;
}

/**
 * Tarjeta estándar dentro de Configuración: mismo borde, radio, encabezado y
 * espaciados en los tres roles. El encabezado es opcional para bloques sin título.
 */
export function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className = '',
}: {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[24px] border border-[#ebe3f3] p-4 sm:p-5 ${className}`}>
      {title && (
        <div className="mb-5 flex items-start gap-3">
          {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0e6fc] text-[#6933b4]"><Icon size={20} aria-hidden /></span>}
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#201932]">{title}</h3>
            {description && <p className="mt-0.5 text-sm text-[#80748c]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Barra inferior compartida de Configuración: volver al perfil + acción principal. */
export function SettingsFooter({
  onBack,
  backLabel = 'Volver al perfil',
  hint,
  action,
}: {
  onBack?: () => void;
  backLabel?: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-[24px] border border-[#ebe3f3] bg-white p-4 shadow-[0_10px_30px_rgba(73,45,103,.065)] sm:flex-row sm:px-6">
      <div className="flex items-center gap-2">
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#ddd0eb] px-4 text-sm font-bold text-[#6330a8] transition-colors hover:bg-[#f8f3fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <ArrowLeft size={16} aria-hidden />
            {backLabel}
          </button>
        )}
        {hint && <p className="hidden text-sm text-[#80748c] md:block">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

/** Botón estándar de guardado de Configuración (mismo estilo en los tres roles). */
export function SettingsSaveButton({
  type = 'button',
  onClick,
  disabled,
  loading,
  children = 'Guardar cambios',
}: {
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#6530ad] px-6 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#6530ad]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 sm:w-auto">
      {loading ? <Loader2 size={16} aria-hidden /> : <Save size={16} aria-hidden />}
      {children}
    </button>
  );
}
