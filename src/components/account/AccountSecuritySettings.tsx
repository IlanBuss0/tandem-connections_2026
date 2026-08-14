import { useState, type FormEvent, type ReactNode } from 'react';
import { KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import { tandemApi } from '@/services/api';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function AccountSecuritySettings({ className = '' }: { className?: string }) {
  const { user, refreshUser, logout } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const resetPasswordFields = () => { setCurrentPassword(''); setNewPassword(''); setConfirmation(''); };
  const resetEmailFields = () => { setNewEmail(''); setEmailPassword(''); };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!PASSWORD_REGEX.test(newPassword)) { toast({ title: 'Contraseña inválida', description: 'Usá al menos 8 caracteres, una letra y un número.', variant: 'destructive' }); return; }
    if (newPassword !== confirmation) { toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      await tandemApi.auth.changePassword({ contrasena_actual: currentPassword, contrasena_nueva: newPassword });
      resetPasswordFields(); setPasswordOpen(false);
      toast({ title: 'Contraseña actualizada', description: 'Por seguridad, volvé a iniciar sesión con tu contraseña nueva.' });
      logout();
    } catch (error) { toast({ title: 'No se pudo cambiar la contraseña', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const forgotPassword = async () => {
    setLoading(true);
    try {
      await tandemApi.auth.forgotPassword(user.email);
      toast({ title: 'Revisá tu correo', description: 'Te enviamos un enlace para crear una nueva contraseña.' });
    } catch (error) { toast({ title: 'No se pudo enviar el enlace', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      await tandemApi.auth.changeEmail({ contrasena_actual: emailPassword, correo_nuevo: newEmail.trim() });
      resetEmailFields(); setEmailOpen(false); await refreshUser();
      toast({ title: 'Revisá tu correo nuevo', description: 'Enviamos un enlace de Tándem. Abrilo para validar la dirección.' });
    } catch (error) { toast({ title: 'No se pudo cambiar el correo', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return <section className={`rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 ${className}`}>
    <div className="mb-5 flex items-start gap-4"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><ShieldCheck aria-hidden /></span><div><h2 className="text-lg font-bold">Seguridad de la cuenta</h2><p className="text-sm text-muted-foreground">Administrá tu contraseña y el correo con el que ingresás.</p></div></div>
    <div className="grid gap-3 sm:grid-cols-2">
      <button type="button" onClick={() => setPasswordOpen(true)} className="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:bg-muted/50"><KeyRound className="text-primary" /><span><strong className="block">Cambiar contraseña</strong><small className="text-muted-foreground">Requiere tu contraseña actual.</small></span></button>
      <button type="button" onClick={() => { setNewEmail(user.email); setEmailOpen(true); }} className="flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:bg-muted/50"><Mail className="text-primary" /><span className="min-w-0"><strong className="block">Cambiar correo</strong><small className="block truncate text-muted-foreground">{user.email}</small></span></button>
    </div>

    <Dialog open={passwordOpen} onOpenChange={open => { setPasswordOpen(open); if (!open) resetPasswordFields(); }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Cambiar contraseña</DialogTitle><DialogDescription>Ingresá la contraseña anterior y escribí dos veces la nueva.</DialogDescription></DialogHeader><form onSubmit={changePassword} className="space-y-4"><Field label="Contraseña actual"><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></Field><Field label="Nueva contraseña"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required /></Field><Field label="Repetir nueva contraseña"><Input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required /></Field><button type="button" onClick={forgotPassword} disabled={loading} className="text-sm font-semibold text-primary hover:underline">Olvidé mi contraseña</button><DialogFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar contraseña</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={emailOpen} onOpenChange={open => { setEmailOpen(open); if (!open) resetEmailFields(); }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Cambiar correo</DialogTitle><DialogDescription>Después del cambio tendrás que abrir el enlace que Tándem enviará a la dirección nueva.</DialogDescription></DialogHeader><form onSubmit={changeEmail} className="space-y-4"><Field label="Correo nuevo"><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} autoComplete="email" required /></Field><Field label="Contraseña actual"><Input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} autoComplete="current-password" required /></Field><DialogFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cambiar y enviar validación</Button></DialogFooter></form></DialogContent></Dialog>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
