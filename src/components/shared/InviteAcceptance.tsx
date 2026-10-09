import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

type InviteAcceptanceProps = {
  token: string;
  requiredRole: 'user' | 'professional';
  accept: (token: string) => Promise<unknown>;
  title: string;
  loadingMessage: string;
  wrongRoleMessage: string;
  successMessage: string;
  errorMessage: string;
  afterAccept?: () => void;
};

export default function InviteAcceptance({
  token, requiredRole, accept, title, loadingMessage, wrongRoleMessage,
  successMessage, errorMessage, afterAccept,
}: InviteAcceptanceProps) {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(loadingMessage);
  const processedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const acceptInvite = async () => {
      if (!user || processedTokenRef.current === token) return;
      if (user.role !== requiredRole) {
        setStatus('error');
        setMessage(wrongRoleMessage);
        return;
      }
      setStatus('loading');
      setMessage(loadingMessage);
      processedTokenRef.current = token;
      try {
        await accept(token);
        await refreshUser().catch(() => null);
        afterAccept?.();
        if (cancelled) return;
        setStatus('success');
        setMessage(successMessage);
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : errorMessage);
      }
    };
    void acceptInvite();
    return () => { cancelled = true; };
  }, [accept, afterAccept, errorMessage, loadingMessage, refreshUser, requiredRole, successMessage, token, user, wrongRoleMessage]);

  const goHome = () => {
    window.history.replaceState(null, '', '/');
    window.location.assign('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {status === 'loading' ? <Loader2 size={24} className="animate-spin" />
            : status === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {status !== 'loading' && <Button onClick={goHome} className="mt-5 w-full">Ir a la app</Button>}
      </section>
    </main>
  );
}
