import { AvatarConfig, defaultAvatar } from '@/features/avatar/avatarCatalog';
import AvatarRenderer from '@/features/avatar/AvatarRenderer';
import { isCustomProfilePhoto } from '@/features/avatar/profileAvatar';
import { useState } from 'react';
interface Props {config?:AvatarConfig; photo?:string|null; size?:number; portrait?:boolean;className?:string}
export default function AvatarPreview({config=defaultAvatar,photo,size=120,portrait=true,className=''}:Props) {
  const [failedPhoto,setFailedPhoto]=useState<string|null>(null);
  return <div className={'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f1eaf8] '+className} style={{width:size,height:size}} aria-label="Avatar del perteneciente">
    {isCustomProfilePhoto(photo)&&failedPhoto!==photo?<img src={photo!} alt="" onError={()=>setFailedPhoto(photo!)} className="h-full w-full object-cover"/>:<AvatarRenderer config={config} portrait={portrait} decorative className="h-full w-full"/>}
  </div>;
}
