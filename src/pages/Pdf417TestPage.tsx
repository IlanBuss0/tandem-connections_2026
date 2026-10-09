import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader, type IScannerControls } from '@zxing/browser';
import { Camera, CheckCircle2, Loader2, RotateCcw, Square } from 'lucide-react';

type ScanState = 'idle' | 'starting' | 'scanning' | 'detected' | 'error' | 'unavailable';

export default function Pdf417TestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserPDF417Reader | null>(null);
  const [state, setState] = useState<ScanState>('idle');
  const [rawValue, setRawValue] = useState('');
  const [error, setError] = useState('');

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current?.reset();
    readerRef.current = null;
    const video = videoRef.current;
    const stream = video?.srcObject;
    if (typeof MediaStream !== 'undefined' && stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop());
    if (video) video.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    stopCamera();
    setRawValue('');
    setError('');
    setState('starting');
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      return;
    }

    const reader = new BrowserPDF417Reader();
    readerRef.current = reader;
    try {
      const controls = await reader.decodeFromConstraints(
        { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoRef.current,
        (result, decodeError) => {
          if (result) {
            setRawValue(result.getText());
            setState('detected');
            controlsRef.current?.stop();
            controlsRef.current = null;
          } else if (decodeError) {
            setState(current => current === 'starting' ? 'scanning' : current);
          }
        },
      );
      controlsRef.current = controls;
      setState('scanning');
    } catch {
      stopCamera();
      setState('error');
      setError('No pudimos acceder a tu cámara. Habilitá el permiso de cámara para utilizar el escáner.');
    }
  };

  const statusText = state === 'idle' ? 'Esperando cámara...' : state === 'starting' ? 'Abriendo cámara...' : state === 'scanning' ? 'Buscando código PDF417...' : state === 'detected' ? '✓ PDF417 leído correctamente' : state === 'unavailable' ? 'No encontramos una cámara disponible.' : error;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FAF7FF] via-[#FAF7FF] to-white px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2"><p className="text-sm font-bold uppercase tracking-[.16em] text-primary">TÁNDEM · prueba técnica</p><h1 className="text-3xl font-bold tracking-tight">Prueba de lector DNI</h1><p className="text-muted-foreground">Mostrá el frente del DNI argentino para comprobar la lectura local del código PDF417. Esta pantalla no sube ni guarda imágenes.</p></header>
        <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" aria-label="Cámara para leer PDF417" />
            {state !== 'idle' && state !== 'detected' && state !== 'error' && state !== 'unavailable' && <div data-testid="pdf417-guide-frame" className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 aspect-[1.586/1] -translate-y-1/2 rounded-xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,.4)]"><span className="absolute inset-0 flex items-center justify-center text-sm font-bold uppercase tracking-widest text-white/80">Frente del DNI</span></div>}
            {state === 'starting' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"><Loader2 className="mr-2 animate-spin" />Abriendo cámara...</div>}
            {state === 'detected' && <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/75 text-white"><CheckCircle2 className="mr-2" />Código detectado</div>}
          </div>
          <p className="mt-4 min-h-12 rounded-2xl bg-[#FAF7FF] p-3 text-center text-sm font-semibold text-primary" role="status">{statusText}</p>
          {state === 'scanning' && <p className="text-center text-xs text-muted-foreground">Acomodá el DNI completo dentro del recuadro. Si está lejos, acercalo; si queda cortado, alejalo.</p>}
          {(state === 'error' || state === 'unavailable') && <button type="button" onClick={startCamera} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-bold text-primary-foreground"><RotateCcw size={18} />Reintentar</button>}
          {state === 'idle' && <button type="button" onClick={startCamera} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 font-bold text-primary-foreground"><Camera size={18} />Abrir cámara</button>}
          {(state === 'starting' || state === 'scanning') && <button type="button" onClick={() => { stopCamera(); setState('idle'); }} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 px-4 font-bold text-primary"><Square size={16} />Detener cámara</button>}
        </div>
        {state === 'detected' && <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"><h2 className="flex items-center gap-2 font-bold text-emerald-900"><CheckCircle2 size={20} />Contenido decodificado</h2><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-2xl bg-white p-4 text-xs text-slate-800">{rawValue}</pre><p className="mt-3 text-xs text-emerald-900">Se muestra exactamente el texto entregado por ZXing. No se interpreta ni se usa para registro.</p></section>}
      </section>
    </main>
  );
}
