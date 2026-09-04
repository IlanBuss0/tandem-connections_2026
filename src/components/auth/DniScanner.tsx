import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, RotateCcw } from 'lucide-react';

type ScannerState = 'idle' | 'opening' | 'scanning' | 'ready' | 'camera_error' | 'unavailable';

export function DniScanner({ onCapture, disabled = false }: { onCapture: (file: File) => void; disabled?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<ScannerState>('idle');
  const [feedback, setFeedback] = useState('Ubicá tu DNI dentro del recuadro.');
  const [stableFrames, setStableFrames] = useState(0);

  const stop = () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stop(), []);

  useEffect(() => {
    if (state !== 'scanning' && state !== 'ready') return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      const quality = analyseFrame(video);
      setFeedback(quality.message);
      setStableFrames(previous => {
        const next = quality.valid ? Math.min(previous + 1, 3) : 0;
        if (next === 3) setState('ready');
        else if (!quality.valid) setState('scanning');
        return next;
      });
    }, 450);
    return () => window.clearInterval(timer);
  }, [state]);

  const openCamera = async () => {
    stop();
    setState('opening');
    setStableFrames(0);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unavailable');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('scanning');
    } catch {
      setState('camera_error');
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || state !== 'ready') return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      stop();
      onCapture(new File([blob], `dni-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      setState('idle');
    }, 'image/jpeg', 0.9);
  };

  if (state === 'idle') return <button type="button" onClick={openCamera} disabled={disabled} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#6F518E] px-4 text-sm font-bold text-white disabled:opacity-50"><Camera size={19} />Escanear DNI</button>;
  if (state === 'camera_error' || state === 'unavailable') return <div className="space-y-3 rounded-2xl bg-red-50 p-4 text-sm text-red-800" role="alert"><p className="font-bold">{state === 'camera_error' ? 'No pudimos acceder a tu cámara.' : 'No encontramos una cámara disponible.'}</p><p>{state === 'camera_error' ? 'Para verificar tu DNI necesitás habilitar el acceso a la cámara.' : 'Probá desde un dispositivo con cámara.'}</p><button type="button" onClick={openCamera} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 font-bold"><RotateCcw size={16} />Reintentar</button></div>;

  return <div className="space-y-3">
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <video ref={videoRef} playsInline muted className="h-full w-full object-cover" aria-label="Cámara para escanear el DNI" />
      <div data-testid="dni-guide-frame" className="pointer-events-none absolute left-[8%] right-[8%] top-1/2 aspect-[1.586/1] -translate-y-1/2 rounded-xl border-2 border-white shadow-[0_0_0_999px_rgba(0,0,0,.38)]" />
      {state === 'opening' && <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white"><Loader2 className="mr-2 animate-spin" />Abriendo cámara...</div>}
    </div>
    <p className="min-h-10 text-center text-sm font-semibold text-[#6F518E]" role="status">{state === 'ready' ? 'DNI estable y bien encuadrado. Ya podés capturarlo.' : feedback}</p>
    <button type="button" onClick={capture} disabled={state !== 'ready' || disabled} className="min-h-12 w-full rounded-[10px] bg-[#6F518E] px-4 text-sm font-bold text-white disabled:opacity-45">Capturar y verificar {stableFrames > 0 && state !== 'ready' ? `(${stableFrames}/3)` : ''}</button>
    <button type="button" onClick={() => { stop(); setState('idle'); }} className="min-h-11 w-full text-sm font-bold text-[#6F518E]/70">Cancelar</button>
  </div>;
}

function analyseFrame(video: HTMLVideoElement): { valid: boolean; message: string } {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 100;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return { valid: false, message: 'Ubicá tu DNI dentro del recuadro.' };
  const cropWidth = video.videoWidth * .84;
  const cropHeight = Math.min(video.videoHeight * .86, cropWidth / 1.586);
  const cropX = video.videoWidth * .08;
  const cropY = (video.videoHeight - cropHeight) / 2;
  context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0; let sumSquares = 0; let glare = 0; let edges = 0; let minX = canvas.width; let maxX = 0; let minY = canvas.height; let maxY = 0;
  const luminance: number[] = [];
  for (let index = 0; index < pixels.length; index += 4) {
    const value = pixels[index] * .299 + pixels[index + 1] * .587 + pixels[index + 2] * .114;
    luminance.push(value); sum += value; sumSquares += value * value;
    if (value > 248) glare += 1;
  }
  for (let y = 1; y < canvas.height; y += 1) for (let x = 1; x < canvas.width; x += 1) {
    const index = y * canvas.width + x;
    if (Math.abs(luminance[index] - luminance[index - 1]) + Math.abs(luminance[index] - luminance[index - canvas.width]) > 42) {
      edges += 1; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  const mean = sum / luminance.length;
  const variance = sumSquares / luminance.length - mean * mean;
  if (mean < 55) return { valid: false, message: 'Necesitamos un poco más de luz.' };
  if (glare / luminance.length > .12) return { valid: false, message: 'Hay demasiado reflejo sobre el DNI. Cambiá ligeramente el ángulo.' };
  if (variance < 260 || edges < 280) return { valid: false, message: edges < 100 ? 'Ubicá tu DNI dentro del recuadro.' : 'La imagen está borrosa. Mantené el DNI quieto.' };
  if (maxX - minX < canvas.width * .58 || maxY - minY < canvas.height * .5) return { valid: false, message: 'Acercá un poco el DNI.' };
  if (minX < 3 || maxX > canvas.width - 4 || minY < 3 || maxY > canvas.height - 4) return { valid: false, message: 'Alejá el DNI para que podamos verlo completo.' };
  return { valid: true, message: 'Mantenelo quieto un momento.' };
}
