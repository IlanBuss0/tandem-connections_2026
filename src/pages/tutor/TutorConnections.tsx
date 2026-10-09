import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { BriefcaseMedical, Loader2, Plus, QrCode, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteProfessionalPertenecienteLink, deleteTutorPertenecienteLink, generateProfessionalInvite, generateTutorInvite, fetchPermissionContext, setPertenecientePermissionByName, setProfessionalPermissionByName, type EffectivePertenecientePermissions, type EffectiveProfessionalPermissions, type PermissionContext, type ProfessionalInvite, type TutorInvite, type TutorPermissionContextPerteneciente, type GeneratedReport } from '@/data/api';
import { reportsOfPerson, reportsSummary } from '@/lib/tutorReports';
import { toast } from '@/hooks/ui/use-toast';
import InvitePanel from './personas/InvitePanel';
import type { PermissionRow } from './personas/PermissionSwitchRow';
import HelpCardSettingsCard from './personas/HelpCardSettingsCard';
import PersonPermissionsCard from './personas/PersonPermissionsCard';
import PersonSelector from './personas/PersonSelector';
import ProfessionalLinkRow from './personas/ProfessionalLinkRow';
import SelectedPersonCard from './personas/SelectedPersonCard';
import SurfaceCard from './personas/SurfaceCard';

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

export default function TutorConnections({ initialPertenecienteId, onOpenDetail, reports = [], onOpenReports }: { initialPertenecienteId?: number; onOpenDetail?: (id: string) => void; reports?: GeneratedReport[]; onOpenReports?: (pertenecienteId: number) => void }) {
  const [context, setContext] = useState<PermissionContext | null>(null);
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
  const [chosenId, setChosenId] = useState<number | null>(initialPertenecienteId ?? null);
  const [expandedProfessionalId, setExpandedProfessionalId] = useState<number | null>(null);

  const pertenecientes = context?.pertenecientes || [];
  const selected = useMemo<TutorPermissionContextPerteneciente | null>(() => {
    if (!pertenecientes.length) return null;
    return pertenecientes.find(item => item.id === chosenId) || pertenecientes[0];
  }, [pertenecientes, chosenId]);
  const selectedId = selected?.id ?? null;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPermissionContext();
      setContext(next);
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

  const toRows = (entries: ReturnType<typeof permissionEntries>, labels: Record<string, string>, keyPrefix: string): PermissionRow[] =>
    entries.map(([permiso, value]) => ({
      key: permiso,
      label: labels[permiso] || permiso,
      source: sourceLabel(value.source),
      checked: value.habilitado,
      saving: savingKey === `${keyPrefix}:${permiso}`,
    }));

  const selectPerson = (id: number) => {
    setChosenId(id);
    setExpandedProfessionalId(null);
  };

  const selectedName = selected ? fullName(selected.usuario) : '';
  const selectedFirstName = selected?.usuario.nombre?.trim().split(/\s+/)[0] || selectedName;
  const professionals = selected?.profesionales_vinculados || [];

  return (
    <div className="evolution-scope mx-auto w-full max-w-2xl space-y-4 lg:max-w-none">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[var(--evo-primary)]">Red de apoyo</p>
          <h1 className="mt-0.5 font-heading text-[23px] font-extrabold text-[var(--evo-text)] lg:text-[26px]">
            {selected ? `Permisos de ${selectedName}` : 'Personas vinculadas'}
          </h1>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="min-h-11 gap-2 rounded-xl border-[var(--evo-border-1)] text-[var(--evo-primary-text)]">
          <RefreshCcw size={14} aria-hidden />
          Actualizar
        </Button>
      </header>

      <PersonSelector people={pertenecientes.map(p => ({ id: p.id, name: fullName(p.usuario) }))} selectedId={selectedId} onSelect={selectPerson} />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <div className="space-y-4">
          {selected ? (
            <>
              <SelectedPersonCard
                name={selectedName}
                isPrincipal={selected.vinculo.es_tutor_principal}
                deleting={deletingKey === `tutor:${selected.vinculo.id}`}
                onOpenDetail={onOpenDetail && (() => onOpenDetail(String(selected.usuario.id)))}
                onDelete={deleteTutorLink}
                reportsSummary={reportsSummary(reportsOfPerson(reports, selected.id))}
                onOpenReports={onOpenReports && (() => onOpenReports(selected.id))}
              />
              <PersonPermissionsCard
                key={selected.id}
                rows={toRows(permissionEntries(selected.permisos_efectivos.permisos), PERTENECIENTE_PERMISSION_LABELS, `perteneciente:${selected.id}`)}
                onToggle={togglePertenecientePermission}
              />
              <HelpCardSettingsCard key={`help-card-${selected.id}`} idPerteneciente={selected.id} name={selectedFirstName} />
            </>
          ) : (
            <p className="rounded-[24px] border border-dashed border-[var(--evo-border-2)] bg-white p-5 text-sm text-[var(--evo-text-secondary)]">
              No hay pertenecientes activos vinculados.
            </p>
          )}
        </div>

        <div className="space-y-4">
          {selected && (
            <SurfaceCard>
              <h2 className="flex items-center gap-2.5 text-[15.5px] font-extrabold text-[var(--evo-text)]">
                <BriefcaseMedical size={18} className="text-[var(--evo-primary)]" aria-hidden />
                Profesionales vinculados
              </h2>
              <p className="mb-3 ml-7 mt-0.5 text-xs text-[var(--evo-text-secondary)]">Quiénes acompañan a {selectedName} y qué pueden ver.</p>

              <div className="mb-2.5 rounded-2xl bg-[var(--evo-soft-2)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <span className="flex items-center gap-2.5 text-xs font-bold text-[var(--evo-primary-text)]">
                    <QrCode size={18} aria-hidden />
                    Invitar un profesional
                  </span>
                  <Button
                    variant="outline"
                    onClick={createProfessionalInvite}
                    disabled={generatingProfessionalInvite}
                    className="min-h-11 gap-1.5 rounded-xl border-[var(--evo-border-1)] bg-white text-xs font-extrabold text-[var(--evo-primary-text)]"
                  >
                    {generatingProfessionalInvite ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <QrCode size={15} aria-hidden />}
                    Generar QR
                  </Button>
                </div>
                {professionalInvite && professionalInvite.id_perteneciente === selected.id && (
                  <InvitePanel
                    codigo={professionalInvite.codigo}
                    url={professionalInviteUrl}
                    expiresAt={professionalInvite.fecha_expiracion}
                    qrDataUrl={professionalQrDataUrl}
                    qrAlt="QR de vinculación profesional"
                    suffix=" profesional"
                    onCopy={copyText}
                  />
                )}
              </div>

              {professionals.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--evo-border-2)] p-5 text-center text-sm text-[var(--evo-text-secondary)]">
                  No hay profesionales vinculados a este perteneciente.
                </p>
              ) : (
                professionals.map(item => (
                  <ProfessionalLinkRow
                    key={item.id_vinculo}
                    name={fullName(item.profesional.usuario)}
                    subtitle={`${[item.profesional.profesion, item.profesional.especialidad].filter(Boolean).join(' - ') || 'Profesional'} · ${item.vinculo.estado_vinculo}`}
                    expanded={expandedProfessionalId === item.id_vinculo}
                    deleting={deletingKey === `profesional:${item.id_vinculo}`}
                    rows={toRows(permissionEntries(item.permisos_efectivos.permisos), PROFESSIONAL_PERMISSION_LABELS, `profesional:${item.id_vinculo}`)}
                    onToggleExpanded={() => setExpandedProfessionalId(expandedProfessionalId === item.id_vinculo ? null : item.id_vinculo)}
                    onTogglePermission={(permiso, checked) => toggleProfessionalPermission(item.id_vinculo, permiso, checked)}
                    onDelete={() => deleteProfessionalLink(item.id_vinculo, fullName(item.profesional.usuario))}
                  />
                ))
              )}
            </SurfaceCard>
          )}

          <SurfaceCard>
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--evo-soft)] text-[var(--evo-primary-text)]">
                <QrCode size={20} aria-hidden />
              </span>
              <div className="min-w-[10rem] flex-1">
                <p className="text-sm font-extrabold text-[var(--evo-text)]">Vincular una nueva persona</p>
                <p className="mt-0.5 text-xs text-[var(--evo-text-secondary)]">Código o QR válido por 1 hora</p>
              </div>
              <Button onClick={createInvite} disabled={generatingInvite} className="min-h-11 gap-2 rounded-xl bg-[var(--evo-primary)] font-extrabold text-white hover:bg-[var(--evo-primary-text)]">
                {generatingInvite ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Plus size={15} aria-hidden />}
                Generar invitación
              </Button>
            </div>
            {invite && (
              <InvitePanel codigo={invite.codigo} url={inviteUrl} expiresAt={invite.fecha_expiracion} qrDataUrl={qrDataUrl} qrAlt="QR de vinculación" onCopy={copyText} />
            )}
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
