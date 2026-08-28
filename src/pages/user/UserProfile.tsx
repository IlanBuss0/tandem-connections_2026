import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { fetchUserProfileDashboard, joinTutorInviteByCode, type UserProfileDashboard } from '@/data/api';
import { AlertCircle, Check, Crown, KeyRound, Loader2, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { toast } from '@/hooks/ui/use-toast';
import { CompactRelations, ProfileGrid, ProfileHero, ProfileInfoGrid, ProfileLayout, ProfileSection } from '@/components/account/ProfileLayout';

export default function UserProfile({ onConfigure, embedded = false }: { onConfigure?: () => void; embedded?: boolean }) {
  const { user, refreshUser } = useAuth();
  const { state: wallet } = useWallet();
  const [profile, setProfile] = useState<UserProfileDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningInvite, setJoiningInvite] = useState(false);

  const load = async () => {
    if (!user || user.role !== 'user') return;
    setLoading(true);
    setError(null);

    try {
      setProfile(await fetchUserProfileDashboard(user.id));
    } catch {
      setProfile(null);
      setError('No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const acceptInviteByCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = inviteCode.trim();
    if (!code) return;

    setJoiningInvite(true);
    try {
      await joinTutorInviteByCode(code);
      setInviteCode('');
      await Promise.all([load(), refreshUser().catch(() => null)]);
      toast({ title: 'Tutor vinculado', description: 'Tu red de apoyo se actualizo correctamente.' });
    } catch (err) {
      toast({ title: 'No se pudo vincular', description: err instanceof Error ? err.message : 'Codigo invalido o expirado.', variant: 'destructive' });
    } finally {
      setJoiningInvite(false);
    }
  };

  if (!user || user.role !== 'user') return null;

  const fullName = profile?.usuario
    ? [profile.usuario.nombre, profile.usuario.apellido].filter(Boolean).join(' ')
    : user.name;
  const username = profile?.usuario?.nombre_usuario || user.username;
  const email = profile?.usuario?.correo || user.email;
  const birthDate = profile?.usuario?.fecha_nacimiento
    ? new Date(profile.usuario.fecha_nacimiento).toLocaleDateString('es-AR')
    : 'Sin registrar';
  const joinedAt = profile?.usuario?.fecha_ingreso
    ? new Date(profile.usuario.fecha_ingreso).toLocaleDateString('es-AR')
    : 'Sin registrar';
  const allSupport = [...(profile?.tutors || []), ...(profile?.professionals || [])];

  const selectedPlan = profile?.plans.find(plan => plan.highlighted) || profile?.plans[0];
  return <ProfileLayout embedded={embedded}>
    {error && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={16} />{error}</div>}
    {loading && !profile && <div className="flex items-center gap-2 rounded-2xl border border-[#ebe3f3] bg-white p-4 text-sm text-[#80748c]"><Loader2 size={16} className="animate-spin" />Cargando perfil...</div>}
    <ProfileHero avatar={<AvatarPreview equipped={wallet.equipped} appearance={wallet.appearance} size={120} />} name={fullName} username={username} roleLabel="Perteneciente" secondary={<CoinBadge size="md" />} metrics={[{ label: 'Nivel', value: profile?.level ?? user.level }, { label: 'Puntos', value: profile?.points ?? user.points }, { label: 'Experiencia', value: profile?.experience ?? 0 }]} action={onConfigure && <button type="button" onClick={onConfigure} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#d7c4eb] bg-white px-4 text-sm font-bold text-[#6530ad] shadow-sm hover:bg-[#f7f1fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b35b5]"><Settings size={16} />Configurar</button>} />
    <ProfileGrid>
      <ProfileSection title="Mis datos" description="Información de tu cuenta" icon={UserRound}><ProfileInfoGrid items={[{ label: 'Correo', value: email }, { label: 'Teléfono', value: profile?.usuario?.telefono ? String(profile.usuario.telefono) : 'Sin registrar' }, { label: 'Nacimiento', value: birthDate }, { label: 'Usuario', value: `@${username}` }, { label: 'Ingreso', value: joinedAt, wide: true }]} /></ProfileSection>
      <ProfileSection title="Mi autonomía" description="Tu configuración de apoyo" icon={ShieldCheck}><ProfileInfoGrid items={[{ label: 'Nivel de apoyo', value: profile?.supportLevel || 'Sin registrar' }, { label: 'Autonomía', value: profile?.autonomy || 'Sin registrar' }, { label: 'Autogestión', value: profile?.canSelfManage ? 'Habilitada' : 'Asistida', wide: true }, ...(profile?.observation ? [{ label: 'Observación', value: profile.observation, wide: true }] : [])]} /></ProfileSection>
    </ProfileGrid>
    <ProfileGrid primary="2fr" secondary="1fr">
      <ProfileSection title="Mi red de apoyo" description="Tutores y profesionales vinculados" icon={Users}><CompactRelations items={allSupport.map(person => ({ id: `${person.role}-${person.id}`, name: person.name, detail: `${person.detail} · ${person.status}` }))} emptyText="Todavía no hay vínculos de apoyo." /><form onSubmit={acceptInviteByCode} className="mt-3 flex flex-col gap-2 sm:flex-row"><label htmlFor="invite-code" className="sr-only">Código para vincular tutor</label><div className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl border border-[#e6daf1] bg-[#fcfaff] px-3"><KeyRound size={16} className="text-[#6933b4]" /><input id="invite-code" value={inviteCode} onChange={event => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="Código de tutor" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" maxLength={9} autoComplete="one-time-code" /></div><button type="submit" disabled={joiningInvite || !inviteCode.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#6933b4] px-4 text-sm font-bold text-white disabled:opacity-60">{joiningInvite ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}Vincular</button></form></ProfileSection>
      <ProfileSection title="Mi plan" description="Resumen de tu plan actual" icon={Crown}>{selectedPlan ? <div className="rounded-2xl bg-[#f5effc] p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-bold text-[#552593]">{selectedPlan.name}</p><p className="mt-1 text-xl font-bold text-[#6933b4]">{selectedPlan.price}<span className="text-xs font-medium text-[#80748c]"> {selectedPlan.period}</span></p></div>{selectedPlan.badge && <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-[#6933b4]">{selectedPlan.badge}</span>}</div><ul className="mt-3 space-y-1.5">{selectedPlan.features.slice(0, 3).map(feature => <li key={feature} className="flex gap-2 text-xs text-[#716581]"><Check size={13} className="shrink-0 text-[#6933b4]" />{feature}</li>)}</ul></div> : <p className="rounded-2xl border border-dashed border-[#ddd0eb] p-6 text-center text-sm text-[#80748c]">Sin plan registrado.</p>}</ProfileSection>
    </ProfileGrid>
  </ProfileLayout>;
}
