import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Loader2, X } from 'lucide-react';
import { tandemApi, type HelpCardMine } from '@/services/api/tandem-api';

// Unica responsabilidad: "Mi tarjeta de ayuda", la pantalla completa con el QR
// que el perteneciente le muestra a alguien cuando necesita ayuda. Mismo patron
// que CantSpeakMode (forwardRef + open()), pero sin boton propio: se abre desde
// el menu rapido o desde el perfil. Fondo blanco y QR oscuro para que la camara
// lo lea facil. El QR apunta a window.location.origin, nunca a localhost fijo.
export type HelpCardModeHandle = { open: () => void };

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'inactive' }
  | { status: 'active'; fullName: string; qr: string };

const QR_SIZE = 280;

const HelpCardMode = forwardRef<HelpCardModeHandle>(function HelpCardMode(_props, ref) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ status: 'loading' });
  const closeRef = useRef<HTMLButtonElement>(null);

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setState({ status: 'loading' });
    try {
      const card: HelpCardMine = await tandemApi.tarjetaAyuda.getMine();
      if (!card.activa) {
        if (!isCancelled()) setState({ status: 'inactive' });
        return;
      }
      const qr = await QRCode.toDataURL(`${window.location.origin}${card.url}`, {
        margin: 2,
        width: QR_SIZE * 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#1f1535', light: '#ffffff' },
      });
      if (!isCancelled()) setState({ status: 'active', fullName: [card.nombre, card.apellido].filter(Boolean).join(' '), qr });
    } catch {
      if (!isCancelled()) setState({ status: 'error' });
    }
  }, []);

  // Al abrir se pide siempre la tarjeta: el tutor pudo apagarla o cambiar el QR.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void load(() => cancelled);
    return () => { cancelled = true; };
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Mi tarjeta de ayuda" className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-[#ede4f8] p-4">
        <h2 className="text-lg font-bold text-[#6b4c9a]">Mi tarjeta de ayuda</h2>
        <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full text-[#8b7aa0] hover:bg-[#f5f0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b4c9a]">
          <X size={22} aria-hidden />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-6 py-4 text-center">
        {state.status === 'loading' && (
          <p role="status" className="flex items-center gap-2 text-sm font-semibold text-[#8b7aa0]">
            <Loader2 size={18} className="animate-spin" aria-hidden /> Cargando tu tarjeta
          </p>
        )}

        {state.status === 'error' && (
          <>
            <p className="text-base font-bold text-[#2b2145]">No pudimos cargar tu tarjeta.</p>
            <button type="button" onClick={() => void load()} className="min-h-12 rounded-full bg-[#6F4CA6] px-6 text-base font-bold text-white hover:bg-[#5f3f94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6F4CA6] focus-visible:ring-offset-2">
              Probar de nuevo
            </button>
          </>
        )}

        {state.status === 'inactive' && (
          <>
            <span className="text-6xl" aria-hidden>🪪</span>
            <h3 className="font-heading text-3xl font-bold text-[#2b2145]">Todavía no está activa</h3>
            <p className="max-w-xs text-base font-bold text-[#4f4868]">Pedile a quien te acompaña que la active.</p>
          </>
        )}

        {state.status === 'active' && (
          <>
            <h3 className="font-heading text-4xl font-bold leading-tight text-[#2b2145]">{state.fullName}</h3>
            <p className="text-lg font-bold leading-snug text-[#2b2145]">
              Si necesitás ayuda,<br />mostrale este código a alguien.
            </p>
            <div className="rounded-[32px] border-2 border-[#ede4f8] bg-white p-1">
              <img src={state.qr} alt={`Código QR de la tarjeta de ayuda de ${state.fullName}`} width={QR_SIZE} height={QR_SIZE} className="block h-[280px] w-[280px] max-w-full" />
            </div>
            <p className="max-w-xs text-sm text-[#8b7aa0]">
              Lo pueden escanear con la cámara del celular. Van a ver cómo llamar a tu familia.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

export default HelpCardMode;
