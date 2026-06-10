import { AvatarAppearance, AvatarEquipped } from '@/contexts/WalletContext';
import { getItemById } from '@/data/shopItems';
import { buildDiceBearAvatarUrl } from '@/lib/dicebearAvatar';

interface Props {
  equipped: AvatarEquipped;
  appearance?: AvatarAppearance;
  size?: number;
  showBackground?: boolean;
  className?: string;
  seed?: string;
}

const DEFAULT_APPEARANCE: AvatarAppearance = {
  genero: 'neutral',
  colorPiel: 'medio',
  formaCara: 'redonda',
  peinado: 'corto',
  colorPelo: 'castanio',
  expresion: 'feliz',
};

export default function AvatarPreview({
  equipped,
  appearance = DEFAULT_APPEARANCE,
  size = 120,
  showBackground = true,
  className = '',
  seed = 'tandem-avatar',
}: Props) {
  const pet = getItemById(equipped.mascota);
  const hat = getItemById(equipped.pelo);
  const avatarUrl = buildDiceBearAvatarUrl(appearance, equipped, seed);

  return (
    <div
      className={`relative inline-block shrink-0 overflow-hidden rounded-2xl bg-muted ${className}`}
      style={{ width: size, height: size }}
      aria-label="Avatar del usuario"
    >
      <img
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="absolute inset-0 h-full w-full select-none object-cover pointer-events-none"
        draggable={false}
      />

      {!showBackground && (
        <div className="absolute inset-0 -z-10 bg-transparent" />
      )}

      {hat && (
        <span
          className="absolute left-1/2 top-[2%] -translate-x-1/2 select-none pointer-events-none drop-shadow"
          style={{ fontSize: size * 0.24, lineHeight: 1 }}
          aria-hidden
        >
          {hat.emoji}
        </span>
      )}

      {pet && (
        <span
          className="absolute bottom-[3%] right-[3%] select-none pointer-events-none drop-shadow"
          style={{ fontSize: size * 0.24, lineHeight: 1 }}
          aria-hidden
        >
          {pet.emoji}
        </span>
      )}
    </div>
  );
}
