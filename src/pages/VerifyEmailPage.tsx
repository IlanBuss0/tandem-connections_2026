import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { verifyEmailToken } from '@/data/api';
import { ApiError } from '@/services/api/client';
import { AuthPage } from '@/components/auth/AuthScreen';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthActionButton } from '@/components/auth/AuthFormControls';
import { BASE_PANEL } from '@/components/auth/authProfiles';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailPage({
  token,
  onGoToLogin,
}: {
  token: string | null;
  onGoToLogin: () => void;
}) {
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setMessage('Este link no tiene un token válido.');
      return;
    }

    verifyEmailToken(token)
      .then(() => setStatus('success'))
      .catch(err => {
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'No se pudo verificar el email.');
      });
  }, [token]);

  const title = status === 'verifying' ? 'Verificando tu email' : status === 'success' ? '¡Email verificado!' : 'No pudimos verificar tu email';
  const subtitle = status === 'verifying' ? undefined : status === 'success' ? 'Ya podés usar Tándem con tu cuenta confirmada.' : message;

  return (
    <AuthPage>
      <AuthSplitLayout title={title} subtitle={subtitle} panel={{ ...BASE_PANEL, message: 'Un paso más\ny empezamos' }}>
        <div role="status" className="space-y-6">
          {status === 'verifying' && (
            <p className="flex items-center justify-center gap-3 rounded-2xl bg-[#C9A7EB]/18 px-4 py-6 text-sm font-semibold lg:justify-start">
              <Loader2 className="animate-spin" size={22} />
              Verificando tu email...
            </p>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto text-success lg:mx-0" size={44} />
              <AuthActionButton onClick={onGoToLogin}>Iniciar sesión</AuthActionButton>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="mx-auto text-destructive lg:mx-0" size={44} />
              <AuthActionButton variant="secondary" onClick={onGoToLogin}>Volver al inicio</AuthActionButton>
            </>
          )}
        </div>
      </AuthSplitLayout>
    </AuthPage>
  );
}
