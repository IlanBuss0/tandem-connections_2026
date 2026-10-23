import { CSSProperties, useId } from 'react';
import { AvatarCategory, AvatarConfig, avatarItem, validateAvatar } from './avatarCatalog';
import { accessoryLayers, BackHairLayer, BodyLayer, bottomLayers, FaceLayer, hairLayers, LayerProps, shoeLayers, topLayers } from './AvatarLayers';

const crops: Partial<Record<AvatarCategory, string>> = {
  base: '0 0 300 600', skinTone: '88 28 125 160', hairstyle: '78 -8 158 252', hairColor: '78 -8 158 252',
  eyeColor: '101 88 99 57', top: '65 175 170 185', bottom: '91 326 110 220',
  shoes: '64 522 168 60', accessory: '85 18 135 232',
};
function shade(color: string, amount: number) {
  return '#'+[1,3,5].map(index=>Math.max(0,Math.min(255,parseInt(color.slice(index,index+2),16)+amount)).toString(16).padStart(2,'0')).join('');
}

interface Props { config: AvatarConfig; category?: AvatarCategory; portrait?: boolean; decorative?: boolean; className?: string }

export default function AvatarRenderer({ config: input, category, portrait = false, decorative = false, className }: Props) {
  const id = `avatar-${useId().replace(/:/g, '')}`;
  const config = validateAvatar(input);
  const props: LayerProps = {
    id, skin: avatarItem(config, 'skinTone').color!, hair: avatarItem(config, 'hairColor').color!, eyes: avatarItem(config, 'eyeColor').color!,
    base: config.base, hairstyle: avatarItem(config,'hairstyle').resource, underCap: avatarItem(config,'accessory').resource==='cap',
  };
  const clothing = [
    { item: avatarItem(config, 'bottom'), layers: bottomLayers },
    { item: avatarItem(config, 'shoes'), layers: shoeLayers },
    { item: avatarItem(config, 'top'), layers: topLayers },
  ].sort((a, b) => a.item.renderOrder - b.item.renderOrder);
  return <svg xmlns="http://www.w3.org/2000/svg" data-base={config.base} viewBox={portrait ? '70 -5 160 205' : category ? crops[category] : '0 0 300 600'} className={className}
    role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-labelledby={decorative ? undefined : `${id}-title`}>
    {!decorative && <title id={`${id}-title`}>{'Tu personaje de cuerpo completo: '+['base', 'hairstyle', 'top', 'bottom', 'shoes', 'accessory'].map(key => avatarItem(config, key as AvatarCategory).name).join(', ')}</title>}
    <defs>
      <clipPath id={`${id}-head-preview`}><path d="M70 0H235V180H70Z"/></clipPath>
      <clipPath id={`${id}-cap-hair`}><path d="M50 84Q150 73 245 88L250 260 50 260Z"/></clipPath>
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2=".7"><stop stopColor={props.skin} /><stop offset="1" stopColor={{ porcelain: '#dcb297', warm: '#bd825f', brown: '#8e593e', deep: '#543328' }[config.skinTone]} /></linearGradient>
      {['cloth','tee','jacket'].map(name=><linearGradient key={name} id={`${id}-${name}`} x1="0" y1="0" x2="1" y2=".8"><stop stopColor={avatarItem(config,'top').color}/><stop offset="1" stopColor={avatarItem(config,'top').color} stopOpacity=".85"/></linearGradient>)}
    </defs>
    {!category && <ellipse cx="150" cy="571" rx="77" ry="9" fill="#53446b" opacity=".1" />}
    <BackHairLayer {...props} />
    <g clipPath={category==='hairstyle'?`url(#${id}-head-preview)`:undefined}><BodyLayer {...props} /></g>
    {category!=='hairstyle'&&clothing.map(({ item, layers }) => <g key={item.category} data-item={item.id} color={item.color}
      style={{'--avatar-detail':shade(item.color!, -25),'--avatar-highlight':shade(item.color!,35)} as CSSProperties}>
      {layers[item.resource]?.(props)}
      {item.id==='tee-rainbow'&&<g fill="none" strokeWidth="4"><path d="M128 237Q150 211 173 237" stroke="#ce827c"/><path d="M131 242Q150 220 170 242" stroke="#e0bb72"/><path d="M135 247Q150 229 166 247" stroke="#6c9b91"/></g>}
    </g>)}
    <FaceLayer {...props} />
    {hairLayers[avatarItem(config, 'hairstyle').resource]?.(props)}
    <g color={avatarItem(config,'accessory').color}>{accessoryLayers[avatarItem(config, 'accessory').resource]?.(props)}</g>
  </svg>;
}
