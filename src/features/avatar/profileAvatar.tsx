import { renderToStaticMarkup } from 'react-dom/server';
import AvatarRenderer from './AvatarRenderer';
import { defaultAvatar, AvatarConfig } from './avatarCatalog';
import { readAvatarConfig } from './avatarStorage';
import type { Avatar } from '@/types/database';

export function isCustomProfilePhoto(url?: string | null) {
  return !!url && /^(https?:\/\/|\/|data:image\/(png|jpeg|webp|gif);)/i.test(url)
    && !/dicebear|\/pertenecientes\/[^/]+\/avatar-[^/]+\.(png|jpg)/i.test(url);
}
export function avatarDataUrl(config: AvatarConfig = defaultAvatar) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderToStaticMarkup(<AvatarRenderer config={config} portrait decorative />));
}
export function profileAvatarUrl(record?: Avatar | null) {
  const source=record?.avatar_imagen_origen_url;
  if (isCustomProfilePhoto(source)) return source!;
  if (!source && !record?.avatar_imagen_path && isCustomProfilePhoto(record?.avatar_imagen_url)) return record!.avatar_imagen_url!;
  return avatarDataUrl(readAvatarConfig(record?.avatar_json));
}
