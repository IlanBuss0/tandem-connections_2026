import { useRef, useState, useCallback } from 'react';
import { Paperclip, X, File as FileIcon, Image as ImageIcon, Loader2 } from 'lucide-react';
import { tandemApi } from '../services/api/tandem-api';

interface FileUploadProps {
  onUploadStart?: () => void;
  onUploadComplete?: (result: { id: number; url: string; nombre_archivo: string; content_type: string; peso_bytes: number }) => void;
  onUploadError?: (error: Error) => void;
  accept?: string;
  maxSizeMB?: number;
  idTipoArchivo?: number;
  buttonLabel?: string;
  buttonClassName?: string;
  showPreview?: boolean;
}

export default function FileUpload({
  onUploadStart,
  onUploadComplete,
  onUploadError,
  accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp,application/pdf',
  maxSizeMB = 10,
  idTipoArchivo,
  buttonLabel,
  buttonClassName = '',
  showPreview = true,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      onUploadError?.(new Error(`El archivo excede el limite de ${maxSizeMB}MB.`));
      return;
    }

    if (showPreview && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    setUploading(true);
    setProgress(0);
    onUploadStart?.();

    try {
      const result = idTipoArchivo
        ? await tandemApi.archivos.uploadWithType(file, idTipoArchivo, setProgress)
        : await tandemApi.archivos.upload(file, setProgress);
      onUploadComplete?.(result);
    } catch (error) {
      onUploadError?.(error instanceof Error ? error : new Error('Error al subir archivo'));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [maxSizeMB, showPreview, idTipoArchivo, onUploadStart, onUploadComplete, onUploadError]);

  const clearPreview = useCallback(() => {
    setPreview(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  }, []);

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {preview && showPreview ? (
        <div className="relative inline-block">
          {fileTypeIcon(preview)}
          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded">
              <Loader2 className="animate-spin text-white" size={20} />
            </div>
          ) : (
            <button
              type="button"
              onClick={clearPreview}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              aria-label="Quitar archivo"
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : null}
      {uploading && (
        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={buttonClassName || 'w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors'}
        aria-label={buttonLabel || 'Adjuntar archivo'}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
      </button>
    </div>
  );
}

function fileTypeIcon(previewUrl: string | null) {
  if (previewUrl?.startsWith('data:image/') || previewUrl?.startsWith('blob:')) {
    return <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded-md border border-border" />;
  }
  return <FileIcon size={20} />;
}
