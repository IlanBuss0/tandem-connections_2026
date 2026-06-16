import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { joinTutorInviteByToken } from '@/data/api';
import { Button } from '@/components/ui/button';

type InviteLinkHandlerProps = {
  token: string;
};

export default function InviteLinkHandler({ token }: InviteLinkHandlerProps) {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Aceptando invitacion...');
  const processedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const acceptInvite = async () => {
      if (!user) return;
      if (processedTokenRef.current === token) return;

      if (user.role !== 'user') {
        setStatus('error');
        setMessage('Esta invitacion solo puede aceptarse desde una cuenta de perteneciente.');
        return;
      }

      setStatus('loading');
      setMessage('Aceptando invitacion...');
      processedTokenRef.current = token;

      try {
        await joinTutorInviteByToken(token);
        await refreshUser().catch(() => null);
        if (cancelled) return;
        setStatus('success');
        setMessage('El tutor fue vinculado correctamente.');
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'No se pudo aceptar la invitacion.');
      }
    };

    acceptInvite();

    return () => {
      cancelled = true;
    };
  }, [refreshUser, token, user]);

  const goHome = () => {
    window.history.replaceState(null, '', '/');
    window.location.assign('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === 'loading' ? (
            <Loader2 size={24} className="animate-spin" />
          ) : status === 'success' ? (
            <CheckCircle2 size={24} />
          ) : (
            <AlertCircle size={24} />
          )}
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">Vinculacion de tutor</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {status !== 'loading' && (
          <Button onClick={goHome} className="mt-5 w-full">
            Ir a la app
          </Button>
        )}
      </section>
    </main>
  );
}
