import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { fetchUserProfileDashboard, joinTutorInviteByCode, type UserProfileDashboard } from '@/data/api';
import { AlertCircle, Check, KeyRound, Loader2, ShieldCheck, Users } from 'lucide-react';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { toast } from '@/hooks/ui/use-toast';
import { ProfileBase, ProfileCardAction, ProfileHeroAvatar, ProfileInfoGrid, ProfileLoading } from '@/components/account/ProfileLayout';

export default function UserProfile({ onOpenSettings, onOpenHelpCard }: { onOpenSettings?: () => void; onOpenHelpCard?: () => void }) {
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
  const allSupport = [...(profile?.tutors || []), ...(profile?.professionals || [])];

  return (
    <ProfileBase
      notice={<>
        {error && <div role="alert" className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"><AlertCircle size={16} aria-hidden />{error}</div>}
        {loading && !profile && <ProfileLoading />}
      </>}
      hero={{
        avatar: <ProfileHeroAvatar><AvatarPreview equipped={wallet.equipped} appearance={wallet.appearance} size={120} /></ProfileHeroAvatar>,
        name: fullName,
        username,
        roleLabel: 'Perteneciente',
        secondary: <CoinBadge size="md" />,
        metrics: [
          { label: 'Nivel', value: profile?.level ?? user.level },
          { label: 'Puntos', value: profile?.points ?? user.points },
          { label: 'Experiencia', value: profile?.experience ?? 0 },
        ],
        onSettings: onOpenSettings,
      }}
      data={{
        items: [
          { label: 'Correo', value: email },
          { label: 'Teléfono', value: profile?.usuario?.telefono ? String(profile.usuario.telefono) : 'Sin registrar' },
          { label: 'Fecha de nacimiento', value: birthDate },
          { label: 'Usuario', value: `@${username}` },
        ],
      }}
      roleSection={{
        title: 'Mi autonomía',
        description: 'Tu configuración de apoyo',
        icon: ShieldCheck,
        children: (
          <>
            <ProfileInfoGrid items={[
              { label: 'Nivel de apoyo', value: profile?.supportLevel || 'Sin registrar' },
              { label: 'Autonomía', value: profile?.autonomy || 'Sin registrar' },
              { label: 'Autogestión', value: profile?.canSelfManage ? 'Habilitada' : 'Asistida', wide: true },
              ...(profile?.observation ? [{ label: 'Observación', value: profile.observation, wide: true }] : []),
            ]} />
            {onOpenHelpCard && <ProfileCardAction onClick={onOpenHelpCard} className="mt-5 hidden w-full lg:inline-flex"><span aria-hidden>🪪</span>Mi tarjeta de ayuda</ProfileCardAction>}
          </>
        ),
      }}
      relations={{
        title: 'Mi red de apoyo',
        description: 'Tutores y profesionales vinculados',
        icon: Users,
        items: allSupport.map(person => ({ id: `${person.role}-${person.id}`, name: person.name, detail: `${person.detail} · ${person.status}` })),
        emptyText: 'Todavía no hay vínculos de apoyo.',
        children: (
          <form onSubmit={acceptInviteByCode} className="mt-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor="invite-code" className="sr-only">Código para vincular tutor</label>
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-2xl border border-[#e6daf1] bg-[#fcfaff] px-3">
              <KeyRound size={16} className="text-[#6933b4]" aria-hidden />
              <input id="invite-code" value={inviteCode} onChange={event => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} placeholder="Código de tutor" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" maxLength={9} autoComplete="one-time-code" />
            </div>
            <button type="submit" disabled={joiningInvite || !inviteCode.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#6933b4] px-4 text-sm font-bold text-white disabled:opacity-60">
              {joiningInvite ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Check size={15} aria-hidden />}
              Vincular
            </button>
          </form>
        ),
      }}
    />
  );
}
