import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, Loader2, RefreshCcw, TriangleAlert } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/ui/use-toast';
import { cn } from '@/lib/utils';
import { tandemApi, type HelpCardConfig, type HelpCardUpdateBody } from '@/services/api/tandem-api';
import PermissionSwitchRow from './PermissionSwitchRow';
import SurfaceCard from './SurfaceCard';

const DOMICILIO_MAX = 160;
const MENSAJE_MAX = 200;
const LOAD_ERROR = 'No pudimos cargar la tarjeta. Intentá nuevamente.';

const SWITCH_CLASS = 'data-[state=checked]:bg-[var(--evo-primary)] data-[state=unchecked]:bg-[var(--evo-border-2)] focus-visible:ring-[var(--evo-primary)]';
const FIELD_CLASS = 'rounded-2xl border-[var(--evo-border-1)] bg-white text-sm text-[var(--evo-text)] focus-visible:ring-[var(--evo-primary)]';
const OUTLINE_BUTTON_CLASS = 'min-h-11 flex-1 gap-2 rounded-2xl border-[var(--evo-border-1)] bg-white font-extrabold text-[var(--evo-primary-text)]';

const toBody = (config: HelpCardConfig, patch: Partial<HelpCardUpdateBody>): HelpCardUpdateBody => ({
  activa: config.activa,
  mostrarCelular: config.mostrarCelular,
  mostrarMail: config.mostrarMail,
  mostrarDomicilio: config.mostrarDomicilio,
  domicilio: config.domicilio,
  mensaje: config.mensaje,
  ...patch,
});

/** Tarjeta de ayuda de un perteneciente: el tutor la activa y elige que datos ve quien escanea el QR. */
export default function HelpCardSettingsCard({ idPerteneciente, name }: { idPerteneciente: number; name: string }) {
  const [config, setConfig] = useState<HelpCardConfig | null>(null);
  const [loadError, setLoadError] = useState(false);
  const configRef = useRef<HelpCardConfig | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const [domicilioDraft, setDomicilioDraft] = useState('');
  const [mensajeDraft, setMensajeDraft] = useState('');
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const applyConfig = useCallback((next: HelpCardConfig) => {
    configRef.current = next;
    setConfig(next);
    setDomicilioDraft(next.domicilio ?? '');
    setMensajeDraft(next.mensaje ?? '');
  }, []);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      applyConfig(await tandemApi.tarjetaAyuda.getForPerteneciente(idPerteneciente));
    } catch {
      setLoadError(true);
    }
  }, [applyConfig, idPerteneciente]);

  useEffect(() => {
    void load();
  }, [load]);

  // Los guardados se encolan: el blur de un campo y el toque de un switch pueden
  // llegar juntos y ninguno se pierde. Si uno falla, vuelve al valor anterior.
  const save = (patch: Partial<HelpCardUpdateBody>) => {
    saveQueue.current = saveQueue.current.then(async () => {
      const previous = configRef.current;
      if (!previous) return;
      try {
        applyConfig(await tandemApi.tarjetaAyuda.update(idPerteneciente, toBody(previous, patch)));
      } catch (err) {
        applyConfig(previous);
        toast({ title: 'No se pudo guardar', description: err instanceof Error ? err.message : 'Intentá nuevamente.', variant: 'destructive' });
      }
    });
  };

  const saveText = (field: 'domicilio' | 'mensaje', draft: string) => {
    if (!config || draft.trim() === (config[field] ?? '')) return;
    save({ [field]: draft });
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      applyConfig(await tandemApi.tarjetaAyuda.regenerate(idPerteneciente));
      toast({ title: 'QR cambiado', description: 'El código anterior ya no funciona.' });
    } catch (err) {
      toast({ title: 'No se pudo cambiar el QR', description: err instanceof Error ? err.message : 'Intentá nuevamente.', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  const openPreview = () => {
    if (config) window.open(`${window.location.origin}${config.url}`, '_blank', 'noopener,noreferrer');
  };

  if (loadError) {
    return (
      <SurfaceCard>
        <p className="text-sm font-semibold text-[var(--evo-text)]">{LOAD_ERROR}</p>
        <Button variant="outline" onClick={() => void load()} className="mt-3 min-h-11 gap-2 rounded-xl border-[var(--evo-border-1)] text-[var(--evo-primary-text)]">
          <RefreshCcw size={14} aria-hidden />
          Reintentar
        </Button>
      </SurfaceCard>
    );
  }

  if (!config) {
    return (
      <SurfaceCard>
        <p className="flex items-center gap-2 text-sm font-medium text-[var(--evo-text-secondary)]" role="status">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Cargando tarjeta de ayuda
        </p>
      </SurfaceCard>
    );
  }

  const sinCelular = config.mostrarCelular ? config.tutores.filter(t => !t.tieneCelular) : [];

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 text-[15.5px] font-extrabold text-[var(--evo-text)]">🪪 Tarjeta de ayuda de {name}</h2>
        <Switch
          checked={config.activa}
          onCheckedChange={activa => save({ activa })}
          aria-label="Tarjeta de ayuda activa"
          className={SWITCH_CLASS}
        />
      </div>
      <p className="mb-1 mt-1 text-xs text-[var(--evo-text-secondary)]">
        {name} la muestra desde su celular. Quien escanea el QR ve solo lo que actives acá.
      </p>

      <div className={cn('transition-opacity', !config.activa && 'opacity-60')}>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--evo-border-3)] py-3">
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-[var(--evo-text)]">Nombre y apellido</p>
            <p className="mt-0.5 text-[11px] text-[var(--evo-text-secondary)]">Siempre se muestra</p>
          </div>
          <span className="shrink-0 rounded-full bg-[var(--evo-soft)] px-3.5 py-2 text-xs font-extrabold text-[var(--evo-primary-text)]">Siempre</span>
        </div>

        <PermissionSwitchRow
          row={{ key: 'celular', label: 'Celular de los tutores', source: 'Con botones para llamar y WhatsApp', checked: config.mostrarCelular, saving: false }}
          onToggle={(_, mostrarCelular) => save({ mostrarCelular })}
        />
        <PermissionSwitchRow
          row={{ key: 'mail', label: 'Mail de los tutores', source: 'Para escribirles un correo', checked: config.mostrarMail, saving: false }}
          onToggle={(_, mostrarMail) => save({ mostrarMail })}
        />
        <PermissionSwitchRow
          row={{ key: 'domicilio', label: 'Domicilio', source: config.mostrarDomicilio ? 'Se muestra en la tarjeta' : 'Apagado por defecto', checked: config.mostrarDomicilio, saving: false }}
          onToggle={(_, mostrarDomicilio) => save({ mostrarDomicilio })}
        />
        {config.mostrarDomicilio && (
          <Input
            value={domicilioDraft}
            maxLength={DOMICILIO_MAX}
            onChange={event => setDomicilioDraft(event.target.value)}
            onBlur={() => saveText('domicilio', domicilioDraft)}
            aria-label="Domicilio"
            placeholder="Calle, número y barrio"
            className={cn('mb-3 min-h-11', FIELD_CLASS)}
          />
        )}

        <div className="border-t border-[var(--evo-border-3)] pt-3">
          <label htmlFor={`help-card-message-${idPerteneciente}`} className="text-[13.5px] font-bold text-[var(--evo-text)]">Mensaje (opcional)</label>
          <Textarea
            id={`help-card-message-${idPerteneciente}`}
            value={mensajeDraft}
            maxLength={MENSAJE_MAX}
            onChange={event => setMensajeDraft(event.target.value)}
            onBlur={() => saveText('mensaje', mensajeDraft)}
            placeholder="Ej.: Puede que me cueste hablar. Hablame despacio."
            className={cn('mt-2 min-h-[88px] resize-none', FIELD_CLASS)}
          />
          <p className="mt-1 text-right text-xs text-[var(--evo-text-secondary)]" aria-live="polite">{mensajeDraft.length}/{MENSAJE_MAX}</p>
        </div>
      </div>

      {sinCelular.map(tutor => (
        <p
          key={`${tutor.nombre}-${tutor.apellido}`}
          role="alert"
          className="mt-2 flex items-start gap-2 rounded-2xl border border-[var(--evo-support)] bg-[var(--evo-support-bg)] px-3.5 py-3 text-[13px] font-bold text-[var(--evo-support-text)]"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
          {tutor.nombre} no cargó su celular. Va a aparecer sin botón de llamar.
        </p>
      ))}

      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={openPreview} disabled={!config.activa} className={OUTLINE_BUTTON_CLASS}>
          <Eye size={16} aria-hidden />
          Ver cómo se ve
        </Button>
        <Button variant="outline" onClick={() => setConfirmingRegenerate(true)} disabled={regenerating} className={OUTLINE_BUTTON_CLASS}>
          {regenerating ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <RefreshCcw size={16} aria-hidden />}
          Cambiar QR
        </Button>
      </div>
      <p className="mt-2 text-xs text-[var(--evo-text-secondary)]">«Cambiar QR» hace que el código anterior deje de funcionar (por si se perdió el celular).</p>

      <AlertDialog open={confirmingRegenerate} onOpenChange={setConfirmingRegenerate}>
        <AlertDialogContent className="w-[calc(100%-1.5rem)] max-w-md rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar el código QR?</AlertDialogTitle>
            <AlertDialogDescription>
              El código anterior va a dejar de funcionar. {name} tendrá que mostrar el nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void regenerate()} className="min-h-11 rounded-xl bg-[var(--evo-primary)] text-white hover:bg-[var(--evo-primary-text)]">
              Cambiar QR
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SurfaceCard>
  );
}
