import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/services/api/client';

type AuthView = 'welcome' | 'login' | 'register';
type SocialProvider = 'google' | 'facebook' | 'apple';

const authGradient = 'linear-gradient(90deg, #6F518E 0%, #C9A7EB 100%)';

type LoginProps = {
  initialView?: Exclude<AuthView, 'welcome'>;
  onBackToLanding?: () => void;
  onViewChange?: (view: AuthView) => void;
};

export default function Login({ initialView, onBackToLanding, onViewChange }: LoginProps) {
  const { login } = useAuth();
  const [view, setView] = useState<AuthView>(initialView ?? 'welcome');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
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

  const resetFeedback = () => {
    setError('');
    setShowCredentials(false);
  };

  const goTo = (nextView: AuthView) => {
    resetFeedback();
    setView(nextView);
    onViewChange?.(nextView);
  };

  const handleSocialAuth = (provider: SocialProvider) => {
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const searchParams = new URLSearchParams({
      mode: view === 'register' ? 'register' : 'login',
      redirect_uri: callbackUrl,
    });

    window.location.assign(`${baseUrl}/api/auth/${provider}?${searchParams.toString()}`);
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

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanName = registerName.trim();
    const cleanEmail = registerEmail.trim();

    if (!cleanName || !cleanEmail || !registerPassword || !registerConfirmPassword) {
      setError('Completá todos los campos para registrarte');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setRegisterName(cleanName);
    setRegisterEmail(cleanEmail);
    setError('El registro todavía no está conectado al backend');
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
                if (onBackToLanding) {
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

                <Feedback message={error} />

                <AuthActionButton type="submit">Iniciar sesión</AuthActionButton>

                <SocialAuthButtons mode="login" onSelect={handleSocialAuth} />

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
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <AuthField
                  label="Nombre"
                  value={registerName}
                  onChange={e => setRegisterName(e.target.value)}
                  placeholder="Tu nombre"
                />
                <AuthField
                  label="Email"
                  type="email"
                  value={registerEmail}
                  onChange={e => setRegisterEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
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

                <Feedback message={error} />

                <AuthActionButton type="submit">Registrarse</AuthActionButton>

                <SocialAuthButtons mode="register" onSelect={handleSocialAuth} />

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

function SocialAuthButtons({
  mode,
  onSelect,
}: {
  mode: 'login' | 'register';
  onSelect: (provider: SocialProvider) => void;
}) {
  const label = mode === 'login' ? 'Iniciar sesión' : 'Registrarse';

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.12em] text-[#6F518E]/45">
        <span className="h-px flex-1 bg-[#C9A7EB]/45" />
        <span>o continuar con</span>
        <span className="h-px flex-1 bg-[#C9A7EB]/45" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SocialButton
          ariaLabel={`${label} con Google`}
          provider="google"
          onClick={() => onSelect('google')}
        />
        <SocialButton
          ariaLabel={`${label} con Facebook`}
          provider="facebook"
          onClick={() => onSelect('facebook')}
        />
        <SocialButton
          ariaLabel={`${label} con Apple`}
          provider="apple"
          onClick={() => onSelect('apple')}
        />
      </div>
    </div>
  );
}

function SocialButton({
  ariaLabel,
  provider,
  onClick,
}: {
  ariaLabel: string;
  provider: SocialProvider;
  onClick: () => void;
}) {
  const isFacebook = provider === 'facebook';
  const isApple = provider === 'apple';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex h-12 items-center justify-center rounded-[10px] border shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A7EB] ${
        isFacebook
          ? 'border-[#1877F2] bg-[#1877F2]'
          : isApple
            ? 'border-black bg-black'
            : 'border-[#6F518E]/18 bg-white'
      }`}
    >
      <SocialIcon provider={provider} />
    </button>
  );
}

function SocialIcon({ provider }: { provider: SocialProvider }) {
  if (provider === 'google') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
        <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.43Z" />
        <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.43l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
        <path fill="#FBBC05" d="M6.41 13.89A6 6 0 0 1 6.1 12c0-.65.11-1.29.31-1.89V7.52H3.07A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.48l3.34-2.59Z" />
        <path fill="#EA4335" d="M12 5.99c1.47 0 2.78.5 3.82 1.49l2.87-2.87C16.95 2.99 14.7 2 12 2a10 10 0 0 0-8.93 5.52l3.34 2.59C7.2 7.75 9.4 5.99 12 5.99Z" />
      </svg>
    );
  }

  if (provider === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
        <path fill="#fff" d="M14.15 8.06h1.5V5.43c-.26-.04-1.15-.12-2.18-.12-2.16 0-3.64 1.36-3.64 3.86v2.3H7.45v2.94h2.38V22h2.92v-7.59h2.28l.36-2.94h-2.64V9.46c0-.85.23-1.4 1.4-1.4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
      <path fill="#fff" d="M16.45 12.7c-.02-2.15 1.76-3.2 1.84-3.25-1.01-1.47-2.58-1.67-3.12-1.69-1.31-.14-2.58.78-3.25.78-.68 0-1.71-.76-2.82-.74-1.43.02-2.77.85-3.5 2.14-1.51 2.62-.38 6.47 1.06 8.59.72 1.03 1.56 2.18 2.66 2.14 1.08-.04 1.48-.69 2.78-.69 1.29 0 1.66.69 2.79.66 1.16-.02 1.89-1.03 2.58-2.07.83-1.18 1.16-2.35 1.17-2.41-.03-.01-2.17-.84-2.19-3.46ZM14.32 6.37c.58-.72.98-1.7.87-2.69-.84.04-1.89.58-2.49 1.28-.54.62-1.02 1.64-.9 2.6.95.07 1.91-.48 2.52-1.19Z" />
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
