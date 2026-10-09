import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { tandemApi } from '@/services/api';
import { AuthPage } from '@/components/auth/AuthScreen';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthActionButton, AuthField, Feedback, PasswordField } from '@/components/auth/AuthFormControls';
import { BASE_PANEL } from '@/components/auth/authProfiles';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function PasswordRecoveryPage({ isReset, token, onGoToLogin }: { isReset: boolean; token?: string | null; onGoToLogin: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (isReset && !token) { setError('El enlace de recuperación no es válido.'); return; }
    if (isReset && (!PASSWORD_REGEX.test(password) || password !== confirmation)) { setError(password !== confirmation ? 'Las contraseñas no coinciden.' : 'Usá al menos 8 caracteres, una letra y un número.'); return; }
    setLoading(true);
    try {
      if (isReset && token) { await tandemApi.auth.resetPassword({ token, contrasena_nueva: password }); setMessage('Tu contraseña fue actualizada. Ya podés iniciar sesión.'); }
      else { await tandemApi.auth.forgotPassword(email.trim()); setMessage('Si el correo está registrado, vas a recibir un enlace para crear una nueva contraseña.'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'No pudimos completar la solicitud. Intentá nuevamente.'); }
    finally { setLoading(false); }
  };
  return (
    <AuthPage>
      <AuthSplitLayout
        title={isReset ? 'Crear nueva contraseña' : 'Recuperar contraseña'}
        subtitle={isReset ? 'El enlace solo puede usarse una vez.' : 'Te enviaremos un enlace seguro a tu correo.'}
        panel={{ ...BASE_PANEL, message: 'Volvé a tu espacio\ncuando quieras' }}
        onBack={onGoToLogin}
      >
        <form onSubmit={submit} className="space-y-5">
          {isReset ? (
            <>
              <PasswordField label="Nueva contraseña" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" showPassword={showPassword} onTogglePassword={() => setShowPassword(prev => !prev)} />
              <PasswordField label="Repetir contraseña" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" showPassword={showPassword} onTogglePassword={() => setShowPassword(prev => !prev)} />
            </>
          ) : (
            <AuthField label="Correo" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required />
          )}
          <Feedback message={error} />
          {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-800">{message}</p>}
          <AuthActionButton type="submit" disabled={loading || Boolean(isReset && message)}>
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}{isReset ? 'Actualizar contraseña' : 'Enviar enlace'}
          </AuthActionButton>
          {message && <AuthActionButton type="button" variant="secondary" onClick={onGoToLogin}>Ir a iniciar sesión</AuthActionButton>}
        </form>
      </AuthSplitLayout>
    </AuthPage>
  );
}
