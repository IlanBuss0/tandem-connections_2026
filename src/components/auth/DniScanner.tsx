import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserPDF417Reader, type IScannerControls } from '@zxing/browser';
import { Camera, Loader2, RotateCcw } from 'lucide-react';
import { describePdf417, isPlausibleDniPdf417 } from '@/lib/dniPdf417';
import { DniChecklist, type DniCheckItem, type DniCheckStatus } from './DniChecklist';

// Step-by-step trace to see where the scan stops. It never logs personal data.
const scanLog = (step: string, info?: Record<string, unknown>) => console.info(`[DniScanner] ${step}`, info ?? '');

// The PDF417 is the reliable source (OCR on a phone frame of a plastic card often fails), so the scanner
// waits for the barcode before capturing. After this many seconds it captures anyway and the server uses OCR.
const BARCODE_WAIT_SECONDS = 15;
const BARCODE_HINT = 'Mostrá el código de barras del DNI (suele estar en el dorso) y acercalo hasta que se vea nítido.';

type ScannerState = 'idle' | 'opening' | 'scanning' | 'capturing' | 'camera_error' | 'unavailable';

export function DniScanner({ onCapture, disabled = false }: { onCapture: (file: File, pdf417Raw?: string) => void; disabled?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const pdfControlsRef = useRef<IScannerControls | null>(null);
  const pdfReaderRef = useRef<BrowserPDF417Reader | null>(null);
  const pdf417RawRef = useRef<string | undefined>();
  const stableSecondsRef = useRef(0);
  const [state, setState] = useState<ScannerState>('idle');
  const [feedback, setFeedback] = useState('Ubicá el frente de tu DNI dentro del recuadro.');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [pdf417Detected, setPdf417Detected] = useState(false);
  // Live checklist shown while scanning, so it is clear which stage works and which does not.
  const [checks, setChecks] = useState<{ camera: DniCheckItem; reader: DniCheckItem; quality: DniCheckItem; barcode: DniCheckItem }>(() => initialChecks());
  const setCheck = useCallback((key: keyof ReturnType<typeof initialChecks>, status: DniCheckStatus, detail: string | null = null) => {
    setChecks(current => (current[key].status === status && current[key].detail === detail ? current : { ...current, [key]: { ...current[key], status, detail } }));
  }, []);

  const stop = useCallback(() => {
    pdfControlsRef.current?.stop(); pdfControlsRef.current = null;
    pdfReaderRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null;
  }, []);
  const capture = useCallback((video: HTMLVideoElement) => {
    if (state === 'capturing' || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    scanLog('captura: fotograma tomado', { width: canvas.width, height: canvas.height, pdf417Previo: Boolean(pdf417RawRef.current) });
    if (!pdf417RawRef.current) {
      // The live reader never found a valid barcode: try once more on the sharp captured frame.
      try {
        const text = (pdfReaderRef.current ?? new BrowserPDF417Reader()).decodeFromCanvas(canvas).getText();
        scanLog('captura: PDF417 leido del fotograma', describePdf417(text));
        if (isPlausibleDniPdf417(text)) { pdf417RawRef.current = text; setCheck('barcode', 'ok', 'Leído del fotograma capturado'); }
      } catch (error) {
        scanLog('captura: sin PDF417 en el fotograma', { motivo: error instanceof Error ? error.name : 'desconocido' });
      }
    }
    canvas.toBlob(blob => {
      if (!blob) { scanLog('captura: toBlob fallo, se reintenta'); setState('scanning'); setCountdown(null); stableSecondsRef.current = 0; return; }
      scanLog('captura: enviando a verificar', { bytes: blob.size, conPdf417: Boolean(pdf417RawRef.current) });
      stop(); onCapture(new File([blob], `dni-${Date.now()}.jpg`, { type: 'image/jpeg' }), pdf417RawRef.current); setState('idle'); setCountdown(null); stableSecondsRef.current = 0;
    }, 'image/jpeg', 0.9);
  }, [onCapture, setCheck, state, stop]);

  useEffect(() => () => stop(), [stop]);
  useEffect(() => {
    if (state !== 'scanning') return;
    let lastQualityMessage = '';
    let elapsedSeconds = 0;
    const timer = window.setInterval(() => {
      const video = videoRef.current; if (!video || video.readyState < 2) return;
      elapsedSeconds += 1;
      const quality = analyseFrame(video); setFeedback(quality.message);
      if (quality.message !== lastQualityMessage) { lastQualityMessage = quality.message; scanLog('calidad de imagen', { valida: quality.valid, mensaje: quality.message }); }
      setCheck('quality', quality.valid ? 'ok' : 'fail', quality.valid ? null : quality.message);
      if (!quality.valid) { stableSecondsRef.current = 0; setCountdown(null); return; }
      if (!pdf417RawRef.current && elapsedSeconds < BARCODE_WAIT_SECONDS) {
        if (lastQualityMessage !== BARCODE_HINT) { lastQualityMessage = BARCODE_HINT; scanLog('esperando el codigo de barras', { segundos: elapsedSeconds }); }
        setCheck('barcode', 'pending', `Esperando el código de barras… ${BARCODE_WAIT_SECONDS - elapsedSeconds}s`); setFeedback(BARCODE_HINT); stableSecondsRef.current = 0; setCountdown(null); return;
      }
      if (!pdf417RawRef.current && stableSecondsRef.current === 0) setCheck('barcode', 'fail', 'No se detectó: se usará OCR (menos preciso)');
      if (!pdf417RawRef.current && stableSecondsRef.current === 0) scanLog('tiempo de espera agotado: se captura sin PDF417 (se usara OCR)', { segundos: elapsedSeconds });
      stableSecondsRef.current += 1;
      if (stableSecondsRef.current <= 3) { setCountdown(4 - stableSecondsRef.current); return; }
      setCountdown(null); setState('capturing'); capture(video);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [capture, setCheck, state]);

  const startPdf417Reader = async (video: HTMLVideoElement) => {
    const reader = new BrowserPDF417Reader(undefined, { delayBetweenScanAttempts: 150, delayBetweenScanSuccess: 300 }); pdfReaderRef.current = reader;
    try {
      pdfControlsRef.current = await reader.decodeFromVideoElement(video, result => {
        if (!result || pdf417RawRef.current) return;
        const text = result.getText(); const info = describePdf417(text);
        // A misread frame can decode to garbage: keep scanning until the text looks like a DNI.
        if (!info.plausible) { setCheck('barcode', 'pending', 'Se leyó algo que no parece un DNI; sigo intentando'); scanLog('PDF417 leido pero descartado (no parece un DNI), sigue escaneando', info); return; }
        scanLog('PDF417 leido y aceptado', info); setCheck('barcode', 'ok', 'Datos leídos del código de barras');
        pdf417RawRef.current = text; setPdf417Detected(true); setFeedback('Código PDF417 detectado. Mantené el DNI quieto...');
        pdfControlsRef.current?.stop(); pdfControlsRef.current = null;
      });
      scanLog('lector PDF417 iniciado'); setCheck('reader', 'ok');
    } catch (error) {
      // PDF417 es una mejora local; OCR continúa siendo el fallback seguro.
      setCheck('reader', 'fail', 'No se pudo iniciar; se usará OCR'); setCheck('barcode', 'fail', 'Sin lector: se usará OCR');
      scanLog('lector PDF417 no pudo iniciar (se usara OCR)', { error: error instanceof Error ? `${error.name}: ${error.message}` : 'desconocido' });
    }
  };

  const openCamera = async () => {
    scanLog('abriendo camara'); setChecks(initialChecks());
    stop(); setState('opening'); setCountdown(null); stableSecondsRef.current = 0; pdf417RawRef.current = undefined; setPdf417Detected(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia) { scanLog('camara no disponible en este navegador'); setCheck('camera', 'fail', 'Este navegador no tiene cámara disponible'); setState('unavailable'); return; }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
      streamRef.current = stream;
      const settings = stream.getVideoTracks?.()[0]?.getSettings?.();
      scanLog('camara abierta', { width: settings?.width, height: settings?.height });
      setCheck('camera', 'ok', settings?.width ? `${settings.width}×${settings.height}` : null);
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); await startPdf417Reader(videoRef.current); }
      setState('scanning');
    } catch (error) { scanLog('error de camara', { error: error instanceof Error ? `${error.name}: ${error.message}` : 'desconocido' }); setCheck('camera', 'fail', 'No se pudo abrir la cámara (¿permiso denegado?)'); setState('camera_error'); }
  };

  if (state === 'idle') return <button type="button" onClick={openCamera} disabled={disabled} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#6F518E] px-4 text-sm font-bold text-white disabled:opacity-50"><Camera size={19} />Escanear DNI</button>;
  if (state === 'camera_error' || state === 'unavailable') return <div className="space-y-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert"><p className="font-bold">{state === 'camera_error' ? 'Necesitamos acceso a la cámara.' : 'No encontramos una cámara disponible.'}</p><p>{state === 'camera_error' ? 'Habilitá el permiso de cámara para verificar tu identidad.' : 'Probá desde un dispositivo con cámara.'}</p><button type="button" onClick={openCamera} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 font-bold"><RotateCcw size={16} />Reintentar</button></div>;
  return <div className="space-y-3"><div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black"><video ref={videoRef} playsInline muted className="h-full w-full object-cover" aria-label="Cámara para escanear el DNI" /><div data-testid="dni-guide-frame" className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 aspect-[1.586/1] -translate-y-1/2 rounded-xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,.38)]" />{state === 'opening' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"><Loader2 className="mr-2 animate-spin" />Abriendo cámara...</div>}</div><p className="min-h-10 text-center text-sm font-semibold text-[#6F518E]" role="status">{state === 'capturing' ? 'Capturando el DNI...' : countdown !== null ? `Mantené el DNI quieto... ${countdown}s` : feedback}</p><DniChecklist title="Estado del escaneo en vivo" items={Object.values(checks)} />{pdf417Detected && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-xs font-bold text-emerald-800">✓ Código PDF417 detectado</p>}{state === 'capturing' && <div className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#6F518E]/10 text-sm font-bold text-[#6F518E]"><Loader2 size={18} className="animate-spin" />Procesando captura...</div>}<button type="button" onClick={() => { stop(); setState('idle'); setCountdown(null); }} className="min-h-11 w-full text-sm font-bold text-[#6F518E]/70">Cancelar</button></div>;
}

function initialChecks(): { camera: DniCheckItem; reader: DniCheckItem; quality: DniCheckItem; barcode: DniCheckItem } {
  return {
    camera: { id: 'camera', label: 'Cámara abierta', status: 'pending' },
    reader: { id: 'reader', label: 'Lector de código de barras iniciado', status: 'pending' },
    quality: { id: 'quality', label: 'Imagen nítida y bien iluminada', status: 'pending' },
    barcode: { id: 'barcode', label: 'Código de barras (PDF417) leído', status: 'pending', detail: 'Mostrá el dorso del DNI y acercalo' },
  };
}

function analyseFrame(video: HTMLVideoElement): { valid: boolean; message: string } {
  const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 100; const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { valid: false, message: 'Ubicá el frente de tu DNI dentro del recuadro.' };
  const cropWidth = video.videoWidth * .84; const cropHeight = Math.min(video.videoHeight * .86, cropWidth / 1.586); const cropX = video.videoWidth * .08; const cropY = (video.videoHeight - cropHeight) / 2;
  context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height); const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0; let sumSquares = 0; let glare = 0; let edges = 0; const luminance: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) { const value = pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114; luminance.push(value); sum += value; sumSquares += value * value; if (value > 248) glare += 1; }
  for (let y = 1; y < canvas.height; y += 1) for (let x = 1; x < canvas.width; x += 1) { const index = y * canvas.width + x; if (Math.abs(luminance[index] - luminance[index - 1]) + Math.abs(luminance[index] - luminance[index - canvas.width]) > 42) edges += 1; }
  const mean = sum / luminance.length; const variance = sumSquares / luminance.length - mean * mean;
  if (mean < 55) return { valid: false, message: 'Necesitamos un poco más de luz.' }; if (glare / luminance.length > .12) return { valid: false, message: 'Hay demasiado reflejo sobre el DNI. Cambiá ligeramente el ángulo.' }; if (variance < 260 || edges < 280) return { valid: false, message: edges < 100 ? 'Ubicá el frente de tu DNI dentro del recuadro.' : 'La imagen está borrosa. Mantené el DNI quieto.' }; return { valid: true, message: 'Mantené el DNI quieto...' };
}
