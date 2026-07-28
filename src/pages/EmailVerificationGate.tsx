import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { resendVerificationEmail } from '@/data/api';
import { ApiError } from '@/services/api/client';

export default function EmailVerificationGate({ email }: { email?: string }) {
  const { refreshUser, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleResend = async () => {
    setSending(true);
    setFeedback('');
    try {
      await resendVerificationEmail();
      setFeedback('Te mandamos el link de nuevo. Revisá tu casilla (y spam).');
    } catch (err) {
      setFeedback(err instanceof ApiError ? err.message : 'No se pudo reenviar el mail.');
    } finally {
      setSending(false);
    }
  };

  const handleCheckAgain = async () => {
    setChecking(true);
    setFeedback('');
    const updated = await refreshUser();
    if (updated && updated.emailVerified === false) {
      setFeedback('Todavía no lo verificaste. Abrí el link que te mandamos por mail.');
    }
    setChecking(false);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFB] text-[#6F518E] flex items-center justify-center px-8">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 text-center shadow-sm">
        <Mail className="mx-auto mb-4 text-[#6F518E]" size={40} />
        <h1 className="mb-1 text-lg font-extrabold">Confirmá tu email</h1>
        <p className="mb-6 text-sm text-[#6F518E]/70">
          Te mandamos un link a{email ? <> <strong>{email}</strong></> : ' tu casilla'}. Abrilo para poder usar Tándem.
        </p>

        {feedback && (
          <p className="mb-4 rounded-xl bg-[#C9A7EB]/18 px-3 py-2 text-sm font-medium">{feedback}</p>
        )}

        <div className="space-y-3">
          <Button onClick={handleCheckAgain} disabled={checking} className="w-full rounded-full">
            <RefreshCw size={16} className={`mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Revisando...' : 'Ya lo confirmé'}
          </Button>
          <Button onClick={handleResend} disabled={sending} variant="outline" className="w-full rounded-full">
            {sending ? 'Enviando...' : 'Reenviar mail'}
          </Button>
          <button
            type="button"
            onClick={logout}
            className="mx-auto block text-sm font-semibold text-[#6F518E]/70 underline-offset-4 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </main>
  );
}
