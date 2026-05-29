import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, Eye, Loader2, Save, Shield, UserRound } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserProfileSettings,
  saveUserProfileSettings,
  type UserProfileSettings,
  type UserProfileSettingsPayload,
} from '@/data/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/ui/use-toast';

type FormState = UserProfileSettingsPayload & {
  telefonoText: string;
};

const emptyForm: FormState = {
  usuario: {
    nombre_usuario: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: null,
    fecha_nacimiento: null,
  },
  perteneciente: {
    id_nivel_apoyo: 0,
    id_autonomia_operativa: 0,
    puede_autogestionarse: false,
    observacion_general: '',
  },
  preferences: {
    recibir_notificaciones: true,
    recordatorios_actividad: true,
    resumen_semanal: false,
    compartir_ubicacion: false,
    permitir_mensajes: true,
    mostrar_progreso_red_apoyo: true,
  },
  accessibility: {
    tamanio_texto: 'normal',
    contraste_alto: false,
    reducir_movimiento: false,
    pictogramas_grandes: false,
  },
  telefonoText: '',
};

function dateInputValue(value?: string | null) {
  if (!value) return '';
  return value.split('T')[0];
}

function SectionHeader({ icon: Icon, title, description }: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

type UserProfileSettingsMode = 'settings' | 'personal';

export default function UserProfileSettings({ onBack, mode = 'settings' }: { onBack?: () => void; mode?: UserProfileSettingsMode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserProfileSettings | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPersonalMode = mode === 'personal';

  const canSave = useMemo(() => {
    if (isPersonalMode) {
      return Boolean(
        form.usuario.nombre_usuario.trim() &&
        form.usuario.nombre.trim() &&
        form.usuario.apellido.trim() &&
        form.usuario.correo.trim()
      );
    }

    return Boolean(
      form.usuario.nombre_usuario.trim() &&
      form.usuario.nombre.trim() &&
      form.usuario.apellido.trim() &&
      form.usuario.correo.trim() &&
      form.perteneciente.id_nivel_apoyo &&
      form.perteneciente.id_autonomia_operativa
    );
  }, [form, isPersonalMode]);

  const load = async () => {
    if (!user || user.role !== 'user') return;
    setLoading(true);
    setError(null);

    try {
      const next = await fetchUserProfileSettings(user.id);
      setSettings(next);
      setForm({
        usuario: {
          nombre_usuario: next.usuario?.nombre_usuario || user.username,
          nombre: next.usuario?.nombre || user.name.split(' ')[0] || '',
          apellido: next.usuario?.apellido || user.name.split(' ').slice(1).join(' '),
          correo: next.usuario?.correo || user.email,
          telefono: next.usuario?.telefono ?? null,
          fecha_nacimiento: dateInputValue(next.usuario?.fecha_nacimiento) || null,
        },
        perteneciente: {
          id_nivel_apoyo: next.perteneciente?.id_nivel_apoyo || next.supportLevels[0]?.id || 0,
          id_autonomia_operativa: next.perteneciente?.id_autonomia_operativa || next.autonomies[0]?.id || 0,
          puede_autogestionarse: Boolean(next.perteneciente?.puede_autogestionarse),
          observacion_general: next.perteneciente?.observacion_general || '',
        },
        preferences: next.preferences,
        accessibility: next.accessibility,
        telefonoText: next.usuario?.telefono ? String(next.usuario.telefono) : '',
      });
    } catch {
      setError('No se pudo cargar la configuracion del perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const updateUsuario = <K extends keyof FormState['usuario']>(key: K, value: FormState['usuario'][K]) => {
    setForm(prev => ({ ...prev, usuario: { ...prev.usuario, [key]: value } }));
  };

  const updatePerteneciente = <K extends keyof FormState['perteneciente']>(
    key: K,
    value: FormState['perteneciente'][K],
  ) => {
    setForm(prev => ({ ...prev, perteneciente: { ...prev.perteneciente, [key]: value } }));
  };

  const updatePreference = <K extends keyof FormState['preferences']>(key: K, value: boolean) => {
    setForm(prev => ({ ...prev, preferences: { ...prev.preferences, [key]: value } }));
  };

  const updateAccessibility = <K extends keyof FormState['accessibility']>(
    key: K,
    value: FormState['accessibility'][K],
  ) => {
    setForm(prev => ({ ...prev, accessibility: { ...prev.accessibility, [key]: value } }));
  };

  const handlePhoneChange = (value: string) => {
    const sanitized = value.replace(/[^\d]/g, '');
    setForm(prev => ({
      ...prev,
      telefonoText: sanitized,
      usuario: {
        ...prev.usuario,
        telefono: sanitized ? Number(sanitized) : null,
      },
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || user.role !== 'user' || !canSave) return;

    setSaving(true);
    setError(null);

    try {
      await saveUserProfileSettings(user.id, {
        usuario: {
          ...form.usuario,
          nombre_usuario: form.usuario.nombre_usuario.trim(),
          nombre: form.usuario.nombre.trim(),
          apellido: form.usuario.apellido.trim(),
          correo: form.usuario.correo.trim(),
          fecha_nacimiento: form.usuario.fecha_nacimiento || null,
        },
        perteneciente: {
          ...form.perteneciente,
          observacion_general: form.perteneciente.observacion_general?.trim() || null,
        },
        preferences: form.preferences,
        accessibility: form.accessibility,
      });
      toast({ title: 'Configuracion guardada' });
      await load();
    } catch {
      setError('No se pudieron guardar los cambios.');
      toast({ title: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'user') return null;

  return (
    <form className="space-y-5 pb-20 lg:pb-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">{isPersonalMode ? 'Datos personales' : 'Configuracion de perfil'}</h2>
          <p className="text-sm text-muted-foreground">
            {isPersonalMode ? 'Informacion visible para tu cuenta y tu red de apoyo.' : 'Autonomia, privacidad y accesibilidad.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack && (
            <Button type="button" variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft size={15} />
              Perfil
            </Button>
          )}
          <Button type="submit" size="sm" disabled={loading || saving || !canSave} className="gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && !settings ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Cargando configuracion...
        </div>
      ) : (
        <>
          {isPersonalMode && (
            <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
              <SectionHeader
                icon={UserRound}
                title="Datos personales"
                description="Informacion visible para tu cuenta y tu red de apoyo."
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name">Nombre</Label>
                  <Input id="profile-name" value={form.usuario.nombre} onChange={e => updateUsuario('nombre', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-lastname">Apellido</Label>
                  <Input id="profile-lastname" value={form.usuario.apellido} onChange={e => updateUsuario('apellido', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-username">Usuario</Label>
                  <Input id="profile-username" value={form.usuario.nombre_usuario} onChange={e => updateUsuario('nombre_usuario', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email">Correo</Label>
                  <Input id="profile-email" type="email" value={form.usuario.correo} onChange={e => updateUsuario('correo', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Telefono</Label>
                  <Input id="profile-phone" inputMode="numeric" value={form.telefonoText} onChange={e => handlePhoneChange(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-birthdate">Fecha de nacimiento</Label>
                  <Input
                    id="profile-birthdate"
                    type="date"
                    value={form.usuario.fecha_nacimiento || ''}
                    onChange={e => updateUsuario('fecha_nacimiento', e.target.value || null)}
                  />
                </div>
              </div>
            </section>
          )}

          {!isPersonalMode && (
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader
              icon={Shield}
              title="Perfil perteneciente"
              description="Configuracion de apoyo, autonomia y observaciones del perfil."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nivel de apoyo</Label>
                <Select
                  value={String(form.perteneciente.id_nivel_apoyo || '')}
                  onValueChange={value => updatePerteneciente('id_nivel_apoyo', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.supportLevels || []).map(level => (
                      <SelectItem key={level.id} value={String(level.id)}>{level.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Autonomia operativa</Label>
                <Select
                  value={String(form.perteneciente.id_autonomia_operativa || '')}
                  onValueChange={value => updatePerteneciente('id_autonomia_operativa', Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar autonomia" />
                  </SelectTrigger>
                  <SelectContent>
                    {(settings?.autonomies || []).map(autonomy => (
                      <SelectItem key={autonomy.id} value={String(autonomy.id)}>{autonomy.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <ToggleRow
                  label="Autogestion habilitada"
                  description="Permite completar acciones personales sin aprobacion previa."
                  checked={form.perteneciente.puede_autogestionarse}
                  onChange={value => updatePerteneciente('puede_autogestionarse', value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-observation">Observacion general</Label>
                <Textarea
                  id="profile-observation"
                  value={form.perteneciente.observacion_general || ''}
                  onChange={e => updatePerteneciente('observacion_general', e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </section>
          )}

          {!isPersonalMode && (
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader
              icon={Bell}
              title="Preferencias y privacidad"
              description="Controles guardados en configuracion del usuario."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <ToggleRow label="Notificaciones" description="Recibir avisos importantes." checked={form.preferences.recibir_notificaciones} onChange={value => updatePreference('recibir_notificaciones', value)} />
              <ToggleRow label="Recordatorios" description="Avisos de actividades pendientes." checked={form.preferences.recordatorios_actividad} onChange={value => updatePreference('recordatorios_actividad', value)} />
              <ToggleRow label="Resumen semanal" description="Guardar preferencia de reporte semanal." checked={form.preferences.resumen_semanal} onChange={value => updatePreference('resumen_semanal', value)} />
              <ToggleRow label="Compartir ubicacion" description="Permitir uso de ubicacion con apoyo autorizado." checked={form.preferences.compartir_ubicacion} onChange={value => updatePreference('compartir_ubicacion', value)} />
              <ToggleRow label="Mensajes" description="Permitir mensajes dentro de TANDEM." checked={form.preferences.permitir_mensajes} onChange={value => updatePreference('permitir_mensajes', value)} />
              <ToggleRow label="Progreso visible" description="Mostrar progreso a la red de apoyo." checked={form.preferences.mostrar_progreso_red_apoyo} onChange={value => updatePreference('mostrar_progreso_red_apoyo', value)} />
            </div>
          </section>
          )}

          {!isPersonalMode && (
          <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <SectionHeader
              icon={Eye}
              title="Accesibilidad"
              description="Preferencias visuales personales."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-border bg-background p-3">
                <Label>Tamanio de texto</Label>
                <Select
                  value={form.accessibility.tamanio_texto}
                  onValueChange={value => updateAccessibility('tamanio_texto', value as FormState['accessibility']['tamanio_texto'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="grande">Grande</SelectItem>
                    <SelectItem value="muy_grande">Muy grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ToggleRow label="Alto contraste" description="Preferencia visual para contraste alto." checked={form.accessibility.contraste_alto} onChange={value => updateAccessibility('contraste_alto', value)} />
              <ToggleRow label="Reducir movimiento" description="Evitar animaciones intensas." checked={form.accessibility.reducir_movimiento} onChange={value => updateAccessibility('reducir_movimiento', value)} />
              <ToggleRow label="Pictogramas grandes" description="Mostrar pictogramas con mayor tamano." checked={form.accessibility.pictogramas_grandes} onChange={value => updateAccessibility('pictogramas_grandes', value)} />
            </div>
          </section>
          )}
        </>
      )}
    </form>
  );
}
