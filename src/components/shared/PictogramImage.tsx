import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';

type PictogramImageProps = {
  url?: string | null;
  alt: string;
  imageClassName: string;
  fallbackClassName: string;
};

export default function PictogramImage({ url, alt, imageClassName, fallbackClassName }: PictogramImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [url]);

  if (url && !imageFailed) {
    return <img src={url} alt={alt} className={imageClassName} loading="lazy" onError={() => setImageFailed(true)} />;
  }
  return <CalendarDays className={fallbackClassName} aria-hidden />;
}
