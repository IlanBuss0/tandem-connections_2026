import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyEmailToken } from '@/data/api';
import { ApiError } from '@/services/api/client';

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

  return (
    <main className="min-h-screen bg-[#F8FAFB] text-[#6F518E] flex items-center justify-center px-8">
      <div className="w-full max-w-[380px] rounded-2xl bg-white p-8 text-center shadow-sm">
        {status === 'verifying' && (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-[#6F518E]" size={40} />
            <p className="text-sm font-semibold">Verificando tu email...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-success" size={40} />
            <h1 className="mb-1 text-lg font-extrabold">¡Email verificado!</h1>
            <p className="mb-6 text-sm text-[#6F518E]/70">Ya podés usar Tándem con tu cuenta confirmada.</p>
            <Button onClick={onGoToLogin} className="w-full rounded-full">
              Iniciar sesión
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-destructive" size={40} />
            <h1 className="mb-1 text-lg font-extrabold">No pudimos verificar tu email</h1>
            <p className="mb-6 text-sm text-[#6F518E]/70">{message}</p>
            <Button onClick={onGoToLogin} variant="outline" className="w-full rounded-full">
              Volver al inicio
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
