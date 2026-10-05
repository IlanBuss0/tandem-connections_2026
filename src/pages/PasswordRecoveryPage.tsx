import { useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tandemApi } from '@/services/api';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function PasswordRecoveryPage({ isReset, token, onGoToLogin }: { isReset: boolean; token?: string | null; onGoToLogin: () => void }) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirmation, setConfirmation] = useState('');
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
  return <main className="min-h-screen bg-[#F8FAFB] px-6 py-10 text-[#6F518E]"><section className="mx-auto w-full max-w-[430px]">
    <button type="button" onClick={onGoToLogin} className="mb-10 flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#C9A7EB]/20" aria-label="Volver al inicio de sesión"><ArrowLeft /></button>
    <img src="/tandem-logo.png" alt="Tandem" className="mx-auto mb-10 h-auto w-[224px]" />
    <div className="rounded-3xl border border-[#C9A7EB]/60 bg-white p-6 shadow-sm"><div className="mb-5 flex items-center gap-3">{isReset ? <KeyRound /> : <Mail />}<div><h1 className="text-xl font-extrabold">{isReset ? 'Crear nueva contraseña' : 'Recuperar contraseña'}</h1><p className="text-sm text-[#6F518E]/70">{isReset ? 'El enlace solo puede usarse una vez.' : 'Te enviaremos un enlace seguro a tu correo.'}</p></div></div>
      <form onSubmit={submit} className="space-y-4">{isReset ? <><Field label="Nueva contraseña"><Input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" required /></Field><Field label="Repetir contraseña"><Input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required /></Field></> : <Field label="Correo"><Input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required /></Field>}
        {error && <p role="alert" className="text-sm font-semibold text-red-600">{error}</p>}{message && <p role="status" className="text-sm font-semibold text-emerald-700">{message}</p>}
        <Button type="submit" className="w-full rounded-full" disabled={loading || Boolean(isReset && message)}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isReset ? 'Actualizar contraseña' : 'Enviar enlace'}</Button>{message && <Button type="button" variant="outline" className="w-full rounded-full" onClick={onGoToLogin}>Ir a iniciar sesión</Button>}
      </form></div>
  </section></main>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
