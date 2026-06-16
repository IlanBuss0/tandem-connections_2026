import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  BriefcaseMedical,
  CheckCircle2,
  Clipboard,
  Link,
  Loader2,
  Plus,
  QrCode,
  RefreshCcw,
  Shield,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { deleteProfessionalPertenecienteLink, deleteTutorPertenecienteLink, generateProfessionalInvite, generateTutorInvite, fetchPermissionContext, setPertenecientePermissionByName, setProfessionalPermissionByName, type EffectivePertenecientePermissions, type EffectiveProfessionalPermissions, type PermissionContext, type ProfessionalInvite, type TutorInvite, type TutorPermissionContextPerteneciente } from '@/data/api';
import { toast } from '@/hooks/ui/use-toast';

const PERTENECIENTE_PERMISSION_LABELS: Record<string, string> = {
  EditarPerfil: 'Editar perfil',
  EditarPerfilSensible: 'Editar datos sensibles',
  CompletarActividades: 'Completar actividades',
  EnviarMensajes: 'Enviar mensajes',
  ChatearConProfesional: 'Chat con profesionales',
  CrearActividadesPropias: 'Crear actividades propias',
  CompartirUbicacion: 'Compartir ubicacion',
  GastarPuntos: 'Gastar puntos',
  UsarMiDia: 'Usar Mi Día',
  UsarCalendario: 'Usar calendario',
  RegistrarEmociones: 'Registrar emociones',
  UsarPictogramas: 'Usar pictogramas',
};

const PROFESSIONAL_PERMISSION_LABELS: Record<string, string> = {
  AsignarActividades: 'Asignar actividades',
  CrearActividadesPersonalizadas: 'Crear actividades personalizadas',
  VerHistorial: 'Ver historial',
  VerUbicacion: 'Ver ubicacion',
  AgendarSesiones: 'Agendar sesiones',
  EnviarMensajes: 'Enviar mensajes',
  EditarPerfilProfesional: 'Editar perfil profesional',
};

function fullName(user?: { nombre?: string; apellido?: string; nombre_usuario?: string }) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.nombre_usuario || 'Usuario';
}

function permissionEntries(permisos?: Record<string, { habilitado: boolean; source: string }>) {
  return Object.entries(permisos || {}).sort(([a], [b]) => a.localeCompare(b));
}

function sourceLabel(source: string) {
  return source === 'otorgado' ? 'Definido' : 'Default';
}

export default function TutorConnections() {
  const [context, setContext] = useState<PermissionContext | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<TutorInvite | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [professionalInvite, setProfessionalInvite] = useState<ProfessionalInvite | null>(null);
  const [generatingProfessionalInvite, setGeneratingProfessionalInvite] = useState(false);
  const [professionalQrDataUrl, setProfessionalQrDataUrl] = useState('');
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const pertenecientes = context?.pertenecientes || [];
  const selected = useMemo<TutorPermissionContextPerteneciente | null>(() => {
    if (!pertenecientes.length) return null;
    return pertenecientes.find(item => item.id === selectedId) || pertenecientes[0];
  }, [pertenecientes, selectedId]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPermissionContext();
      setContext(next);
      setSelectedId(current => {
        if (current && next.pertenecientes?.some(item => item.id === current)) return current;
        return next.pertenecientes?.[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la gestion de vinculos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const inviteUrl = invite ? `${window.location.origin}/vincular/${invite.token}` : '';
  const professionalInviteUrl = professionalInvite ? `${window.location.origin}/vincular-profesional/${professionalInvite.token}` : '';

  useEffect(() => {
    let cancelled = false;

    if (!inviteUrl) {
      setQrDataUrl('');
      return;
    }

    QRCode.toDataURL(inviteUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    })
      .then(dataUrl => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [inviteUrl]);

  useEffect(() => {
    let cancelled = false;

    if (!professionalInviteUrl) {
      setProfessionalQrDataUrl('');
      return;
    }

    QRCode.toDataURL(professionalInviteUrl, {
      margin: 1,
      width: 220,
      color: {
        dark: '#1f2937',
        light: '#ffffff',
      },
    })
      .then(dataUrl => {
        if (!cancelled) setProfessionalQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setProfessionalQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [professionalInviteUrl]);

  const createInvite = async () => {
    setGeneratingInvite(true);
    try {
      const nextInvite = await generateTutorInvite({ horas_validez: 1 });
      setInvite(nextInvite);
      toast({ title: 'Invitacion creada', description: 'El codigo y el QR ya estan listos para compartir.' });
    } catch (err) {
      toast({ title: 'No se pudo generar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setGeneratingInvite(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: `${label} copiado` });
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Selecciona y copia el texto manualmente.', variant: 'destructive' });
    }
  };

  const createProfessionalInvite = async () => {
    if (!selected) return;

    setGeneratingProfessionalInvite(true);
    try {
      const nextInvite = await generateProfessionalInvite(selected.id, { horas_validez: 1 });
      setProfessionalInvite(nextInvite);
      toast({ title: 'Invitacion profesional creada', description: 'El codigo y el QR ya estan listos para compartir con el profesional.' });
    } catch (err) {
      toast({ title: 'No se pudo generar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setGeneratingProfessionalInvite(false);
    }
  };

  const togglePertenecientePermission = async (permiso: string, habilitado: boolean) => {
    if (!selected) return;
    const targetId = selected.id;
    const key = `perteneciente:${targetId}:${permiso}`;
    setSavingKey(key);

    const oldPermisos = selected.permisos_efectivos;

    setContext(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pertenecientes: prev.pertenecientes?.map(p =>
          p.id === targetId
            ? {
                ...p,
                permisos_efectivos: {
                  ...p.permisos_efectivos,
                  permisos: {
                    ...p.permisos_efectivos.permisos,
                    [permiso]: { habilitado, source: 'otorgado' as const },
                  },
                },
              }
            : p,
        ),
      };
    });

    try {
      const result = await setPertenecientePermissionByName(targetId, permiso, habilitado, 'Actualizado por tutor');
      if ('permisos' in result) {
        setContext(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pertenecientes: prev.pertenecientes?.map(p =>
              p.id === targetId
                ? { ...p, permisos_efectivos: result as EffectivePertenecientePermissions }
                : p,
            ),
          };
        });
      }
      toast({ title: 'Permiso actualizado', description: `${PERTENECIENTE_PERMISSION_LABELS[permiso] || permiso}: ${habilitado ? 'habilitado' : 'deshabilitado'}` });
    } catch (err) {
      setContext(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          pertenecientes: prev.pertenecientes?.map(p =>
            p.id === targetId
              ? { ...p, permisos_efectivos: oldPermisos }
              : p,
          ),
        };
      });
      toast({ title: 'No se pudo actualizar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const toggleProfessionalPermission = async (idVinculo: number, permiso: string, habilitado: boolean) => {
    const key = `profesional:${idVinculo}:${permiso}`;
    setSavingKey(key);

    const selectedPerteneciente = selected;
    const oldVinculoPermisos = selectedPerteneciente?.profesionales_vinculados
      ?.find(v => v.id_vinculo === idVinculo)?.permisos_efectivos;

    setContext(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        pertenecientes: prev.pertenecientes?.map(p =>
          p.id === selectedId
            ? {
                ...p,
                profesionales_vinculados: p.profesionales_vinculados?.map(v =>
                  v.id_vinculo === idVinculo
                    ? {
                        ...v,
                        permisos_efectivos: {
                          ...v.permisos_efectivos,
                          permisos: {
                            ...v.permisos_efectivos.permisos,
                            [permiso]: { habilitado, source: 'otorgado' as const },
                          },
                        },
                      }
                    : v,
                ),
              }
            : p,
        ),
      };
    });

    try {
      const result = await setProfessionalPermissionByName(idVinculo, permiso, habilitado, 'Actualizado por tutor');
      if ('id_vinculo_profesional_perteneciente' in result) {
        setContext(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pertenecientes: prev.pertenecientes?.map(p =>
              p.id === selectedId
                ? {
                    ...p,
                    profesionales_vinculados: p.profesionales_vinculados?.map(v =>
                      v.id_vinculo === idVinculo
                        ? { ...v, permisos_efectivos: result as EffectiveProfessionalPermissions }
                        : v,
                    ),
                  }
                : p,
            ),
          };
        });
      }
      toast({ title: 'Permiso profesional actualizado', description: `${PROFESSIONAL_PERMISSION_LABELS[permiso] || permiso}: ${habilitado ? 'habilitado' : 'deshabilitado'}` });
    } catch (err) {
      if (oldVinculoPermisos) {
        setContext(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pertenecientes: prev.pertenecientes?.map(p =>
              p.id === selectedId
                ? {
                    ...p,
                    profesionales_vinculados: p.profesionales_vinculados?.map(v =>
                      v.id_vinculo === idVinculo
                        ? { ...v, permisos_efectivos: oldVinculoPermisos }
                        : v,
                    ),
                  }
                : p,
            ),
          };
        });
      }
      toast({ title: 'No se pudo actualizar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setSavingKey(null);
    }
  };

  const deleteTutorLink = async () => {
    if (!selected) return;
    const confirmed = window.confirm(`Eliminar el vinculo con ${fullName(selected.usuario)}?`);
    if (!confirmed) return;

    const key = `tutor:${selected.vinculo.id}`;
    setDeletingKey(key);
    try {
      await deleteTutorPertenecienteLink(selected.vinculo.id);
      setProfessionalInvite(null);
      window.dispatchEvent(new CustomEvent('permisos:updated', { detail: { source: 'tutor-link-delete' } }));
      await load();
      toast({ title: 'Vinculo eliminado', description: 'El perteneciente ya no queda vinculado a este tutor.' });
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setDeletingKey(null);
    }
  };

  const deleteProfessionalLink = async (idVinculo: number, professionalName: string) => {
    const confirmed = window.confirm(`Eliminar el vinculo con ${professionalName}?`);
    if (!confirmed) return;

    const key = `profesional:${idVinculo}`;
    setDeletingKey(key);
    try {
      await deleteProfessionalPertenecienteLink(idVinculo);
      window.dispatchEvent(new CustomEvent('permisos:updated', { detail: { source: 'professional-link-delete' } }));
      await load();
      toast({ title: 'Vinculo profesional eliminado' });
    } catch (err) {
      toast({ title: 'No se pudo eliminar', description: err instanceof Error ? err.message : 'Error desconocido', variant: 'destructive' });
    } finally {
      setDeletingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Loader2 size={18} className="animate-spin" />
          Cargando vinculos
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={load}>
          <RefreshCcw size={14} className="mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">Vinculos y permisos</h2>
          <p className="text-sm text-muted-foreground">Gestion operativa de tus pertenecientes vinculados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCcw size={14} className="mr-2" />
          Actualizar
        </Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <QrCode size={18} className="text-primary" />
              <h3 className="font-heading text-lg font-bold text-foreground">Invitar perteneciente</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Genera un codigo y un QR validos por 1 hora para crear el vinculo tutor-perteneciente.
            </p>
          </div>
          <Button onClick={createInvite} disabled={generatingInvite} className="w-full gap-2 sm:w-fit">
            {generatingInvite ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Generar invitacion
          </Button>
        </div>

        {invite && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Codigo</p>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input readOnly value={invite.codigo} className="font-mono text-lg font-bold tracking-[0.18em]" />
                  <Button variant="outline" onClick={() => copyText(invite.codigo, 'Codigo')} className="gap-2">
                    <Clipboard size={15} />
                    Copiar
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Link QR</p>
                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                  <Input readOnly value={inviteUrl} className="font-mono text-xs" />
                  <Button variant="outline" onClick={() => copyText(inviteUrl, 'Link')} className="gap-2">
                    <Link size={15} />
                    Copiar
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Expira: {new Date(invite.fecha_expiracion).toLocaleString('es-AR')}
              </p>
            </div>

            <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-border bg-background p-3">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR de vinculacion" className="h-[200px] w-[200px]" />
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  Generando QR
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {pertenecientes.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
          No hay pertenecientes activos vinculados.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
          <section className="rounded-lg border border-border bg-card p-3">
            <div className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-foreground">
              <Users size={16} />
              Pertenecientes
            </div>
            <div className="space-y-2">
              {pertenecientes.map(item => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selected?.id === item.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                      <UserRound size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{fullName(item.usuario)}</p>
                      <p className="text-xs text-muted-foreground">{item.perteneciente.puede_autogestionarse ? 'Autogestionado' : 'Tutelado'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {selected && (
            <div className="space-y-4">
              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">{fullName(selected.usuario)}</h3>
                    <p className="text-sm text-muted-foreground">Estado del vinculo: {selected.vinculo.estado_vinculo}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selected.vinculo.es_tutor_principal ? 'default' : 'secondary'}>
                      {selected.vinculo.es_tutor_principal ? 'Tutor principal' : 'Tutor activo'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={deleteTutorLink}
                      disabled={deletingKey === `tutor:${selected.vinculo.id}`}
                    >
                      {deletingKey === `tutor:${selected.vinculo.id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Eliminar vinculo
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {permissionEntries(selected.permisos_efectivos.permisos).map(([permiso, value]) => {
                    const key = `perteneciente:${selected.id}:${permiso}`;
                    return (
                      <div key={permiso} className="flex min-h-[72px] items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">{PERTENECIENTE_PERMISSION_LABELS[permiso] || permiso}</p>
                          <p className="text-xs text-muted-foreground">{sourceLabel(value.source)}</p>
                        </div>
                        <Switch
                          checked={value.habilitado}
                          disabled={savingKey === key}
                          onCheckedChange={checked => togglePertenecientePermission(permiso, checked)}
                          aria-label={PERTENECIENTE_PERMISSION_LABELS[permiso] || permiso}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-lg border border-border bg-card p-4">
                <div className="mb-4 flex items-center gap-2">
                  <BriefcaseMedical size={18} className="text-primary" />
                  <h3 className="font-heading text-lg font-bold text-foreground">Profesionales vinculados</h3>
                </div>

                <div className="mb-4 rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <QrCode size={17} className="text-primary" />
                        <p className="font-semibold text-foreground">Invitar profesional con codigo o QR</p>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Genera una invitacion para que un profesional se vincule a {fullName(selected.usuario)}.
                      </p>
                    </div>
                    <Button
                      onClick={createProfessionalInvite}
                      disabled={generatingProfessionalInvite}
                      variant="outline"
                      className="gap-2"
                    >
                      {generatingProfessionalInvite ? <Loader2 size={15} className="animate-spin" /> : <QrCode size={15} />}
                      Generar codigo/QR
                    </Button>
                  </div>

                  {professionalInvite && professionalInvite.id_perteneciente === selected.id && (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Codigo profesional</p>
                          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                            <Input readOnly value={professionalInvite.codigo} className="font-mono text-lg font-bold tracking-[0.18em]" />
                            <Button variant="outline" onClick={() => copyText(professionalInvite.codigo, 'Codigo profesional')} className="gap-2">
                              <Clipboard size={15} />
                              Copiar
                            </Button>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Link QR profesional</p>
                          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                            <Input readOnly value={professionalInviteUrl} className="font-mono text-xs" />
                            <Button variant="outline" onClick={() => copyText(professionalInviteUrl, 'Link profesional')} className="gap-2">
                              <Link size={15} />
                              Copiar
                            </Button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Expira: {new Date(professionalInvite.fecha_expiracion).toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-card p-3">
                        {professionalQrDataUrl ? (
                          <img src={professionalQrDataUrl} alt="QR de vinculacion profesional" className="h-[180px] w-[180px]" />
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 size={16} className="animate-spin" />
                            Generando QR
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {(selected.profesionales_vinculados || []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
                    No hay profesionales vinculados a este perteneciente.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(selected.profesionales_vinculados || []).map(item => (
                      <div key={item.id_vinculo} className="rounded-lg border border-border bg-background p-3">
                        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{fullName(item.profesional.usuario)}</p>
                            <p className="text-xs text-muted-foreground">
                              {[item.profesional.profesion, item.profesional.especialidad].filter(Boolean).join(' - ') || 'Profesional'}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={item.permisos_efectivos.vinculo_aprobado ? 'default' : 'secondary'}>
                              {item.vinculo.estado_vinculo}
                            </Badge>
                            {item.permisos_efectivos.vinculo_aprobado && (
                              <Badge variant="outline" className="gap-1">
                                <CheckCircle2 size={12} />
                                Aprobado
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 text-destructive hover:text-destructive"
                              onClick={() => deleteProfessionalLink(item.id_vinculo, fullName(item.profesional.usuario))}
                              disabled={deletingKey === `profesional:${item.id_vinculo}`}
                            >
                              {deletingKey === `profesional:${item.id_vinculo}` ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              Eliminar
                            </Button>
                          </div>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {permissionEntries(item.permisos_efectivos.permisos).map(([permiso, value]) => {
                            const key = `profesional:${item.id_vinculo}:${permiso}`;
                            return (
                              <div key={permiso} className="flex min-h-[64px] items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{PROFESSIONAL_PERMISSION_LABELS[permiso] || permiso}</p>
                                  <p className="text-xs text-muted-foreground">{sourceLabel(value.source)}</p>
                                </div>
                                <Switch
                                  checked={value.habilitado}
                                  disabled={savingKey === key}
                                  onCheckedChange={checked => toggleProfessionalPermission(item.id_vinculo, permiso, checked)}
                                  aria-label={PROFESSIONAL_PERMISSION_LABELS[permiso] || permiso}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-start gap-3">
                  <Shield size={18} className="mt-0.5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Altas y bajas de vinculos</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Las altas se hacen por codigo o QR. Las bajas se gestionan desde los botones de eliminar en el perteneciente o en cada profesional vinculado.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
