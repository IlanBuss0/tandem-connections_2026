import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Eye, EyeOff, HeartHandshake, RotateCcw, Sparkles, Stethoscope, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/api/client';
import { ApiError } from '@/services/api/client';
import type { RegisterRole } from '@/services/api';

type AuthView = 'welcome' | 'login' | 'register';
type RegisterStep = 'role' | 'details';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Misma regla que el backend: 8+ caracteres, al menos una letra y un numero.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const ROLE_OPTIONS: { value: RegisterRole; title: string; description: string; icon: typeof UserIcon }[] = [
  {
    value: 'perteneciente',
    title: 'Soy la persona que usa Tándem',
    description: 'Vas a manejar tu propia cuenta y tus actividades.',
    icon: UserIcon,
  },
  {
    value: 'tutor',
    title: 'Soy tutor o familiar',
    description: 'Vas a acompañar y vincularte con alguien que usa Tándem.',
    icon: HeartHandshake,
  },
  {
    value: 'profesional',
    title: 'Soy profesional',
    description: 'Vas a trabajar con pacientes dentro de la plataforma.',
    icon: Stethoscope,
  },
];

const authGradient = 'linear-gradient(90deg, #6F518E 0%, #C9A7EB 100%)';

type LoginProps = {
  initialView?: Exclude<AuthView, 'welcome'>;
  onBackToLanding?: () => void;
  onViewChange?: (view: AuthView) => void;
};

export default function Login({ initialView, onBackToLanding, onViewChange }: LoginProps) {
  const { login, register, googleAuth } = useAuth();
  const [view, setView] = useState<AuthView>(initialView ?? 'welcome');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('role');
  const [registerRole, setRegisterRole] = useState<RegisterRole | null>(null);
  const [registerNombre, setRegisterNombre] = useState('');
  const [registerApellido, setRegisterApellido] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerParentesco, setRegisterParentesco] = useState('');
  const [registerProfesion, setRegisterProfesion] = useState('');
  const [registerMatricula, setRegisterMatricula] = useState('');
  const [registerEspecialidad, setRegisterEspecialidad] = useState('');
  const [registerDniFrente, setRegisterDniFrente] = useState<File | null>(null);
  const [registerDniPreview, setRegisterDniPreview] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  // Access token de Google en espera de que el usuario elija su rol (cuenta
  // nueva) o complete matricula/profesion (rol profesional). Google ya dio
  // nombre/mail, asi que en ese caso el paso de detalles NO pide password.
  const [pendingGoogleToken, setPendingGoogleToken] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [error, setError] = useState('');
  const [showCredentials, setShowCredentials] = useState(false);

  useEffect(() => {
    if (initialView) {
      setView(initialView);
      resetFeedback();
    }
  }, [initialView]);

  useEffect(() => () => {
    if (registerDniPreview) URL.revokeObjectURL(registerDniPreview);
  }, [registerDniPreview]);

  const resetFeedback = () => {
    setError('');
    setShowCredentials(false);
  };

  const updateDniFrente = (file?: File | null) => {
    if (registerDniPreview) URL.revokeObjectURL(registerDniPreview);
    setRegisterDniFrente(file || null);
    setRegisterDniPreview(file ? URL.createObjectURL(file) : null);
  };

  const goTo = (nextView: AuthView) => {
    resetFeedback();
    setView(nextView);
    if (nextView === 'register') {
      setRegisterStep('role');
      setRegisterRole(null);
      setPendingGoogleToken(null);
      updateDniFrente(null);
    }
    onViewChange?.(nextView);
  };

  const completeGoogleAuth = async (accessToken: string, role?: RegisterRole) => {
    setGoogleLoading(true);
    setError('');
    try {
      const payload: { accessToken: string } & Record<string, string | File | undefined> = { accessToken };
      if (role) payload.rol = role;
      if (role === 'tutor') payload.parentesco = registerParentesco.trim() || undefined;
      if (role === 'profesional') {
        payload.profesion = registerProfesion.trim();
        payload.matricula = registerMatricula.trim();
        payload.especialidad = registerEspecialidad.trim() || undefined;
        payload.dniFrente = registerDniFrente || undefined;
      }
      await googleAuth(payload);
      setPendingGoogleToken(null);
    } catch (err) {
      const needsRole =
        err instanceof ApiError &&
        err.payload &&
        typeof err.payload === 'object' &&
        (err.payload as { code?: string }).code === 'GOOGLE_NEEDS_ROL';

      if (needsRole) {
        setPendingGoogleToken(accessToken);
        setView('register');
        setRegisterStep('role');
        setError('Elegí tu rol para terminar de crear tu cuenta con Google.');
        return;
      }

      setError(err instanceof ApiError ? err.message : 'No se pudo continuar con Google.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    let accessToken: string;
    try {
      const { requestGoogleLoginAccessToken } = await import('@/lib/googleAuth');
      accessToken = await requestGoogleLoginAccessToken();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir el login de Google.');
      return;
    }

    await completeGoogleAuth(accessToken, registerRole ?? undefined);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim();
    setUsername(cleanUsername);

    if (!cleanUsername || !(await login(cleanUsername, password))) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  const handleSelectRole = (role: RegisterRole) => {
    resetFeedback();
    setRegisterRole(role);

    if (pendingGoogleToken && role !== 'profesional') {
      void completeGoogleAuth(pendingGoogleToken, role);
      return;
    }

    setRegisterStep('details');
  };

  const handleRegisterBack = () => {
    resetFeedback();
    setRegisterStep('role');
    setRegisterRole(null);
    setPendingGoogleToken(null);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!registerRole) {
      setError('Elegí quién sos para continuar');
      setRegisterStep('role');
      return;
    }

    if (pendingGoogleToken) {
      if (registerRole === 'profesional' && (!registerProfesion.trim() || !registerMatricula.trim() || !registerDniFrente)) {
        setError('Completá profesión, matrícula y foto del frente del DNI para registrarte como profesional');
        return;
      }
      await completeGoogleAuth(pendingGoogleToken, registerRole);
      return;
    }

    const nombre = registerNombre.trim();
    const apellido = registerApellido.trim();
    const nombreUsuario = registerUsername.trim();
    const correo = registerEmail.trim();

    if (!nombre || !apellido || !nombreUsuario || !correo || !registerPassword || !registerConfirmPassword) {
      setError('Completá todos los campos para registrarte');
      return;
    }

    if (!EMAIL_REGEX.test(correo)) {
      setError('El correo no tiene un formato válido');
      return;
    }

    if (!PASSWORD_REGEX.test(registerPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, con letras y números');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (registerRole === 'profesional' && (!registerProfesion.trim() || !registerMatricula.trim() || !registerDniFrente)) {
      setError('Completá profesión, matrícula y foto del frente del DNI para registrarte como profesional');
      return;
    }

    setRegisterLoading(true);
    try {
      await register({
        rol: registerRole,
        nombre,
        apellido,
        nombre_usuario: nombreUsuario,
        correo,
        contrasena: registerPassword,
        ...(registerRole === 'tutor' ? { parentesco: registerParentesco.trim() || undefined } : {}),
        ...(registerRole === 'profesional'
          ? {
              profesion: registerProfesion.trim(),
              matricula: registerMatricula.trim(),
              especialidad: registerEspecialidad.trim() || undefined,
              dniFrente: registerDniFrente,
            }
          : {}),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar el registro. Probá de nuevo.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const Logo = ({ compact = false }: { compact?: boolean }) => (
    <img
      src="/tandem-logo.png"
      alt="Tandem"
      className={compact ? 'mx-auto h-auto w-[224px]' : 'mx-auto h-auto w-[294px] max-w-[78vw]'}
    />
  );

  return (
    <main className="min-h-screen bg-[#F8FAFB] text-[#6F518E]">
      <section className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-8 py-10">
        {view === 'welcome' ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex min-h-[calc(100vh-5rem)] flex-col"
          >
            <div className="flex flex-1 items-center justify-center pb-16">
              <Logo />
            </div>

            <div className="space-y-7 pb-[17vh]">
              <AuthActionButton onClick={() => goTo('login')}>Iniciar sesión</AuthActionButton>
              <AuthActionButton onClick={() => goTo('register')}>Registrarse</AuthActionButton>
              <TermsText />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex min-h-[calc(100vh-5rem)] flex-col"
          >
            <button
              type="button"
              onClick={() => {
                if (view === 'register' && registerStep === 'details') {
                  handleRegisterBack();
                } else if (onBackToLanding) {
                  resetFeedback();
                  onBackToLanding();
                } else {
                  goTo('welcome');
                }
              }}
              className="mb-10 flex h-11 w-11 items-center justify-center rounded-full text-[#6F518E] transition hover:bg-[#C9A7EB]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A7EB]"
              aria-label="Volver"
            >
              <ArrowLeft size={24} />
            </button>

            <div className="mb-12">
              <Logo compact />
            </div>

            {view === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <AuthField
                  label="Usuario o email"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="ej: juan123"
                />

                <PasswordField
                  label="Contraseña"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(prev => !prev)}
                />

                <a href="/olvidaste-contrasena" className="block text-right text-sm font-semibold text-[#6F518E] underline-offset-4 hover:underline">¿Olvidaste tu contraseña?</a>

                <Feedback message={error} />

                <AuthActionButton type="submit">Iniciar sesión</AuthActionButton>

                <SocialAuthButtons mode="login" onSelect={handleGoogleAuth} loading={googleLoading} />

                <button
                  type="button"
                  onClick={() => goTo('register')}
                  className="mx-auto block text-sm font-semibold text-[#6F518E] underline-offset-4 hover:underline"
                >
                  Crear cuenta
                </button>

                <DemoCredentials
                  show={showCredentials}
                  onToggle={() => setShowCredentials(prev => !prev)}
                />
              </form>
            ) : registerStep === 'role' ? (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h2 className="text-xl font-extrabold text-[#6F518E]">¿Quién sos?</h2>
                  <p className="text-sm font-medium text-[#6F518E]/70">
                    {pendingGoogleToken
                      ? 'Ya tenemos tu nombre y mail de Google — solo faltar elegir tu rol.'
                      : 'Elegí la opción que te describe para armar tu cuenta.'}
                  </p>
                </div>

                <div className="space-y-3">
                  {ROLE_OPTIONS.map(option => (
                    <RoleOption
                      key={option.value}
                      option={option}
                      disabled={googleLoading}
                      onSelect={() => handleSelectRole(option.value)}
                    />
                  ))}
                </div>

                <Feedback message={error} />

                <button
                  type="button"
                  onClick={() => goTo('login')}
                  className="mx-auto block text-sm font-semibold text-[#6F518E] underline-offset-4 hover:underline"
                >
                  Ya tengo cuenta
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                {pendingGoogleToken && (
                  <p className="rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-sm font-semibold text-[#6F518E]">
                    Ya tenemos tu nombre y mail de Google. Solo faltan estos datos para terminar.
                  </p>
                )}

                {!pendingGoogleToken && (
                  <>
                    <AuthField
                      label="Nombre"
                      value={registerNombre}
                      onChange={e => setRegisterNombre(e.target.value)}
                      placeholder="Tu nombre"
                    />
                    <AuthField
                      label="Apellido"
                      value={registerApellido}
                      onChange={e => setRegisterApellido(e.target.value)}
                      placeholder="Tu apellido"
                    />
                    <AuthField
                      label="Usuario"
                      value={registerUsername}
                      onChange={e => setRegisterUsername(e.target.value)}
                      placeholder="ej: juan123"
                    />
                    <AuthField
                      label="Email"
                      type="email"
                      value={registerEmail}
                      onChange={e => setRegisterEmail(e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </>
                )}

                {registerRole === 'tutor' && !pendingGoogleToken && (
                  <AuthField
                    label="Parentesco (opcional)"
                    value={registerParentesco}
                    onChange={e => setRegisterParentesco(e.target.value)}
                    placeholder="ej: Madre, padre, hermano..."
                  />
                )}

                {registerRole === 'profesional' && (
                  <>
                    <AuthField
                      label="Profesión"
                      value={registerProfesion}
                      onChange={e => setRegisterProfesion(e.target.value)}
                      placeholder="ej: Psicóloga, terapeuta ocupacional..."
                    />
                    <AuthField
                      label="Matrícula"
                      value={registerMatricula}
                      onChange={e => setRegisterMatricula(e.target.value)}
                      placeholder="Tu número de matrícula"
                    />
                    <AuthField
                      label="Especialidad (opcional)"
                      value={registerEspecialidad}
                      onChange={e => setRegisterEspecialidad(e.target.value)}
                      placeholder="ej: TEA, neurodesarrollo..."
                    />
                    <DniFrontField
                      fileName={registerDniFrente?.name || null}
                      previewUrl={registerDniPreview}
                      onChange={file => updateDniFrente(file)}
                      onClear={() => updateDniFrente(null)}
                    />
                  </>
                )}

                {!pendingGoogleToken && (
                  <>
                    <PasswordField
                      label="Contraseña"
                      value={registerPassword}
                      onChange={e => setRegisterPassword(e.target.value)}
                      showPassword={showRegisterPassword}
                      onTogglePassword={() => setShowRegisterPassword(prev => !prev)}
                    />
                    <PasswordField
                      label="Repetir contraseña"
                      value={registerConfirmPassword}
                      onChange={e => setRegisterConfirmPassword(e.target.value)}
                      showPassword={showRegisterPassword}
                      onTogglePassword={() => setShowRegisterPassword(prev => !prev)}
                    />
                  </>
                )}

                <Feedback message={error} />

                <AuthActionButton type="submit" disabled={registerLoading || googleLoading}>
                  {registerLoading || googleLoading
                    ? registerRole === 'profesional'
                      ? 'Verificando tus credenciales profesionales...'
                      : 'Creando cuenta...'
                    : pendingGoogleToken
                      ? 'Continuar'
                      : 'Registrarse'}
                </AuthActionButton>

                {!pendingGoogleToken && (
                  <SocialAuthButtons mode="register" onSelect={handleGoogleAuth} loading={googleLoading} />
                )}

                <button
                  type="button"
                  onClick={() => goTo('login')}
                  className="mx-auto block text-sm font-semibold text-[#6F518E] underline-offset-4 hover:underline"
                >
                  Ya tengo cuenta
                </button>
              </form>
            )}

            <div className="mt-auto pt-10">
              <TermsText />
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
}

function RoleOption({
  option,
  onSelect,
  disabled,
}: {
  option: (typeof ROLE_OPTIONS)[number];
  onSelect: () => void;
  disabled?: boolean;
}) {
  const Icon = option.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="flex w-full items-start gap-4 rounded-2xl border border-[#C9A7EB]/60 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#6F518E] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A7EB] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C9A7EB]/25 text-[#6F518E]">
        <Icon size={22} />
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-bold text-[#6F518E]">{option.title}</span>
        <span className="block text-xs font-medium text-[#6F518E]/65">{option.description}</span>
      </span>
    </button>
  );
}

function DniFrontField({
  fileName,
  previewUrl,
  onChange,
  onClear,
}: {
  fileName: string | null;
  previewUrl: string | null;
  onChange: (file: File | null) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#C9A7EB]/60 bg-white p-4 text-[#6F518E]">
      <div className="space-y-1">
        <p className="text-sm font-extrabold">Verificá tus credenciales profesionales</p>
        <p className="text-xs font-medium leading-relaxed text-[#6F518E]/70">
          Necesitamos una foto del frente de tu DNI para comprobar que tus datos coincidan con el Registro Federal de Profesionales de la Salud.
        </p>
      </div>

      {previewUrl && (
        <img
          src={previewUrl}
          alt="Vista previa del frente del DNI"
          className="h-40 w-full rounded-xl border border-[#C9A7EB]/40 object-cover"
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#6F518E] px-3 text-sm font-bold text-white">
          <Camera size={18} />
          {fileName ? 'Cambiar foto' : 'Subir frente'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            className="sr-only"
            onChange={event => onChange(event.target.files?.[0] || null)}
          />
        </label>
        {fileName && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#C9A7EB]/60 px-3 text-sm font-bold"
          >
            <RotateCcw size={17} />
            Retomar
          </button>
        )}
      </div>
      {fileName && <p className="truncate text-xs font-semibold text-[#6F518E]/60">{fileName}</p>}
    </div>
  );
}

function SocialAuthButtons({
  mode,
  onSelect,
  loading,
}: {
  mode: 'login' | 'register';
  onSelect: () => void;
  loading?: boolean;
}) {
  const label = mode === 'login' ? 'Iniciar sesión' : 'Registrarse';

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#6F518E]/45">
        <span className="h-px flex-1 bg-[#C9A7EB]/45" />
        <span>o continuar con</span>
        <span className="h-px flex-1 bg-[#C9A7EB]/45" />
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={loading}
        aria-label={`${label} con Google`}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-[10px] border border-[#6F518E]/18 bg-white text-sm font-bold text-[#6F518E] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A7EB] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? 'Conectando con Google...' : `${label} con Google`}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.89A6 6 0 0 1 6.1 12c0-.65.11-1.29.31-1.89V7.52H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.48l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.34 2.59C7.2 7.75 9.4 5.99 12 5.99Z" />
    </svg>
  );
}

function AuthActionButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button
      {...props}
      className="h-16 w-full rounded-full border-0 text-lg font-extrabold text-white shadow-[0_10px_18px_rgba(111,81,142,0.28)] transition hover:brightness-105 focus-visible:ring-[#C9A7EB]"
      style={{ background: authGradient }}
    >
      {children}
    </Button>
  );
}

function AuthField({
  label,
  className,
  ...props
}: React.ComponentProps<typeof Input> & { label: string }) {
  return (
    <label className="block space-y-2 text-sm font-bold text-[#6F518E]">
      <span>{label}</span>
      <Input
        {...props}
        className={`h-12 rounded-2xl border-[#C9A7EB]/60 bg-white px-5 text-[#6F518E] placeholder:text-[#6F518E]/45 focus-visible:ring-[#C9A7EB] ${className ?? ''}`}
      />
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  showPassword,
  onTogglePassword,
}: {
  label: string;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  showPassword: boolean;
  onTogglePassword: () => void;
}) {
  return (
    <label className="block space-y-2 text-sm font-bold text-[#6F518E]">
      <span>{label}</span>
      <span className="relative block">
        <Input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder="••••••"
          className="h-12 rounded-2xl border-[#C9A7EB]/60 bg-white px-5 pr-12 text-[#6F518E] placeholder:text-[#6F518E]/45 focus-visible:ring-[#C9A7EB]"
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6F518E]/70 hover:text-[#6F518E]"
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </span>
    </label>
  );
}

function Feedback({ message }: { message: string }) {
  if (!message) return null;

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-center text-sm font-semibold text-[#6F518E]"
    >
      {message}
    </motion.p>
  );
}

function DemoCredentials({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pt-2 text-center">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex items-center justify-center gap-1 text-sm font-semibold text-[#6F518E]/75 hover:text-[#6F518E]"
      >
        <Sparkles size={15} />
        {show ? 'Ocultar' : 'Ver'} credenciales demo
      </button>

      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#6F518E]/80 shadow-sm"
        >
          <p>
            Usuario: <span className="font-mono font-bold text-[#6F518E]">juan123</span>
          </p>
          <p>
            Contraseña: <span className="font-mono font-bold text-[#6F518E]">123456</span>
          </p>
        </motion.div>
      )}
    </div>
  );
}

function TermsText() {
  return (
    <p className="mx-auto max-w-[290px] text-center text-sm font-medium leading-[1.2] text-[#6F518E]/62">
      Al continuar, aceptas nuestros términos de servicio y política de privacidad.
    </p>
  );
}
