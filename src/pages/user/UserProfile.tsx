import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { fetchUserProfileDashboard, type ProfileSupportPerson, type UserProfileDashboard } from '@/data/api';
import { AlertCircle, Check, Crown, Loader2, Mail, Phone, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';

function InfoItem({ label, value }: { label: string; value: string | number | boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{String(value)}</p>
    </div>
  );
}

function SupportCard({ person }: { person: ProfileSupportPerson }) {
  const isTutor = person.role === 'tutor';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isTutor ? <Users size={22} /> : <ShieldCheck size={22} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-sm text-foreground">{person.name}</p>
            {person.isPrimary && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Principal
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{person.detail}</p>
          <p className="mt-1 text-[11px] font-medium text-primary">{person.status}</p>
          <div className="mt-3 space-y-1 text-xs text-muted-foreground">
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
  const { user } = useAuth();
  const { state: wallet } = useWallet();
  const [profile, setProfile] = useState<UserProfileDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="space-y-5 pb-20 lg:pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Mi perfil</h2>
          <p className="text-muted-foreground text-sm">Datos personales, apoyo y progreso.</p>
        </div>
        {onConfigure && (
          <Button variant="default" size="sm" onClick={onConfigure} className="w-fit gap-2">
            <Settings size={15} />
            Configurar
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && !profile && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Cargando perfil...
        </div>
      )}

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <AvatarPreview equipped={wallet.equipped} size={136} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-heading font-bold text-foreground">{fullName}</h3>
                <p className="text-sm text-muted-foreground">@{username}</p>
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

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <UserRound size={16} className="text-primary" />
          Perfil de autonomia
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoItem label="Nivel de apoyo" value={profile?.supportLevel || 'Sin registrar'} />
          <InfoItem label="Autonomia" value={profile?.autonomy || 'Sin registrar'} />
          <InfoItem label="Autogestion" value={profile?.canSelfManage ? 'Habilitada' : 'Asistida'} />
        </div>
        {profile?.observation && (
          <div className="mt-3 rounded-lg bg-muted/40 p-3">
            <p className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">Observacion</p>
            <p className="mt-1 text-sm text-foreground">{profile.observation}</p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <Users size={16} className="text-primary" />
          Mi red de apoyo
        </h3>
        {allSupport.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {allSupport.map((person) => (
              <SupportCard key={`${person.role}-${person.id}`} person={person} />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No hay vinculos de apoyo registrados.
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-2 font-heading font-semibold text-foreground">
          <Crown size={16} className="text-amber-500" />
          Planes disponibles
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {(profile?.plans || []).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border p-5 ${
                plan.highlighted ? 'border-primary bg-primary/10' : 'border-border bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-heading text-lg font-bold text-foreground">{plan.name}</h4>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground"> {plan.period}</span>
                  </p>
                </div>
                {plan.badge && (
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {plan.badge}
                  </span>
                )}
              </div>
              <ul className="mt-4 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {profile && profile.plans.length === 0 && (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground md:col-span-2">
              No hay planes cargados.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
