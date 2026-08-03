import { useRef, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { shouldAcceptTouch } from '@/lib/touchGuard';
import SpeakButton from '@/components/SpeakButton';

// Unica responsabilidad: el atomo visual de UN pictograma (Sesion 10) —
// imagen o fallback (emoji/icono), etiqueta, tamaño, hablar-al-tocar. La
// regla de confianza vive ACA, en un solo lugar: si no hay imageUrl, cae al
// fallback sin marca ni hueco (la misma regla que RoutinePictogram/
// EventPictogram ya aplicaban por separado — esta es la version compartida
// para superficies nuevas, como las tarjetas de autonomia).
//
// Lee el tamaño de accesibilidad (item 47) directo del contexto: asi
// cualquier pantalla que use PictogramTile respeta el tamaño elegido sin
// tener que pasarlo a mano en cada lugar.
const SIZE_CLASSES = {
  sm: { box: 'h-10 w-10', emoji: 'text-2xl', label: 'text-[10px]' },
  md: { box: 'h-16 w-16', emoji: 'text-4xl', label: 'text-xs' },
  lg: { box: 'h-24 w-24', emoji: 'text-6xl', label: 'text-sm' },
} as const;

export interface PictogramTileProps {
  imageUrl?: string | null;
  name?: string;
  fallback: React.ReactNode;
  label?: string;
  onClick?: () => void;
  speakText?: string;
  className?: string;
}

export default function PictogramTile({ imageUrl, name, fallback, label, onClick, speakText, className = '' }: PictogramTileProps) {
  const { settings } = useAccessibility();
  const [imageFailed, setImageFailed] = useState(false);
  const size = SIZE_CLASSES[settings.pictogramSize] || SIZE_CLASSES.md;
  const isInteractive = Boolean(onClick);
  const lastAcceptedTouchRef = useRef<number | null>(null);

  // Item 46 "anti-toque accidental": si esta activo, un toque que llega
  // demasiado rapido despues del anterior EN ESTE MISMO tile se descarta.
  // Deliberadamente por-tile (no global): no queremos que tocar dos
  // pictogramas distintos y rapido se sienta trabado.
  const handleClick = onClick
    ? () => {
        if (settings.accidentalTouchProtection) {
          const now = Date.now();
          if (!shouldAcceptTouch(lastAcceptedTouchRef.current, now)) return;
          lastAcceptedTouchRef.current = now;
        }
        onClick();
      }
    : undefined;

  const Wrapper = isInteractive ? 'button' : 'div';

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <Wrapper
        type={isInteractive ? 'button' : undefined}
        onClick={handleClick}
        // Contrato de scan (para el barrido/switch access de la Sesion 22):
        // todo tile interactivo es un boton real, recorrible por teclado
        // sin trucos, con foco visible nativo.
        className={`flex items-center justify-center rounded-2xl border-2 bg-white ${size.box} ${
          isInteractive ? 'cursor-pointer border-[#d8c7ef] hover:border-[#6b4c9a] focus-visible:ring-2 focus-visible:ring-[#6b4c9a]' : 'border-[#ede4f8]'
        }`}
      >
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={name || label || ''}
            className="h-full w-full object-contain p-1"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={size.emoji}>{fallback}</span>
        )}
      </Wrapper>
      {label && (
        <div className="flex items-center gap-1">
          <span className={`font-medium text-[#4a4a5a] ${size.label}`}>{label}</span>
          {speakText && <SpeakButton text={speakText} size={10} />}
        </div>
      )}
    </div>
  );
}
