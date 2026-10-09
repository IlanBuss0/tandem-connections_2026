import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, Mail, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tandemApi, type TutorAccount } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import AccountSecuritySettings, { AccountSessionSettings } from '@/components/account/AccountSecuritySettings';
import SettingsLayout, { SettingsFooter, SettingsSaveButton, SettingsSection, SettingsSectionHeader, type SettingsCategory } from '@/components/account/SettingsLayout';
import { ProfileBase, ProfileCardAction, ProfileHeroAvatar, ProfileLayout, ProfileLoading } from '@/components/account/ProfileLayout';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import type { TutorHomeLinkedUser } from '@/data/api';

const emptyAccount: TutorAccount = { id: 0, id_tutor: 0, nombre_usuario: '', nombre: '', apellido: '', correo: '', telefono: '', parentesco: '', email_verificado: false };
const categories: SettingsCategory<'account'>[] = [{ id: 'account', label: 'Cuenta', description: 'Datos y seguridad', icon: UserRound }];

export default function TutorAccountSettings({ onManageConnections, linkedUsers, view, onNavigate }: { onManageConnections: () => void; linkedUsers: TutorHomeLinkedUser[]; view: 'profile' | 'settings'; onNavigate: (tab: 'profile' | 'profile-settings') => void }) {
  const { user, refreshUser } = useAuth();
  const [account, setAccount] = useState<TutorAccount>(emptyAccount);
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

  if (loading) return <ProfileLayout><ProfileLoading /></ProfileLayout>;
  const fullName = [account.nombre, account.apellido].filter(Boolean).join(' ') || user?.name || 'Tutor';
  const relations = linkedUsers.map(item => ({
    id: item.id,
    name: item.name,
    detail: [item.supportLevel, item.autonomy, item.linkStatus].filter(Boolean).join(' · ') || 'Perteneciente vinculado',
  }));

  if (view === 'profile') return (
    <ProfileBase
      hero={{
        avatar: <ProfileHeroAvatar><HeaderUserAvatar avatar={user?.avatar} name={fullName} /></ProfileHeroAvatar>,
        name: fullName,
        username: account.nombre_usuario,
        roleLabel: 'Tutor',
        secondary: 'Red de apoyo',
        metrics: [
          { label: 'Vinculados', value: linkedUsers.length },
          { label: 'Correo', value: account.email_verificado ? 'Verificado' : 'Pendiente' },
        ],
        onSettings: () => onNavigate('profile-settings'),
      }}
      data={{
        items: [
          { label: 'Correo', value: account.correo },
          { label: 'Teléfono', value: account.telefono || 'Sin registrar' },
          { label: 'Usuario', value: `@${account.nombre_usuario}` },
          { label: 'Relación', value: account.parentesco || 'Sin registrar' },
        ],
      }}
      relations={{
        title: 'Personas vinculadas',
        description: 'Personas que acompañás actualmente',
        icon: Users,
        action: <ProfileCardAction onClick={onManageConnections}>Ver todos</ProfileCardAction>,
        items: relations,
        emptyText: 'Todavía no hay pertenecientes vinculados.',
      }}
    />
  );

  return <form onSubmit={saveProfile}><SettingsLayout categories={categories} active="account" onChange={() => {}} footer={<SettingsFooter onBack={() => onNavigate('profile')} hint="Guardá los cambios de esta configuración." action={<SettingsSaveButton type="submit" disabled={saving} loading={saving} />} />}><div className="space-y-6"><SettingsSectionHeader icon={UserRound} title="Cuenta" description="Administrá tus datos personales y la seguridad del acceso." /><AccountSecuritySettings compact /><SettingsSection icon={UserRound} title="Datos personales" description="Información correspondiente a tu cuenta de Tutor."><div className="grid gap-4 sm:grid-cols-2"><Field label="Nombre"><Input value={account.nombre} onChange={e => setAccount({ ...account, nombre: e.target.value })} required autoComplete="given-name" /></Field><Field label="Apellido"><Input value={account.apellido} onChange={e => setAccount({ ...account, apellido: e.target.value })} required autoComplete="family-name" /></Field><Field label="Correo"><Input type="email" value={account.correo} readOnly className="cursor-not-allowed bg-muted/60" /></Field><Field label="Teléfono"><Input type="tel" value={String(account.telefono || '')} onChange={e => setAccount({ ...account, telefono: e.target.value })} autoComplete="tel" /></Field><Field label="Parentesco o relación"><Input value={account.parentesco || ''} onChange={e => setAccount({ ...account, parentesco: e.target.value })} placeholder="Ej. madre, padre, tutor legal" /></Field><div className="rounded-2xl bg-[#faf7fd] p-4"><p className="text-sm font-semibold">Estado del correo</p><p className={`mt-1 flex items-center gap-2 text-sm ${account.email_verificado ? 'text-emerald-700' : 'text-amber-700'}`}>{account.email_verificado ? <CheckCircle2 size={17} /> : <Mail size={17} />}{account.email_verificado ? 'Correo verificado' : 'Verificación pendiente'}</p></div></div><Button type="button" variant="outline" onClick={onManageConnections} className="mt-5">Gestionar vínculos y permisos</Button></SettingsSection><AccountSessionSettings /></div></SettingsLayout></form>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
