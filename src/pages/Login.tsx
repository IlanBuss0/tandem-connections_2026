import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  Check,
  Eye,
  EyeOff,
  HeartHandshake,
  Image as ImageIcon,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { RegisterRole, RefepsProfessional, RefepsSearchResult } from '@/services/api';
import { searchRefepsProfessional } from '@/data/api';

type AuthView = 'welcome' | 'login' | 'register';
type RegisterStep = 'role' | 'details';

// Flujo profesional: 3 pasos más la previsualización de REFEPS (modal).
type ProfStep = 'matricula' | 'identity' | 'account';
type ProfProgress = 1 | 2 | 3;

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

// Especialidades visibles en TÁNDEM (catálogo local del perfil, no datos oficiales).
const TANDEM_SPECIALTIES = [
  'Autismo',
  'Terapia familiar',
  'Adolescentes',
  'Psicología clínica',
  'Neuropsicología',
  'Terapia ocupacional',
  'Psicopedagogía',
  'Comunicación y lenguaje',
  'Aprendizaje',
  'Conducta',
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

  // Datos bases de la cuenta (no profesional).
  const [registerNombre, setRegisterNombre] = useState('');
  const [registerApellido, setRegisterApellido] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerParentesco, setRegisterParentesco] = useState('');

  // Flujo profesional por pasos.
  const [profStep, setProfStep] = useState<ProfStep>('matricula');
  const [profMatricula, setProfMatricula] = useState('');
  const [profSearching, setProfSearching] = useState(false);
  const [refepsData, setRefepsData] = useState<RefepsSearchResult | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<RefepsProfessional | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [refepsError, setRefepsError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // DNI (paso 2).
  const [registerDniFrente, setRegisterDniFrente] = useState<File | null>(null);
  const [registerDniPreview, setRegisterDniPreview] = useState<string | null>(null);
  const [dniModalOpen, setDniModalOpen] = useState(false);

  const [registerLoading, setRegisterLoading] = useState(false);
  // Access token de Google en espera de que el usuario elija su rol (cuenta
  // nueva) o complete matricula/profesion (rol profesional).
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

  const updateDniFrente = (file: File | null) => {
    if (registerDniPreview) URL.revokeObjectURL(registerDniPreview);
    setRegisterDniFrente(file);
    setRegisterDniPreview(file ? URL.createObjectURL(file) : null);
    if (file) setDniModalOpen(false);
  };

  const resetProfessionalFlow = () => {
    setProfStep('matricula');
    setProfMatricula('');
    setProfSearching(false);
    setRefepsData(null);
    setSelectedProfessional(null);
    setSelectedSpecialties([]);
    setRefepsError('');
    setPreviewOpen(false);
    updateDniFrente(null);
  };

  const goTo = (nextView: AuthView) => {
    resetFeedback();
    setView(nextView);
    if (nextView === 'register') {
      setRegisterStep('role');
      setRegisterRole(null);
      setPendingGoogleToken(null);
      updateDniFrente(null);
      resetProfessionalFlow();
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
        payload.profesion = selectedProfessional?.profesion || String(selectedProfessional?.matricula || '');
        payload.matricula = String(selectedProfessional?.matricula || profMatricula.trim());
        payload.especialidad = selectedSpecialties.join(', ') || undefined;
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

    // Profesional: entrar al flujo de 3 pasos empezando por la matrícula.
    if (role === 'profesional') {
      setProfStep('matricula');
      setProfMatricula('');
      setRefepsData(null);
      setSelectedProfessional(null);
      setSelectedSpecialties([]);
      setRefepsError('');
      setRegisterStep('details');
      return;
    }

    setRegisterStep('details');
  };

  const handleRegisterBack = () => {
    resetFeedback();
    // Profesional: volver un paso dentro del flujo.
    if (registerRole === 'profesional') {
      if (profStep === 'account') {
        setProfStep('identity');
        return;
      }
      if (profStep === 'identity') {
        setProfStep('matricula');
        return;
      }
    }
    setRegisterStep('role');
    setRegisterRole(null);
    setPendingGoogleToken(null);
  };

  // Paso 1: buscar matrícula en REFEPS.
  const handleSearchMatricula = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setRefepsError('');
    const matricula = profMatricula.trim();
    if (!matricula) {
      setRefepsError('Ingresá tu número de matrícula para continuar.');
      return;
    }

    setProfSearching(true);
    try {
      const result = await searchRefepsProfessional(matricula);
      setRefepsData(result);
      if (!result.found) {
        setRefepsError('No encontramos ninguna matrícula con ese número. Revisalo e intentá de nuevo.');
        return;
      }
      // Resultado único: lo seleccionamos y abrimos el modal de preview.
      if (!result.ambiguous && result.results.length === 1) {
        setSelectedProfessional(result.results[0]);
        setPreviewOpen(true);
        return;
      }
      // Ambiguo: abrimos el modal para que elija.
      setPreviewOpen(true);
    } catch (err) {
      setRefepsError(
        err instanceof ApiError && err.message
          ? err.message
          : 'No pudimos consultar el registro. Intentá nuevamente en unos segundos.',
      );
    } finally {
      setProfSearching(false);
    }
  };

  const toggleSpecialty = (name: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name],
    );
  };

  const handleConfirmRefeps = () => {
    setPreviewOpen(false);
    setProfStep('identity');
  };

  const handleNotMe = () => {
    setPreviewOpen(false);
    setSelectedProfessional(null);
    setRefepsData(null);
    setProfMatricula('');
    setRefepsError('');
    setProfStep('matricula');
  };

  // Paso 3: crear la cuenta (registro normal o Google).
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pendingGoogleToken) {
      if (registerRole === 'profesional' && !registerDniFrente) {
        setError('Subí una foto del frente del DNI para continuar.');
        return;
      }
      await completeGoogleAuth(pendingGoogleToken, registerRole || undefined);
      return;
    }

    const nombre = (selectedProfessional?.nombre || registerNombre).trim();
    const apellido = (selectedProfessional?.apellido || registerApellido).trim();
    const nombreUsuario = registerUsername.trim();
    const correo = registerEmail.trim();

    if (registerRole !== 'profesional' && (!nombre || !apellido || !nombreUsuario || !correo || !registerPassword || !registerConfirmPassword)) {
      setError('Completá todos los campos para registrarte');
      return;
    }

    if (registerRole === 'profesional' && (!nombreUsuario || !correo || !registerPassword || !registerConfirmPassword || !registerDniFrente)) {
      setError('Completá los campos y subí la foto del frente del DNI para registrarte');
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

    setRegisterLoading(true);
    try {
      await register({
        rol: registerRole || 'perteneciente',
        nombre,
        apellido,
        nombre_usuario: nombreUsuario,
        correo,
        contrasena: registerPassword,
        ...(registerRole === 'tutor' ? { parentesco: registerParentesco.trim() || undefined } : {}),
        ...(registerRole === 'profesional'
          ? {
              profesion: selectedProfessional?.profesion || '',
              matricula: String(selectedProfessional?.matricula || profMatricula.trim()),
              especialidad: selectedSpecialties.join(', ') || undefined,
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

  const profProgress: Record<ProfStep, ProfProgress> = {
    matricula: 1,
    identity: 2,
    account: 3,
  };

  const Logo = ({ compact = false }: { compact?: boolean }) => (
    <img
      src="/tandem-logo.png"
      alt="Tandem"
      className={compact ? 'mx-auto h-auto w-[224px]' : 'mx-auto h-auto w-[294px] max-w-[78vw]'}
    />
  );

  const isProfessionalActive = registerRole === 'profesional' && registerStep === 'details';

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
            key={`${view}-${registerStep}-${isProfessionalActive ? profStep : 'none'}`}
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
            ) : isProfessionalActive ? (
              <ProfessionalFlow
                profStep={profStep}
                profProgress={profProgress[profStep]}
                profMatricula={profMatricula}
                setProfMatricula={setProfMatricula}
                profSearching={profSearching}
                refepsError={refepsError}
                onSubmitMatricula={handleSearchMatricula}
                selectedProfessional={selectedProfessional}
                selectedSpecialties={selectedSpecialties}
                toggleSpecialty={toggleSpecialty}
                registerDniPreview={registerDniPreview}
                registerDniFrente={registerDniFrente}
                updateDniFrente={updateDniFrente}
                onOpenDniModal={() => setDniModalOpen(true)}
                onGoToAccount={() => setProfStep('account')}
                onGoogleAuth={handleGoogleAuth}
                pendingGoogleToken={pendingGoogleToken}
                registerUsername={registerUsername}
                setRegisterUsername={setRegisterUsername}
                registerEmail={registerEmail}
                setRegisterEmail={setRegisterEmail}
                registerPassword={registerPassword}
                setRegisterPassword={setRegisterPassword}
                registerConfirmPassword={registerConfirmPassword}
                setRegisterConfirmPassword={setRegisterConfirmPassword}
                showRegisterPassword={showRegisterPassword}
                onToggleRegisterPassword={() => setShowRegisterPassword(prev => !prev)}
                registerLoading={registerLoading}
                googleLoading={googleLoading}
                onRegister={handleRegisterSubmit}
                error={error}
              />
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
                    ? 'Creando cuenta...'
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

      {/* Modal: registro REFEPS encontrado */}
      <RefepsPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        refepsData={refepsData}
        selectedProfessional={selectedProfessional}
        setSelectedProfessional={setSelectedProfessional}
        selectedSpecialties={selectedSpecialties}
        toggleSpecialty={toggleSpecialty}
        onConfirm={handleConfirmRefeps}
        onNotMe={handleNotMe}
      />

      {/* Modal: opciones de subida del DNI */}
      <DniUploadModal
        open={dniModalOpen}
        onOpenChange={setDniModalOpen}
        onSelectFile={updateDniFrente}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// Flujo profesional de 3 pasos
// ---------------------------------------------------------------------------
function ProfessionalFlow({
  profStep,
  profProgress,
  profMatricula,
  setProfMatricula,
  profSearching,
  refepsError,
  onSubmitMatricula,
  selectedProfessional,
  selectedSpecialties,
  toggleSpecialty,
  registerDniPreview,
  registerDniFrente,
  updateDniFrente,
  onOpenDniModal,
  onGoToAccount,
  onGoogleAuth,
  pendingGoogleToken,
  registerUsername,
  setRegisterUsername,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  registerConfirmPassword,
  setRegisterConfirmPassword,
  showRegisterPassword,
  onToggleRegisterPassword,
  registerLoading,
  googleLoading,
  onRegister,
  error,
}: {
  profStep: ProfStep;
  profProgress: ProfProgress;
  profMatricula: string;
  setProfMatricula: (v: string) => void;
  profSearching: boolean;
  refepsError: string;
  onSubmitMatricula: (e?: React.FormEvent) => void;
  selectedProfessional: RefepsProfessional | null;
  selectedSpecialties: string[];
  toggleSpecialty: (name: string) => void;
  registerDniPreview: string | null;
  registerDniFrente: File | null;
  updateDniFrente: (file: File | null) => void;
  onOpenDniModal: () => void;
  onGoToAccount: () => void;
  onGoogleAuth: () => void;
  pendingGoogleToken: string | null;
  registerUsername: string;
  setRegisterUsername: (v: string) => void;
  registerEmail: string;
  setRegisterEmail: (v: string) => void;
  registerPassword: string;
  setRegisterPassword: (v: string) => void;
  registerConfirmPassword: string;
  setRegisterConfirmPassword: (v: string) => void;
  showRegisterPassword: boolean;
  onToggleRegisterPassword: () => void;
  registerLoading: boolean;
  googleLoading: boolean;
  onRegister: (e: React.FormEvent) => void;
  error: string;
}) {
  return (
    <div className="space-y-5">
      <ProgressIndicator current={profProgress} />

      <AnimatePresence mode="wait">
        {profStep === 'matricula' && (
          <motion.form
            key="matricula"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            onSubmit={onSubmitMatricula}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#6F518E]">Ingresá tu matrícula profesional</h2>
              <p className="text-sm font-medium text-[#6F518E]/70">
                Buscamos tu registro en el Registro Federal de Profesionales de la Salud para agilizar tu alta.
              </p>
            </div>

            <AuthField
              label="Matrícula"
              value={profMatricula}
              onChange={e => setProfMatricula(e.target.value)}
              placeholder="Tu número de matrícula"
              autoComplete="off"
            />

            {profSearching && (
              <p className="flex items-center justify-center gap-2 rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-sm font-semibold text-[#6F518E]">
                <Search size={16} className="animate-pulse" />
                Buscando tu registro profesional...
              </p>
            )}

            {!profSearching && refepsError && <Feedback message={refepsError} />}
            {!profSearching && error && <Feedback message={error} />}

            <AuthActionButton type="submit" disabled={profSearching || registerLoading || googleLoading}>
              Continuar
            </AuthActionButton>
          </motion.form>
        )}

        {profStep === 'identity' && (
          <motion.div
            key="identity"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#6F518E]">Verificá tu identidad</h2>
              <p className="text-sm font-medium text-[#6F518E]/70">
                Subí una foto del frente de tu DNI para confirmar tus datos.
              </p>
            </div>

            {selectedProfessional && (
              <div className="space-y-3 rounded-2xl border border-[#C9A7EB]/40 bg-white p-4 text-[#6F518E] shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#4a8f4e]">
                  <BadgeCheck size={15} />
                  Registro verificado por REFEPS
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <LockedField label="Nombre" value={selectedProfessional?.nombre || '—'} />
                  <LockedField label="Apellido" value={selectedProfessional?.apellido || '—'} />
                  <LockedField label="Profesión" value={selectedProfessional?.profesion || '—'} />
                  <LockedField label="Matrícula" value={String(selectedProfessional?.matricula ?? '—')} />
                  <LockedField label="Jurisdicción" value={selectedProfessional?.jurisdiccion || '—'} />
                </div>
              </div>
            )}

            <DniFrontField
              fileName={registerDniFrente?.name || null}
              previewUrl={registerDniPreview}
              onUpload={onOpenDniModal}
              onClear={() => updateDniFrente(null)}
            />

            <Feedback message={error} />

            <AuthActionButton type="button" onClick={onGoToAccount} disabled={!registerDniFrente || registerLoading || googleLoading}>
              Continuar
            </AuthActionButton>
          </motion.div>
        )}

        {profStep === 'account' && (
          <motion.form
            key="account"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
            onSubmit={onRegister}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-[#6F518E]">Creá tu contraseña</h2>
              <p className="text-sm font-medium text-[#6F518E]/70">
                {pendingGoogleToken
                  ? 'Ya tenemos tu nombre y mail de Google. Solo el último paso para terminar.'
                  : 'Elegí una contraseña para tu cuenta. Encontraste tus datos en REFEPS.'}
              </p>
            </div>

            {selectedProfessional && !pendingGoogleToken && (
              <div className="space-y-3 rounded-2xl border border-[#C9A7EB]/40 bg-white p-4 text-[#6F518E] shadow-sm">
                <p className="flex items-center gap-1.5 text-xs font-bold text-[#4a8f4e]">
                  <BadgeCheck size={15} />
                  Datos del registro (no editables)
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <LockedField label="Nombre" value={selectedProfessional?.nombre || '—'} />
                  <LockedField label="Apellido" value={selectedProfessional?.apellido || '—'} />
                  <LockedField label="Profesión" value={selectedProfessional?.profesion || '—'} />
                  <LockedField label="Matrícula" value={String(selectedProfessional?.matricula ?? '—')} />
                </div>
              </div>
            )}

            {!pendingGoogleToken && (
              <>
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

            <PasswordField
              label="Contraseña"
              value={registerPassword}
              onChange={e => setRegisterPassword(e.target.value)}
              showPassword={showRegisterPassword}
              onTogglePassword={onToggleRegisterPassword}
            />
            <PasswordField
              label="Repetir contraseña"
              value={registerConfirmPassword}
              onChange={e => setRegisterConfirmPassword(e.target.value)}
              showPassword={showRegisterPassword}
              onTogglePassword={onToggleRegisterPassword}
            />

            <Feedback message={error} />

            <AuthActionButton type="submit" disabled={registerLoading || googleLoading}>
              {registerLoading || googleLoading
                ? 'Verificando tus credenciales profesionales...'
                : 'Crear cuenta'}
            </AuthActionButton>

            {!pendingGoogleToken && (
              <SocialAuthButtons mode="register" onSelect={onGoogleAuth} loading={googleLoading} />
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressIndicator({ current }: { current: ProfProgress }) {
  const steps: { n: ProfProgress; label: string }[] = [
    { n: 1, label: 'Matrícula' },
    { n: 2, label: 'Identidad' },
    { n: 3, label: 'Cuenta' },
  ];

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-[#6F518E]/60">
        <span>Paso {current} de 3</span>
        <span>{steps.find(s => s.n === current)?.label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {steps.map(step => (
          <div key={step.n} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-extrabold transition ${
                step.n < current
                  ? 'border-[#6F518E] bg-[#6F518E] text-white'
                  : step.n === current
                    ? 'border-[#6F518E] bg-white text-[#6F518E]'
                    : 'border-[#C9A7EB]/60 bg-white text-[#6F518E]/40'
              }`}
            >
              {step.n < current ? <Check size={13} /> : step.n}
            </span>
            <span className={`text-[10px] font-semibold ${step.n === current ? 'text-[#6F518E]' : 'text-[#6F518E]/45'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#6F518E]/50">
        <Lock size={10} />
        {label}
      </span>
      <span className="block truncate text-sm font-bold text-[#6F518E]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal: registro REFEPS encontrado
// ---------------------------------------------------------------------------
function RefepsPreviewModal({
  open,
  onOpenChange,
  refepsData,
  selectedProfessional,
  setSelectedProfessional,
  selectedSpecialties,
  toggleSpecialty,
  onConfirm,
  onNotMe,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refepsData: RefepsSearchResult | null;
  selectedProfessional: RefepsProfessional | null;
  setSelectedProfessional: (p: RefepsProfessional | null) => void;
  selectedSpecialties: string[];
  toggleSpecialty: (name: string) => void;
  onConfirm: () => void;
  onNotMe: () => void;
}) {
  const options = (refepsData?.results || []).filter(
    r => r && typeof r === 'object' && 'matricula' in r,
  );
  const ambiguous = refepsData?.ambiguous || options.length > 1;
  const current = selectedProfessional;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-lg:bottom-0 max-lg:left-0 max-lg:top-auto max-lg:max-h-[90dvh] max-lg:w-full max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-b-none max-lg:rounded-t-3xl max-lg:p-6 sm:max-w-md"
        overlayClassName="bg-black/60"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-extrabold text-[#6F518E]">Registro encontrado</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#6F518E]/70">
            Encontramos tus datos profesionales.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4 overflow-y-auto">
          {current ? (
            <>
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#4a8f4e]">
                <BadgeCheck size={15} />
                Verificado por REFEPS
              </p>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3 rounded-2xl border border-[#C9A7EB]/40 bg-white p-4 text-[#6F518E]">
                <LockedField label="Nombre" value={current?.nombre || '—'} />
                <LockedField label="Apellido" value={current?.apellido || '—'} />
                <LockedField label="Profesión" value={current?.profesion || '—'} />
                <LockedField label="Matrícula" value={String(current?.matricula ?? '—')} />
                <LockedField label="Jurisdicción" value={current?.jurisdiccion || '—'} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-extrabold text-[#6F518E]">Especialidades visibles en TÁNDEM</p>
                <p className="text-xs font-medium text-[#6F518E]/60">
                  Elegí las especialidades que querés mostrar en tu perfil. No modifican tus datos oficiales.
                </p>
                <div className="grid gap-2">
                  {TANDEM_SPECIALTIES.map(name => {
                    const active = selectedSpecialties.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleSpecialty(name)}
                        aria-pressed={active}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${
                          active
                            ? 'border-[#6F518E] bg-[#C9A7EB]/18 text-[#6F518E]'
                            : 'border-[#C9A7EB]/50 bg-white text-[#6F518E]/70'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            active ? 'border-[#6F518E] bg-[#6F518E] text-white' : 'border-[#C9A7EB]/70 bg-white'
                          }`}
                        >
                          {active && <Check size={13} />}
                        </span>
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {ambiguous ? (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-[#6F518E]">Encontramos más de un registro. Elegí el tuyo:</p>
                  <div className="space-y-2">
                    {options.map((r, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedProfessional(r)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                          selectedProfessional === r
                            ? 'border-[#6F518E] bg-[#C9A7EB]/18'
                            : 'border-[#C9A7EB]/50 bg-white'
                        }`}
                      >
                        <span className="text-sm font-bold text-[#6F518E]">{r?.profesion || 'Profesional'}</span>
                        <span className="ml-auto text-xs font-semibold text-[#6F518E]/60">Mat. {String(r?.matricula ?? '')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-sm font-semibold text-[#6F518E]">
                  No pudimos confirmar este registro.
                </p>
              )}
            </>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <AuthActionButton
            type="button"
            disabled={!current}
            onClick={onConfirm}
          >
            Confirmar datos
          </AuthActionButton>
          <button
            type="button"
            onClick={onNotMe}
            className="flex w-full items-center justify-center gap-1 rounded-full py-3 text-sm font-bold text-[#6F518E]/70 transition hover:bg-[#C9A7EB]/15 hover:text-[#6F518E]"
          >
            <X size={16} />
            No soy esta persona
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Modal: subida del DNI (cámara / galería)
// ---------------------------------------------------------------------------
function DniUploadModal({
  open,
  onOpenChange,
  onSelectFile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFile: (file: File | null) => void;
}) {
  const [error, setError] = useState('');

  const acceptFile = (file?: File | null) => {
    if (!file) return;
    const valid = /image\/(png|jpeg|webp)/.test(file.type);
    if (!valid) {
      setError('Formato no válido. Usá una foto PNG, JPG o WebP.');
      return;
    }
    setError('');
    onSelectFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-lg:bottom-0 max-lg:left-0 max-lg:top-auto max-lg:max-h-[70dvh] max-lg:w-full max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-b-none max-lg:rounded-t-3xl max-lg:p-6 sm:max-w-sm"
        overlayClassName="bg-black/60"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-extrabold text-[#6F518E]">Subí el frente de tu DNI</DialogTitle>
          <DialogDescription className="text-sm font-medium text-[#6F518E]/70">
            Elegí cómo querés subir la foto.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#6F518E]/20 bg-white p-4 text-sm font-bold text-[#6F518E] shadow-sm transition hover:-translate-y-0.5 hover:border-[#6F518E] hover:shadow-md">
            <Camera size={18} />
            Tomar foto con cámara
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="sr-only"
              onChange={e => acceptFile(e.target.files?.[0])}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-[#6F518E]/20 bg-white p-4 text-sm font-bold text-[#6F518E] shadow-sm transition hover:-translate-y-0.5 hover:border-[#6F518E] hover:shadow-md">
            <ImageIcon size={18} />
            Elegir de galería
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={e => acceptFile(e.target.files?.[0])}
            />
          </label>
          {error && <Feedback message={error} />}
        </div>
      </DialogContent>
    </Dialog>
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
  onUpload,
  onClear,
}: {
  fileName: string | null;
  previewUrl: string | null;
  onUpload: () => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#C9A7EB]/60 bg-white p-4 text-[#6F518E]">
      <div className="space-y-1">
        <p className="text-sm font-extrabold">Foto del frente de tu DNI</p>
        <p className="text-xs font-medium leading-relaxed text-[#6F518E]/70">
          Necesitamos una foto del frente de tu DNI para confirmar tu identidad.
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
        <button
          type="button"
          onClick={onUpload}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#6F518E] px-3 text-sm font-bold text-white"
        >
          <Camera size={18} />
          {fileName ? 'Cambiar foto' : 'Subir foto'}
        </button>
        {fileName && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#C9A7EB]/60 px-3 text-sm font-bold"
          >
            <RotateCcw size={17} />
            Quitar
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
      <path fill="#EA4335" d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.34 2.59C7.2 7.75 9.4 5.99 12 12 5.99Z" />
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
