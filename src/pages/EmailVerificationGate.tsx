import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { resendVerificationEmail } from '@/data/api';
import { ApiError } from '@/services/api/client';
import { AuthPage } from '@/components/auth/AuthScreen';
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout';
import { AuthActionButton, AuthLinkButton } from '@/components/auth/AuthFormControls';
import { panelForAccountRole } from '@/components/auth/authProfiles';

export default function EmailVerificationGate({ email }: { email?: string }) {
  const { user, refreshUser, logout } = useAuth();
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
    <AuthPage>
      <AuthSplitLayout
        title="Confirmá tu email"
        subtitle={email ? `Te mandamos un link a ${email}. Abrilo para poder usar Tándem.` : 'Te mandamos un link a tu casilla. Abrilo para poder usar Tándem.'}
        // La cuenta ya existe: se muestra el personaje del perfil con el que se registró.
        panel={panelForAccountRole(user?.role, 'Un último paso\npara empezar')}
      >
        <div className="space-y-4">
          {feedback && (
            <p role="status" className="rounded-2xl bg-[#C9A7EB]/18 px-4 py-3 text-center text-sm font-semibold text-[#6F518E]">{feedback}</p>
          )}

          <AuthActionButton onClick={handleCheckAgain} disabled={checking}>
            <RefreshCw size={18} className={`mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Revisando...' : 'Ya lo confirmé'}
          </AuthActionButton>
          <AuthActionButton variant="secondary" onClick={handleResend} disabled={sending}>
            {sending ? 'Enviando...' : 'Reenviar mail'}
          </AuthActionButton>
          <AuthLinkButton onClick={logout} className="mx-auto block">
            Cerrar sesión
          </AuthLinkButton>
        </div>
      </AuthSplitLayout>
    </AuthPage>
  );
}
