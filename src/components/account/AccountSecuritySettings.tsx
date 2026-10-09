import { useState, type FormEvent, type ReactNode } from 'react';
import { ChevronRight, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';
import { tandemApi } from '@/services/api';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function AccountSecuritySettings({ className = '', compact = false }: { className?: string; compact?: boolean }) {
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

  return <section className={`${compact ? '' : 'rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-[0_12px_36px_rgba(70,45,96,.075)] sm:p-6'} ${className}`}>
    {!compact && <div className="mb-5 flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck aria-hidden /></span><div><p className="text-xs font-bold uppercase tracking-[.14em] text-primary">Cuenta protegida</p><h2 className="mt-0.5 text-xl font-bold">Correo y contraseña</h2><p className="mt-1 text-sm text-muted-foreground">Los cambios sensibles se realizan en ventanas separadas y requieren verificación.</p></div></div>}
    <div className="grid grid-cols-2 gap-3">
      <button type="button" onClick={() => setPasswordOpen(true)} className="group relative flex min-h-36 flex-col items-start gap-3 rounded-[22px] border border-border/70 bg-muted/20 p-4 pr-8 text-left transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><KeyRound size={20} /></span><span className="min-w-0 flex-1"><strong className="block">Cambiar contraseña</strong><small className="text-muted-foreground">Actual y nueva dos veces.</small></span><ChevronRight size={18} className="absolute bottom-4 right-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:static" /></button>
      <button type="button" onClick={() => { setNewEmail(user.email); setEmailOpen(true); }} className="group relative flex min-h-36 flex-col items-start gap-3 rounded-[22px] border border-border/70 bg-muted/20 p-4 pr-8 text-left transition hover:-translate-y-0.5 hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-24 sm:flex-row sm:items-center"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm"><Mail size={20} /></span><span className="min-w-0 flex-1"><strong className="block">Cambiar correo</strong><small className="block max-w-full truncate text-muted-foreground">{user.email}</small></span><ChevronRight size={18} className="absolute bottom-4 right-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:static" /></button>
    </div>

    <Dialog open={passwordOpen} onOpenChange={open => { setPasswordOpen(open); if (!open) resetPasswordFields(); }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Cambiar contraseña</DialogTitle><DialogDescription>Ingresá la contraseña anterior y escribí dos veces la nueva.</DialogDescription></DialogHeader><form onSubmit={changePassword} className="space-y-4"><Field label="Contraseña actual"><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required /></Field><Field label="Nueva contraseña"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required /></Field><Field label="Repetir nueva contraseña"><Input type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="new-password" required /></Field><button type="button" onClick={forgotPassword} disabled={loading} className="text-sm font-semibold text-primary hover:underline">Olvidé mi contraseña</button><DialogFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar contraseña</Button></DialogFooter></form></DialogContent></Dialog>

    <Dialog open={emailOpen} onOpenChange={open => { setEmailOpen(open); if (!open) resetEmailFields(); }}><DialogContent className="max-w-md rounded-3xl"><DialogHeader><DialogTitle>Cambiar correo</DialogTitle><DialogDescription>Después del cambio tendrás que abrir el enlace que Tándem enviará a la dirección nueva.</DialogDescription></DialogHeader><form onSubmit={changeEmail} className="space-y-4"><Field label="Correo nuevo"><Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} autoComplete="email" required /></Field><Field label="Contraseña actual"><Input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} autoComplete="current-password" required /></Field><DialogFooter><Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Cambiar y enviar validación</Button></DialogFooter></form></DialogContent></Dialog>
  </section>;
}

function Field({ label, children }: { label: string; children: ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
