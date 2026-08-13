import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, KeyRound, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { tandemApi, type TutorAccount } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/ui/use-toast';

const emptyAccount: TutorAccount = {
  id: 0, id_tutor: 0, nombre_usuario: '', nombre: '', apellido: '', correo: '',
  telefono: '', parentesco: '', email_verificado: false,
};

export default function TutorAccountSettings({ onManageConnections }: { onManageConnections: () => void }) {
  const { refreshUser, logout } = useAuth();
  const [account, setAccount] = useState<TutorAccount>(emptyAccount);
  const [originalEmail, setOriginalEmail] = useState('');
  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    let active = true;
    tandemApi.auth.getTutorAccount()
      .then(data => { if (active) { setAccount(data); setOriginalEmail(data.correo); } })
      .catch(error => toast({ title: 'No pudimos cargar tu perfil', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const emailChanged = account.correo.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await tandemApi.auth.updateTutorAccount({
        nombre: account.nombre, apellido: account.apellido, correo: account.correo,
        telefono: account.telefono, parentesco: account.parentesco,
        contrasena_actual: emailChanged ? currentPasswordForEmail : undefined,
      });
      setAccount(updated);
      setOriginalEmail(updated.correo);
      setCurrentPasswordForEmail('');
      await refreshUser();
      toast({
        title: emailChanged ? 'Revisá tu correo nuevo' : 'Perfil actualizado',
        description: emailChanged ? 'Te enviamos un enlace para verificar la nueva dirección.' : 'Tus datos se guardaron correctamente.',
      });
    } catch (error) {
      toast({ title: 'No se pudieron guardar los cambios', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    setChangingPassword(true);
    try {
      await tandemApi.auth.changePassword({ contrasena_actual: currentPassword, contrasena_nueva: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast({ title: 'Contraseña actualizada' });
    } catch (error) {
      toast({ title: 'No se pudo cambiar la contraseña', description: error instanceof Error ? error.message : 'Intentá nuevamente.', variant: 'destructive' });
    } finally { setChangingPassword(false); }
  };

  if (loading) return <div className="flex min-h-56 items-center justify-center" aria-label="Cargando perfil"><Loader2 className="animate-spin text-primary" /></div>;

  return <div className="space-y-5">
    <header><h1 className="font-heading text-3xl font-bold tracking-tight">Perfil y configuración</h1><p className="mt-2 text-sm text-muted-foreground sm:text-base">Administrá tus datos y la seguridad de tu cuenta.</p></header>

    <form onSubmit={saveProfile} className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-6 flex items-start gap-4"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><UserRound aria-hidden /></span><div><h2 className="text-lg font-bold">Datos personales</h2><p className="text-sm text-muted-foreground">Estos datos identifican tu cuenta de Tutor.</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre"><Input value={account.nombre} onChange={e => setAccount({ ...account, nombre: e.target.value })} required autoComplete="given-name" /></Field>
        <Field label="Apellido"><Input value={account.apellido} onChange={e => setAccount({ ...account, apellido: e.target.value })} required autoComplete="family-name" /></Field>
        <Field label="Correo"><Input type="email" value={account.correo} onChange={e => setAccount({ ...account, correo: e.target.value })} required autoComplete="email" /></Field>
        <Field label="Teléfono"><Input type="tel" value={String(account.telefono || '')} onChange={e => setAccount({ ...account, telefono: e.target.value })} autoComplete="tel" /></Field>
        <Field label="Parentesco o relación"><Input value={account.parentesco || ''} onChange={e => setAccount({ ...account, parentesco: e.target.value })} placeholder="Ej. madre, padre, tutor legal" /></Field>
        <div className="rounded-2xl bg-muted/50 p-4"><p className="text-sm font-semibold">Estado del correo</p><p className={`mt-1 flex items-center gap-2 text-sm ${account.email_verificado ? 'text-emerald-700' : 'text-amber-700'}`}>{account.email_verificado ? <CheckCircle2 size={17} /> : <Mail size={17} />}{account.email_verificado ? 'Correo verificado' : 'Verificación pendiente'}</p></div>
      </div>
      {emailChanged && <div className="mt-4 max-w-md"><Field label="Contraseña actual para cambiar el correo"><Input type="password" value={currentPasswordForEmail} onChange={e => setCurrentPasswordForEmail(e.target.value)} required autoComplete="current-password" /></Field><p className="mt-2 text-xs text-muted-foreground">La nueva dirección deberá verificarse antes de continuar usando la aplicación.</p></div>}
      <div className="mt-6 flex flex-wrap gap-3"><Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Guardar cambios</Button><Button type="button" variant="outline" onClick={onManageConnections}>Gestionar vínculos y permisos</Button></div>
    </form>

    <form onSubmit={savePassword} className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-5 flex items-start gap-4"><span className="rounded-2xl bg-primary/10 p-3 text-primary"><KeyRound aria-hidden /></span><div><h2 className="text-lg font-bold">Cambiar contraseña</h2><p className="text-sm text-muted-foreground">Usá al menos 8 caracteres, una letra y un número.</p></div></div>
      <div className="grid gap-4 sm:grid-cols-3"><Field label="Contraseña actual"><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" /></Field><Field label="Nueva contraseña"><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" /></Field><Field label="Repetir contraseña"><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" /></Field></div>
      <Button type="submit" variant="outline" className="mt-5" disabled={changingPassword}>{changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Actualizar contraseña</Button>
    </form>

    <section className="rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-primary" aria-hidden /><div className="flex-1"><h2 className="font-bold">Sesión</h2><p className="text-sm text-muted-foreground">Cerrá tu sesión en este dispositivo.</p></div><Button variant="outline" onClick={logout}>Cerrar sesión</Button></div></section>
  </div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
