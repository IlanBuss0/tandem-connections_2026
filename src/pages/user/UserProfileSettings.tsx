import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Bell, Eye, Loader2, Save, Shield, UserRound } from 'lucide-react';
import { ACCESSIBILITY_PROFILES, DEFAULT_SETTINGS, useAccessibility, type AccessibilitySettings } from '@/contexts/AccessibilityContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchUserProfileSettings,
  saveOwnUserSettings,
  saveUserProfileSettings,
  type UserProfileSettings,
  type UserProfileSettingsPayload,
} from '@/data/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f5f0ff] text-[#6b4c9a]">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#6b4c9a]">{title}</h3>
        <p className="text-sm text-[#8b7aa0]">{description}</p>
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
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#4a4a5a]">{label}</p>
        <p className="text-xs text-[#8b7aa0]">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ReadOnlyInfo({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-sm ${className}`}>
      <p className="text-xs font-medium text-[#8b7aa0]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#4a4a5a]">{value}</p>
    </div>
  );
}

function AccessibilityProfileSummary({ settings }: { settings: AccessibilitySettings }) {
  const activeProfile = ACCESSIBILITY_PROFILES.find(profile => profile.id === settings.activeProfile);
  const changes = describeAccessibilityChanges(settings);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-[#8b7aa0]">Perfil por default</p>
        <div className="mt-2 flex items-start gap-3">
          <span className="text-2xl">{activeProfile?.icon || 'A'}</span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#4a4a5a]">{activeProfile?.name || 'Sin perfil activo'}</p>
            <p className="text-xs text-[#8b7aa0]">
              {activeProfile?.description || 'No hay un preset aplicado. Se usan los ajustes base de la app.'}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0e8f8] bg-white p-3 shadow-sm">
        <p className="text-xs font-medium text-[#8b7aa0]">Cambios aplicados</p>
        {changes.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {changes.map(change => (
              <span key={change} className="rounded-full bg-[#f5f0ff] px-2 py-1 text-xs font-medium text-[#6b4c9a]">
                {change}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm text-[#8b7aa0]">Configuracion estandar.</p>
        )}
      </div>
    </div>
  );
}

function describeAccessibilityChanges(settings: AccessibilitySettings): string[] {
  const changes: string[] = [];
  if (settings.fontScale !== DEFAULT_SETTINGS.fontScale) changes.push(`Texto ${Math.round(settings.fontScale * 100)}%`);
  if (settings.lineHeight !== DEFAULT_SETTINGS.lineHeight) changes.push(`Interlineado ${settings.lineHeight.toFixed(1)}`);
  if (settings.letterSpacing !== DEFAULT_SETTINGS.letterSpacing) changes.push('Mayor espaciado de letras');
  if (settings.wordSpacing !== DEFAULT_SETTINGS.wordSpacing) changes.push('Mayor espaciado de palabras');
  if (settings.contentSpacing !== DEFAULT_SETTINGS.contentSpacing) changes.push('Mayor espaciado de contenido');
  if (settings.dyslexiaFont) changes.push('Fuente para dislexia');
  if (settings.textAlignLeft) changes.push('Texto alineado a la izquierda');
  if (settings.uppercase) changes.push('Texto en mayusculas');
  if (settings.contrast !== DEFAULT_SETTINGS.contrast) changes.push(`Contraste: ${settings.contrast}`);
  if (settings.colorFilter !== DEFAULT_SETTINGS.colorFilter) changes.push(`Filtro de color: ${settings.colorFilter}`);
  if (settings.saturation !== DEFAULT_SETTINGS.saturation) changes.push(`Saturacion ${Math.round(settings.saturation * 100)}%`);
  if (settings.reduceMotion) changes.push('Movimiento reducido');
  if (settings.pauseAnimations) changes.push('Animaciones pausadas');
  if (settings.highlightLinks) changes.push('Enlaces resaltados');
  if (settings.highlightHeadings) changes.push('Titulos resaltados');
  if (settings.highlightFocus) changes.push('Foco resaltado');
  if (settings.cursor !== DEFAULT_SETTINGS.cursor) changes.push(`Cursor: ${settings.cursor}`);
  if (settings.bigCursor) changes.push('Cursor grande');
  if (settings.hideImages) changes.push('Imagenes ocultas');
  if (settings.muteSounds) changes.push('Sonidos silenciados');
  if (settings.readingTooltip) changes.push('Tooltip de lectura');
  if (settings.speakOnHover) changes.push('Lectura por voz');
  return changes;
}

type UserProfileSettingsMode = 'settings' | 'personal';

export default function UserProfileSettings({ onBack, mode = 'settings' }: { onBack?: () => void; mode?: UserProfileSettingsMode }) {
  const { user, refreshUser } = useAuth();
  const { settings: accessibilitySettings } = useAccessibility();
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
      form.usuario.correo.trim()
    );
  }, [form, isPersonalMode]);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Archivo demasiado grande', description: 'El maximo es 5MB.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    setAvatarProgress(0);

    try {
      const { apiUploadFile } = await import('../../services/api/client');
      const formData = new FormData();
      formData.append('file', file);
      const data = await apiUploadFile<{ id: number; url: string }>('/api/archivos/upload', formData, setAvatarProgress);
      setAvatarPreview(data.url);

      const pertenecienteId = settings?.perteneciente?.id;
      if (pertenecienteId) {
        try {
          const { tandemApi } = await import('../../services/api');
          const avatares = await tandemApi.avatares.getAll();
          const avatar = (avatares as any[]).find(a => Number(a.id_perteneciente) === Number(pertenecienteId));
          if (avatar?.id) {
            await tandemApi.avatares.update(avatar.id, {
              avatar_imagen_url: data.url,
              avatar_imagen_origen_url: data.url,
              avatar_imagen_content_type: file.type,
              avatar_imagen_actualizada_en: new Date().toISOString(),
            });
            await refreshUser();
          }
        } catch (err) {
          console.warn('No se pudo persistir el avatar:', err);
        }
      }

      toast({ title: 'Foto subida', description: 'La foto de perfil se actualizo.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo subir la foto.', variant: 'destructive' });
      setAvatarPreview(null);
    } finally {
      setAvatarUploading(false);
      setAvatarProgress(0);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  }, [toast, settings]);

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
      await saveOwnUserSettings(user.id, {
        usuario: {
          ...form.usuario,
          nombre_usuario: form.usuario.nombre_usuario.trim(),
          nombre: form.usuario.nombre.trim(),
          apellido: form.usuario.apellido.trim(),
          correo: form.usuario.correo.trim(),
          fecha_nacimiento: form.usuario.fecha_nacimiento || null,
        },
        preferences: form.preferences,
      });
      await refreshUser();
      toast({ title: 'Configuracion guardada' });
      await load();
      onBack?.();
    } catch {
      setError('No se pudieron guardar los cambios.');
      toast({ title: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'user') return null;

  return (
    <form className="pb-24 lg:pb-6 space-y-6" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#6b4c9a] leading-tight">{isPersonalMode ? 'Datos personales' : 'Configuracion de perfil'}</h2>
          <p className="text-sm sm:text-base text-[#8b7aa0] mt-1 font-medium">
            {isPersonalMode ? 'Informacion visible para tu cuenta y tu red de apoyo.' : 'Autonomia, privacidad y accesibilidad.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onBack && (
            <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-2xl border border-[#ede4f8] bg-[#faf8ff] px-4 py-2.5 text-sm font-semibold text-[#6b4c9a] hover:bg-[#f5f0ff]">
              <ArrowLeft size={15} />
              Perfil
            </button>
          )}
          <button type="submit" disabled={loading || saving || !canSave} className="inline-flex items-center gap-2 rounded-2xl bg-[#6b4c9a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:bg-[#5a3c8a] active:scale-95 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {(!settings && !error) || loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-[#f0e8f8] bg-white p-4 text-sm text-[#8b7aa0] shadow-lg">
          <Loader2 size={16} className="animate-spin" />
          Cargando configuracion...
        </div>
      ) : (
        <>
          {isPersonalMode && (
            <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
              <SectionHeader
                icon={UserRound}
                title="Datos personales"
                description="Informacion visible para tu cuenta y tu red de apoyo."
              />
              <div className="mb-4 flex items-center gap-4 rounded-lg border border-border bg-background p-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center text-3xl shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    user.avatar || '👤'
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={18} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Foto de perfil</p>
                  <p className="text-xs text-muted-foreground">PNG o JPG, maximo 5MB</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {avatarUploading && (
                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${avatarProgress}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleAvatarSelect} />
                <Button type="button" size="sm" variant="outline" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                  {avatarUploading ? 'Subiendo...' : 'Subir foto'}
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="profile-name" className="text-sm font-medium text-[#4a4a5a]">Nombre</label>
                  <input id="profile-name" value={form.usuario.nombre} onChange={e => updateUsuario('nombre', e.target.value)} className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-lastname" className="text-sm font-medium text-[#4a4a5a]">Apellido</label>
                  <input id="profile-lastname" value={form.usuario.apellido} onChange={e => updateUsuario('apellido', e.target.value)} className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-username" className="text-sm font-medium text-[#4a4a5a]">Usuario</label>
                  <input id="profile-username" value={form.usuario.nombre_usuario} onChange={e => updateUsuario('nombre_usuario', e.target.value)} className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-email" className="text-sm font-medium text-[#4a4a5a]">Correo</label>
                  <input id="profile-email" type="email" value={form.usuario.correo} onChange={e => updateUsuario('correo', e.target.value)} className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-phone" className="text-sm font-medium text-[#4a4a5a]">Telefono</label>
                  <input id="profile-phone" inputMode="numeric" value={form.telefonoText} onChange={e => handlePhoneChange(e.target.value)} className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20 placeholder:text-[#b8b0c8]" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="profile-birthdate" className="text-sm font-medium text-[#4a4a5a]">Fecha de nacimiento</label>
                  <input
                    id="profile-birthdate"
                    type="date"
                    value={form.usuario.fecha_nacimiento || ''}
                    onChange={e => updateUsuario('fecha_nacimiento', e.target.value || null)}
                    className="w-full rounded-2xl border border-[#ede4f8] bg-[#faf8ff] p-2.5 text-sm text-[#4a4a5a] outline-none focus:border-[#6b4c9a]/30 focus:ring-2 focus:ring-[#6b4c9a]/20"
                  />
                </div>
              </div>
            </section>
          )}

          {!isPersonalMode && (
          <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
            <SectionHeader
              icon={Shield}
              title="Perfil perteneciente"
              description="Informacion definida por tu tutor o profesional a cargo."
            />
            <div className="grid gap-3 md:grid-cols-2">
              <ReadOnlyInfo
                label="Nivel de apoyo"
                value={(settings?.supportLevels ?? []).find(level => level.id === form.perteneciente.id_nivel_apoyo)?.nombre || 'Sin registrar'}
              />
              <ReadOnlyInfo
                label="Autonomia operativa"
                value={(settings?.autonomies ?? []).find(autonomy => autonomy.id === form.perteneciente.id_autonomia_operativa)?.nombre || 'Sin registrar'}
              />
              <ReadOnlyInfo
                label="Autogestion"
                value={form.perteneciente.puede_autogestionarse ? 'Habilitada' : 'Asistida'}
              />
              <ReadOnlyInfo
                label="Observacion general"
                value={form.perteneciente.observacion_general || 'Sin observaciones'}
                className="md:col-span-2"
              />
            </div>
            <p className="mt-3 rounded-2xl border border-[#6b4c9a]/20 bg-[#f5f0ff] p-3 text-xs text-[#8b7aa0]">
              Estos datos no se editan desde tu cuenta porque requieren criterio de tu red de apoyo.
            </p>
          </section>
          )}

          {!isPersonalMode && (
          <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
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
          <section className="rounded-3xl border border-[#f0e8f8] bg-white p-4 sm:p-5 shadow-lg">
            <SectionHeader
              icon={Eye}
              title="Accesibilidad"
              description="Perfil cargado automaticamente desde la burbuja de accesibilidad."
            />
            <AccessibilityProfileSummary settings={accessibilitySettings} />
            <div className="mt-3 rounded-2xl border border-[#f0e8f8] bg-[#faf8ff] p-3 text-xs text-[#8b7aa0]">
              Para cambiar estos ajustes usa la burbuja flotante de accesibilidad. La configuracion se guarda y se carga automaticamente despues del login.
            </div>
          </section>
          )}
        </>
      )}
    </form>
  );
}
