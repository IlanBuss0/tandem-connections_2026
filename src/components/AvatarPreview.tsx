import { AvatarEquipped } from '@/contexts/WalletContext';
import { getItemById } from '@/data/shopItems';
import avatarBase from '@/assets/avatar-base.png';

interface Props {
  equipped: AvatarEquipped;
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

export default function AvatarPreview({ equipped, size = 120, showBackground = true, className = '' }: Props) {
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
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />

      {/* Tint de la ropa (sobre el torso, mitad inferior) */}
      {shirtTint !== 'transparent' && !isRainbow && (
        <div
          className="absolute left-[20%] right-[20%] bottom-[5%] top-[55%] rounded-b-3xl mix-blend-multiply pointer-events-none"
          style={{ background: shirtTint }}
        />
      )}
      {isRainbow && (
        <div
          className="absolute left-[20%] right-[20%] bottom-[5%] top-[55%] rounded-b-3xl mix-blend-multiply pointer-events-none opacity-70"
          style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b, #eab308, #22c55e, #3b82f6, #8b5cf6)' }}
        />
      )}

      {/* Pelo / sombrero */}
      {hair && (
        <span
          className="absolute pointer-events-none select-none"
          style={{ top: '-2%', left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.36, lineHeight: 1 }}
          aria-hidden
        >
          {hair.emoji}
        </span>
      )}

      {/* Accesorio (a la altura de la cara) */}
      {acc && (
        <span
          className="absolute pointer-events-none select-none"
          style={{ top: '32%', left: '50%', transform: 'translateX(-50%)', fontSize: size * 0.28, lineHeight: 1 }}
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
