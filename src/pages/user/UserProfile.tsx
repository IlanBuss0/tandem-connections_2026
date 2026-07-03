import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { fetchUserProfileDashboard, joinTutorInviteByCode, type ProfileSupportPerson, type UserProfileDashboard } from '@/data/api';
import { AlertCircle, Check, Crown, KeyRound, Loader2, Mail, Phone, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import { toast } from '@/hooks/ui/use-toast';

function InfoItem({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="rounded-2xl sm:rounded-3xl border border-[#f0e8f8] bg-white p-3 shadow-lg">
      <p className="text-[11px] font-medium uppercase tracking-normal text-[#8b7aa0]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#4a4a5a]">{String(value)}</p>
    </div>
  );
}

function SupportCard({ person }: { person: ProfileSupportPerson }) {
  const isTutor = person.role === 'tutor';

  return (
    <div className="rounded-2xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#6b4c9a]">
          {isTutor ? <Users size={22} /> : <ShieldCheck size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm text-[#4a4a5a]">{person.name}</p>
            {person.isPrimary && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Principal
              </span>
            )}
          </div>
          <p className="text-xs text-[#8b7aa0]">{person.detail}</p>
          <p className="mt-1 text-[11px] font-medium text-[#6b4c9a]">{person.status}</p>
          <div className="mt-3 space-y-1 text-xs text-[#8b7aa0]">
            {person.email && (
              <p className="flex items-center gap-2">
                <Mail size={13} />
                {person.email}
              </p>
            )}
            {person.phone && (
              <p className="flex items-center gap-2">
                <Phone size={13} />
                {person.phone}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfile({ onConfigure }: { onConfigure?: () => void }) {
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

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">Mi perfil</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">Datos personales, apoyo y progreso.</p>
        </div>
        {onConfigure && (
          <button onClick={onConfigure} className="inline-flex items-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95">
            <Settings size={15} />
            Configurar
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && !profile && (
        <div className="flex items-center gap-2 rounded-2xl border border-[#f0e8f8] bg-white p-4 text-sm text-[#8b7aa0] shadow-lg">
          <Loader2 size={16} className="animate-spin" />
          Cargando perfil...
        </div>
      )}

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-5 shadow-lg">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AvatarPreview equipped={wallet.equipped} appearance={wallet.appearance} size={136} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#6b4c9a]">{fullName}</h3>
                <p className="text-sm text-[#8b7aa0]">@{username}</p>
              </div>
              <div className="flex justify-center sm:justify-end">
                <CoinBadge size="md" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <InfoItem label="Nivel" value={profile?.level ?? user.level} />
              <InfoItem label="Puntos" value={profile?.points ?? user.points} />
              <InfoItem label="Experiencia" value={profile?.experience ?? 0} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Correo" value={email} />
        <InfoItem label="Telefono" value={profile?.usuario?.telefono ? String(profile.usuario.telefono) : 'Sin registrar'} />
        <InfoItem label="Nacimiento" value={birthDate} />
        <InfoItem label="Ingreso" value={joinedAt} />
      </section>

      <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
          <UserRound size={16} className="text-[#6b4c9a]" />
          Perfil de autonomía
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem label="Nivel de apoyo" value={profile?.supportLevel || 'Sin registrar'} />
          <InfoItem label="Autonomía" value={profile?.autonomy || 'Sin registrar'} />
          <InfoItem label="Autogestión" value={profile?.canSelfManage ? 'Habilitada' : 'Asistida'} />
        </div>
        {profile?.observation && (
          <div className="mt-3 rounded-2xl bg-[#faf8ff] p-3">
            <p className="text-[11px] font-medium uppercase tracking-normal text-[#8b7aa0]">Observación</p>
            <p className="mt-1 text-sm text-[#4a4a5a]">{profile.observation}</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
          <Users size={16} className="text-[#6b4c9a]" />
          Mi red de apoyo
        </h3>
        <form onSubmit={acceptInviteByCode} className="mb-3 rounded-2xl border border-[#f0e8f8] bg-white p-4 shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label className="text-xs font-semibold uppercase text-[#8b7aa0]" htmlFor="invite-code">
                Vincular tutor con codigo
              </label>
              <div className="mt-1 flex items-center gap-2">
                <KeyRound size={18} className="shrink-0 text-[#6b4c9a]" />
                <input
                  id="invite-code"
                  value={inviteCode}
                  onChange={event => setInviteCode(event.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  placeholder="ABCD-1234"
                  className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm font-mono font-semibold tracking-[0.12em] text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]"
                  maxLength={9}
                  autoComplete="one-time-code"
                />
              </div>
            </div>
            <button type="submit" disabled={joiningInvite || !inviteCode.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 disabled:opacity-60">
              {joiningInvite ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
              Vincular
            </button>
          </div>
        </form>
        {allSupport.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {allSupport.map((person) => (
              <SupportCard key={`${person.role}-${person.id}`} person={person} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-6 py-14 text-center text-sm text-[#8b7aa0] shadow-sm">
            No hay vinculos de apoyo registrados.
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-semibold text-[#6b4c9a]">
          <Crown size={16} className="text-amber-500" />
          Planes disponibles
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {(profile?.plans || []).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 shadow-lg ${
                plan.highlighted ? 'border-[#6b4c9a] bg-[#f5f0ff]' : 'border-[#f0e8f8] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-lg font-bold text-[#6b4c9a]">{plan.name}</h4>
                  <p className="mt-1 text-2xl font-bold text-[#6b4c9a]">
                    {plan.price}
                    <span className="text-sm font-normal text-[#8b7aa0]"> {plan.period}</span>
                  </p>
                </div>
                {plan.badge && (
                  <span className="rounded-full bg-[#f5f0ff] px-2 py-1 text-[10px] font-semibold text-[#8b7aa0]">
                    {plan.badge}
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-[#8b7aa0]">
                    <Check size={14} className="mt-0.5 shrink-0 text-[#6b4c9a]" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {profile && profile.plans.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[#e0d8f0] bg-[#faf8ff] px-6 py-14 text-center text-sm text-[#8b7aa0] shadow-sm md:col-span-2">
              No hay planes cargados.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
