import { AvatarAppearance, AvatarEquipped } from '@/contexts/WalletContext';
import { getItemById } from '@/data/shopItems';
import avatarBase from '@/assets/avatar-base.png';

interface Props {
  equipped: AvatarEquipped;
  appearance?: AvatarAppearance;
  size?: number;          // px
  showBackground?: boolean;
  className?: string;
}

const BG_GRADIENTS: Record<string, string> = {
  'bg-default': 'linear-gradient(135deg, hsl(210 33% 98%), hsl(210 20% 94%))',
  'bg-stars':   'linear-gradient(135deg, hsl(240 60% 25%), hsl(270 50% 35%))',
  'bg-beach':   'linear-gradient(180deg, hsl(200 80% 80%) 0%, hsl(45 90% 85%) 100%)',
  'bg-forest':  'linear-gradient(135deg, hsl(150 50% 75%), hsl(120 40% 55%))',
  'bg-space':   'linear-gradient(135deg, hsl(260 60% 15%), hsl(220 70% 25%))',
};

const SHIRT_TINT: Record<string, string> = {
  'shirt-blue':    'transparent',
  'shirt-red':     'hsl(0 70% 55% / 0.55)',
  'shirt-green':   'hsl(140 55% 45% / 0.55)',
  'shirt-purple':  'hsl(270 50% 60% / 0.55)',
  'shirt-rainbow': 'transparent',
};

const SKIN_TINT: Record<AvatarAppearance['colorPiel'], string> = {
  claro: 'hsl(31 72% 82% / 0.42)',
  medio: 'transparent',
  oscuro: 'hsl(24 45% 42% / 0.42)',
};

const FACE_SHAPE: Record<AvatarAppearance['formaCara'], string> = {
  redonda: '45% 45% 48% 48%',
  ovalada: '48% 48% 42% 42%',
  cuadrada: '35% 35% 42% 42%',
};

const HAIR_PREVIEW: Record<AvatarAppearance['peinado'], string> = {
  corto: '▰',
  largo: '▾',
  rizado: '●',
  rapado: '▬',
};

const HAIR_STYLE: Record<AvatarAppearance['peinado'], { top: string; fontSize: number; opacity: number }> = {
  corto: { top: '11%', fontSize: 0.28, opacity: 0.9 },
  largo: { top: '8%', fontSize: 0.38, opacity: 0.9 },
  rizado: { top: '9%', fontSize: 0.34, opacity: 0.85 },
  rapado: { top: '14%', fontSize: 0.2, opacity: 0.65 },
};

const DEFAULT_APPEARANCE: AvatarAppearance = {
  genero: 'neutral',
  colorPiel: 'medio',
  formaCara: 'redonda',
  peinado: 'corto',
};

export default function AvatarPreview({ equipped, appearance = DEFAULT_APPEARANCE, size = 120, showBackground = true, className = '' }: Props) {
  const hair = getItemById(equipped.pelo);
  const acc = getItemById(equipped.accesorio);
  const shirt = getItemById(equipped.ropa);
  const pet = getItemById(equipped.mascota);
  const bg = equipped.fondo ?? 'bg-default';

  const bgStyle = showBackground
    ? { background: BG_GRADIENTS[bg] ?? BG_GRADIENTS['bg-default'] }
    : {};

  const shirtTint = shirt ? SHIRT_TINT[shirt.id] : 'transparent';
  const isRainbow = shirt?.id === 'shirt-rainbow';
  const skinTint = SKIN_TINT[appearance.colorPiel];
  const faceShape = FACE_SHAPE[appearance.formaCara];
  const hairVisual = HAIR_PREVIEW[appearance.peinado];
  const hairPreviewStyle = HAIR_STYLE[appearance.peinado];
  const hairColor = appearance.genero === 'femenino'
    ? 'hsl(28 55% 26%)'
    : appearance.genero === 'masculino'
      ? 'hsl(218 28% 22%)'
      : 'hsl(32 36% 30%)';

  return (
    <div
      className={`relative inline-block rounded-2xl overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, ...bgStyle }}
      aria-label="Avatar del usuario"
    >
      {/* Avatar base */}
      <img
        src={avatarBase}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="absolute left-1/2 top-1/2 h-[128%] w-[128%] -translate-x-1/2 -translate-y-[46%] object-contain select-none pointer-events-none"
        draggable={false}
      />

      {skinTint !== 'transparent' && (
        <>
          <div
            className="absolute left-[33%] right-[33%] top-[25%] bottom-[45%] mix-blend-multiply pointer-events-none"
            style={{ background: skinTint, borderRadius: faceShape }}
          />
          <div
            className="absolute left-[31%] right-[31%] top-[50%] bottom-[19%] rounded-t-2xl mix-blend-multiply pointer-events-none"
            style={{ background: skinTint }}
          />
        </>
      )}

      <span
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          top: hairPreviewStyle.top,
          color: hairColor,
          fontSize: size * hairPreviewStyle.fontSize,
          lineHeight: 1,
          opacity: hairPreviewStyle.opacity,
          textShadow: '0 1px 0 hsl(0 0% 100% / 0.3)',
        }}
        aria-hidden
      >
        {hairVisual}
      </span>

      {/* Tint de la ropa (sobre el torso, mitad inferior) */}
      {shirtTint !== 'transparent' && !isRainbow && (
        <div
          className="absolute left-[18%] right-[18%] bottom-[0%] top-[58%] rounded-b-3xl mix-blend-multiply pointer-events-none"
          style={{ background: shirtTint }}
        />
      )}
      {isRainbow && (
        <div
          className="absolute left-[18%] right-[18%] bottom-[0%] top-[58%] rounded-b-3xl mix-blend-multiply pointer-events-none opacity-70"
          style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6)' }}
        />
      )}

      {/* Pelo / sombrero */}
      {hair && (
        <span
          className="absolute pointer-events-none select-none"
          style={{ top: '1%', left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.34, lineHeight: 1 }}
          aria-hidden
        >
          {hair.emoji}
        </span>
      )}

      {/* Accesorio (a la altura de la cara) */}
      {acc && (
        <span
          className="absolute pointer-events-none select-none"
          style={{ top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.26, lineHeight: 1 }}
          aria-hidden
        >
          {acc.emoji}
        </span>
      )}

      {/* Mascota (esquina inferior derecha) */}
      {pet && (
        <span
          className="absolute pointer-events-none select-none drop-shadow"
          style={{ bottom: '4%', right: '4%', fontSize: size * 0.28, lineHeight: 1 }}
          aria-hidden
        >
          {pet.emoji}
        </span>
      )}
    </div>
  );
}
