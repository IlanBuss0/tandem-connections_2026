import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Loader2, Mail, Save, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tandemApi, type TutorAccount } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import AccountSecuritySettings from '@/components/account/AccountSecuritySettings';
import SettingsLayout, { SettingsSectionHeader, type SettingsCategory } from '@/components/account/SettingsLayout';
import { CompactRelations, ProfileGrid, ProfileHero, ProfileInfoGrid, ProfileLayout, ProfileSection } from '@/components/account/ProfileLayout';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import type { TutorHomeLinkedUser } from '@/data/api';

const emptyAccount: TutorAccount = { id: 0, id_tutor: 0, nombre_usuario: '', nombre: '', apellido: '', correo: '', telefono: '', parentesco: '', email_verificado: false };
const categories: SettingsCategory<'account'>[] = [{ id: 'account', label: 'Cuenta', description: 'Datos y seguridad', icon: UserRound }];

export default function TutorAccountSettings({ onManageConnections, linkedUsers }: { onManageConnections: () => void; linkedUsers: TutorHomeLinkedUser[] }) {
  const { user, refreshUser, logout } = useAuth();
  const [account, setAccount] = useState<TutorAccount>(emptyAccount);
  const [view, setView] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    tandemApi.auth.getTutorAccount().then(data => { if (active) setAccount(data); }).catch(error => toast({ title: 'No pudimos cargar tu perfil', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' })).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const updated = await tandemApi.auth.updateTutorAccount({ nombre: account.nombre, apellido: account.apellido, correo: account.correo, telefono: account.telefono, parentesco: account.parentesco });
      setAccount(updated); await refreshUser(); toast({ title: 'Perfil actualizado', description: 'Tus datos se guardaron correctamente.' });
    } catch (error) { toast({ title: 'No se pudieron guardar los cambios', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' }); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-56 items-center justify-center" aria-label="Cargando perfil"><Loader2 className="animate-spin text-primary" /></div>;
  const fullName = [account.nombre, account.apellido].filter(Boolean).join(' ') || user?.name || 'Tutor';
  const relations = linkedUsers.map(item => ({ id: item.id, name: item.name, detail: [item.supportLevel, item.autonomy].filter(Boolean).join(' · ') || 'Perteneciente vinculado' }));

  if (view === 'profile') return <ProfileLayout>
    <ProfileHero avatar={<div className="[&>div]:h-24 [&>div]:w-24 [&>div]:text-2xl sm:[&>div]:h-28 sm:[&>div]:w-28"><HeaderUserAvatar avatar={user?.avatar} name={fullName} /></div>} name={fullName} username={account.nombre_usuario} roleLabel="Tutor" secondary={account.parentesco || 'Red de apoyo'} metrics={[{ label: 'Vinculados', value: linkedUsers.length }, { label: 'Correo', value: account.email_verificado ? 'Verificado' : 'Pendiente' }]} action={<button type="button" onClick={() => setView('settings')} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#d7c4eb] bg-white px-4 text-sm font-bold text-[#6530ad] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b35b5]"><Settings size={16} />Configurar</button>} />
    <ProfileGrid>
      <ProfileSection title="Mis datos" description="Información de tu cuenta" icon={UserRound}><ProfileInfoGrid items={[{ label: 'Correo', value: account.correo }, { label: 'Teléfono', value: account.telefono || 'Sin registrar' }, { label: 'Usuario', value: `@${account.nombre_usuario}` }, { label: 'Relación', value: account.parentesco || 'Sin registrar' }]} /></ProfileSection>
      <ProfileSection title="Estado de cuenta" description="Acceso y verificación" icon={ShieldCheck}><ProfileInfoGrid items={[{ label: 'Correo', value: account.email_verificado ? 'Verificado' : 'Pendiente' }, { label: 'Rol', value: 'Tutor' }]} /></ProfileSection>
    </ProfileGrid>
    <ProfileSection title="Pertenecientes vinculados" description="Personas que acompañás actualmente" icon={Users} action={<Button type="button" variant="ghost" onClick={onManageConnections}>Ver todos</Button>}><CompactRelations items={relations} emptyText="Todavía no hay pertenecientes vinculados." /></ProfileSection>
  </ProfileLayout>;

  return <form onSubmit={saveProfile}><SettingsLayout categories={categories} active="account" onChange={() => {}} footer={<div className="flex flex-col justify-between gap-3 rounded-[24px] border border-[#ebe3f3] bg-white p-4 sm:flex-row sm:items-center"><Button type="button" variant="outline" onClick={() => setView('profile')}>Volver al perfil</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Guardar cambios</Button></div>}><div className="space-y-6"><SettingsSectionHeader icon={UserRound} title="Cuenta" description="Administrá tus datos personales y la seguridad del acceso." /><AccountSecuritySettings compact /><section className="rounded-[24px] border border-[#ebe3f3] p-4 sm:p-5"><div className="mb-5 flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f0e6fc] text-[#6933b4]"><UserRound size={20} /></span><div><h3 className="font-bold">Datos personales</h3><p className="text-sm text-muted-foreground">Información correspondiente a tu cuenta de Tutor.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre"><Input value={account.nombre} onChange={e => setAccount({ ...account, nombre: e.target.value })} required autoComplete="given-name" /></Field><Field label="Apellido"><Input value={account.apellido} onChange={e => setAccount({ ...account, apellido: e.target.value })} required autoComplete="family-name" /></Field><Field label="Correo"><Input type="email" value={account.correo} readOnly className="cursor-not-allowed bg-muted/60" /></Field><Field label="Teléfono"><Input type="tel" value={String(account.telefono || '')} onChange={e => setAccount({ ...account, telefono: e.target.value })} autoComplete="tel" /></Field><Field label="Parentesco o relación"><Input value={account.parentesco || ''} onChange={e => setAccount({ ...account, parentesco: e.target.value })} placeholder="Ej. madre, padre, tutor legal" /></Field><div className="rounded-2xl bg-[#faf7fd] p-4"><p className="text-sm font-semibold">Estado del correo</p><p className={`mt-1 flex items-center gap-2 text-sm ${account.email_verificado ? 'text-emerald-700' : 'text-amber-700'}`}>{account.email_verificado ? <CheckCircle2 size={17} /> : <Mail size={17} />}{account.email_verificado ? 'Correo verificado' : 'Verificación pendiente'}</p></div></div><Button type="button" variant="outline" onClick={onManageConnections} className="mt-5">Gestionar vínculos y permisos</Button></section><section className="flex flex-col gap-3 rounded-[24px] border border-[#ebe3f3] p-4 sm:flex-row sm:items-center"><ShieldCheck className="text-primary" /><div className="flex-1"><h3 className="font-bold">Sesión actual</h3><p className="text-sm text-muted-foreground">Cerrá tu sesión en este dispositivo.</p></div><Button type="button" variant="outline" onClick={logout}>Cerrar sesión</Button></section></div></SettingsLayout></form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
