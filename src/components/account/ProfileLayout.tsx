import { Loader2, Settings, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export type ProfileMetric = { label: string; value: ReactNode; hint?: string };
export type ProfileInfoItem = { label: string; value: ReactNode; wide?: boolean };
export type ProfileRelationItem = { id: string | number; name: string; detail?: string; avatar?: ReactNode };

export function ProfileLayout({ children }: { children: ReactNode }) {
  return <div className="space-y-5 pb-24 lg:pb-6">{children}</div>;
}

export function ProfileHero({ avatar, name, username, roleLabel, secondary, metrics, action }: {
  avatar: ReactNode;
  name: string;
  username?: string;
  roleLabel: string;
  secondary?: ReactNode;
  metrics?: ProfileMetric[];
  action?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[30px] border border-[#e9def5] bg-[linear-gradient(135deg,#ffffff_0%,#f7f1ff_60%,#eef9fa_100%)] p-5 shadow-[0_14px_40px_rgba(73,45,103,.09)] sm:p-7">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,.95fr)] lg:items-center">
        <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="shrink-0">{avatar}</div>
          <div className="min-w-0 flex-1">
            <span className="inline-flex rounded-full bg-[#eee3fb] px-3 py-1 text-xs font-bold text-[#6b35b5]">{roleLabel}</span>
            <h1 className="mt-2 truncate font-heading text-3xl font-bold text-[#17142f] sm:text-4xl">{name}</h1>
            {username && <p className="mt-1 truncate text-sm font-medium text-[#716581]">@{username.replace(/^@/, '')}</p>}
            {secondary && <div className="mt-3 text-sm text-[#716581]">{secondary}</div>}
          </div>
          {action && <div className="sm:self-start">{action}</div>}
        </div>
        {metrics && metrics.length > 0 && (
          <div className={`grid gap-2 ${metrics.length === 1 ? 'grid-cols-1' : metrics.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {metrics.map(metric => <ProfileStat key={metric.label} {...metric} />)}
          </div>
        )}
      </div>
    </section>
  );
}

export function ProfileStat({ label, value, hint }: ProfileMetric) {
  return <div className="min-w-0 rounded-[22px] border border-white/90 bg-white/85 p-3 text-center shadow-sm sm:p-4"><p className="truncate text-[11px] font-bold uppercase tracking-[.08em] text-[#82758f]">{label}</p><div className="mt-1 truncate text-xl font-bold text-[#5f2aaa] sm:text-2xl">{value}</div>{hint && <p className="mt-1 truncate text-[11px] text-[#94899e]">{hint}</p>}</div>;
}

export function ProfileGrid({ children, primary = '3fr', secondary = '2fr' }: { children: ReactNode; primary?: string; secondary?: string }) {
  return <div className="grid gap-5 md:grid-cols-[minmax(0,var(--profile-primary))_minmax(0,var(--profile-secondary))]" style={{ '--profile-primary': primary, '--profile-secondary': secondary } as CSSProperties}>{children}</div>;
}

export function ProfileSection({ title, description, icon: Icon, action, children, className = '' }: {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return <section className={`min-w-0 rounded-[28px] border border-[#ebe3f3] bg-white p-4 shadow-[0_10px_30px_rgba(73,45,103,.065)] sm:p-5 ${className}`}><header className="mb-4 flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f0e6fc] text-[#6933b4]"><Icon size={20} aria-hidden /></span><div className="min-w-0 flex-1"><h2 className="text-lg font-bold text-[#201932]">{title}</h2>{description && <p className="mt-0.5 text-sm text-[#80748c]">{description}</p>}</div>{action}</header>{children}</section>;
}

export function ProfileInfoGrid({ items }: { items: ProfileInfoItem[] }) {
  return <div className="grid grid-cols-2 gap-2.5">{items.map(item => <div key={item.label} className={`min-w-0 rounded-2xl border border-[#eee7f5] bg-[#fcfaff] p-3 ${item.wide ? 'col-span-2' : ''}`}><p className="text-xs font-medium text-[#82758f]">{item.label}</p><div className="mt-1 break-words text-sm font-bold text-[#302642]">{item.value}</div></div>)}</div>;
}

export function CompactRelations({ items, emptyText, limit = 3 }: { items: ProfileRelationItem[]; emptyText: string; limit?: number }) {
  if (!items.length) return <div className="rounded-2xl border border-dashed border-[#ddd0eb] bg-[#fcfaff] px-4 py-8 text-center text-sm text-[#82758f]">{emptyText}</div>;
  return <div className="space-y-2">{items.slice(0, limit).map(item => <div key={item.id} className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#eee7f5] bg-[#fcfaff] p-3">{item.avatar ?? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee3fb] font-bold text-[#6933b4]">{item.name.slice(0, 1).toUpperCase()}</span>}<div className="min-w-0"><p className="truncate text-sm font-bold text-[#302642]">{item.name}</p>{item.detail && <p className="truncate text-xs text-[#82758f]">{item.detail}</p>}</div></div>)}{items.length > limit && <p className="px-2 text-xs font-semibold text-[#6933b4]">+{items.length - limit} más</p>}</div>;
}

/** Avatar del encabezado de perfil: mismo tamaño, forma y borde en todos los roles. */
export function ProfileHeroAvatar({ children }: { children: ReactNode }) {
  return <div className="shrink-0 [&>div]:h-[120px] [&>div]:w-[120px] [&>div]:rounded-2xl [&>div]:border [&>div]:border-border [&>div]:text-3xl">{children}</div>;
}

/** Botón estándar del encabezado de perfil (Configuración). */
export function ProfileSettingsAction({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><Settings size={18} aria-hidden />Configuración</button>;
}

/** Botón secundario reutilizable dentro de las tarjetas de perfil. */
export function ProfileCardAction({ onClick, icon: Icon, className = '', children }: { onClick: () => void; icon?: LucideIcon; className?: string; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#e6daf1] bg-white px-4 text-sm font-bold text-[#6933b4] shadow-sm transition-colors hover:bg-[#f5effc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}>{Icon && <Icon size={18} aria-hidden />}{children}</button>;
}

/** Estado de carga estándar del perfil. */
export function ProfileLoading({ label = 'Cargando perfil...' }: { label?: string }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-[#ebe3f3] bg-white p-4 text-sm text-[#80748c]"><Loader2 size={16} className="animate-spin" aria-hidden />{label}</div>;
}

/** Tarjeta estándar del perfil: título, ícono y contenido. */
export type ProfileSectionSpec = {
  title: string;
  description?: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
};

export type ProfileBaseProps = {
  /** Encabezado común: avatar, nombre, usuario, rol, datos destacados y Configuración. */
  hero: {
    avatar: ReactNode;
    name: string;
    username?: string;
    roleLabel: string;
    secondary?: ReactNode;
    metrics?: ProfileMetric[];
    onSettings?: () => void;
  };
  /** Sección común "Mis datos". */
  data: { items: ProfileInfoItem[]; description?: string };
  /** Sección específica del rol (ej. "Mi autonomía"). Si no existe, "Mis datos" ocupa todo el ancho. */
  roleSection?: ProfileSectionSpec;
  /** Secciones específicas adicionales del rol, en orden y a todo el ancho (antes de la red de apoyo). */
  extraSections?: ProfileSectionSpec[];
  /** Red de apoyo / personas vinculadas. Siempre al final. */
  relations: {
    title: string;
    description?: string;
    icon: LucideIcon;
    action?: ReactNode;
    items: ProfileRelationItem[];
    emptyText: string;
    children?: ReactNode;
  };
  /** Avisos de estado (carga / error) del perfil. */
  notice?: ReactNode;
};

/**
 * Base de perfil reutilizable: misma estructura, tipografía, colores y espaciados
 * para todos los roles. Solo cambia la información y las secciones específicas.
 */
export function ProfileBase({ hero, data, roleSection, extraSections, relations, notice }: ProfileBaseProps) {
  const dataSection = (
    <ProfileSection title="Mis datos" description={data.description ?? 'Información de tu cuenta'} icon={UserRound}>
      <ProfileInfoGrid items={data.items} />
    </ProfileSection>
  );

  return (
    <ProfileLayout>
      {notice}
      <ProfileHero
        avatar={hero.avatar}
        name={hero.name}
        username={hero.username}
        roleLabel={hero.roleLabel}
        secondary={hero.secondary}
        metrics={hero.metrics}
        action={hero.onSettings ? <ProfileSettingsAction onClick={hero.onSettings} /> : undefined}
      />
      {roleSection ? (
        <ProfileGrid>
          {dataSection}
          <ProfileSection title={roleSection.title} description={roleSection.description} icon={roleSection.icon} action={roleSection.action}>
            {roleSection.children}
          </ProfileSection>
        </ProfileGrid>
      ) : (
        dataSection
      )}
      {extraSections?.map(section => (
        <ProfileSection key={section.title} title={section.title} description={section.description} icon={section.icon} action={section.action}>
          {section.children}
        </ProfileSection>
      ))}
      <ProfileSection title={relations.title} description={relations.description} icon={relations.icon} action={relations.action}>
        <CompactRelations items={relations.items} emptyText={relations.emptyText} />
        {relations.children}
      </ProfileSection>
    </ProfileLayout>
  );
}
