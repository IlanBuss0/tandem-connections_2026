import { UserRound } from 'lucide-react';

type HeaderUserAvatarProps = {
  avatar?: string | null;
  name?: string | null;
};

function isImageAvatar(value: string) {
  return /^(https?:|data:image\/|\/|\.\/|\.\.\/)/.test(value) || /\.(png|jpe?g|webp|gif|svg)$/i.test(value);
}

export default function HeaderUserAvatar({ avatar, name }: HeaderUserAvatarProps) {
  const cleanAvatar = avatar?.trim();

  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-lg font-semibold text-muted-foreground"
      aria-label={name ? `Avatar de ${name}` : 'Avatar de usuario'}
      title={name || 'Usuario'}
    >
      {cleanAvatar && isImageAvatar(cleanAvatar) ? (
        <img src={cleanAvatar} alt="" className="h-full w-full object-cover" />
      ) : cleanAvatar ? (
        <span aria-hidden>{cleanAvatar}</span>
      ) : (
        <UserRound size={21} aria-hidden />
      )}
    </div>
  );
}
