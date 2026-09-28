import { Clipboard, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type CopyFieldProps = { label: string; value: string; inputClassName: string; onCopy: (value: string, label: string) => void };

function CopyField({ label, value, inputClassName, onCopy }: CopyFieldProps) {
  return (
    <div>
      <p className="text-[11px] font-extrabold uppercase tracking-[.06em] text-[var(--evo-text-secondary)]">{label}</p>
      <div className="mt-1 flex gap-2">
        <Input readOnly value={value} aria-label={label} className={cn('min-w-0 rounded-xl border-[var(--evo-border-1)]', inputClassName)} />
        <Button type="button" variant="outline" onClick={() => onCopy(value, label)} className="min-h-11 shrink-0 gap-2 rounded-xl border-[var(--evo-border-1)] text-[var(--evo-primary-text)]">
          <Clipboard size={15} aria-hidden />
          Copiar
        </Button>
      </div>
    </div>
  );
}

type Props = {
  codigo: string;
  url: string;
  expiresAt: string;
  qrDataUrl: string;
  qrAlt: string;
  suffix?: string;
  onCopy: (value: string, label: string) => void;
};

export default function InvitePanel({ codigo, url, expiresAt, qrDataUrl, qrAlt, suffix = '', onCopy }: Props) {
  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <div className="min-w-[14rem] flex-1 space-y-3">
        <CopyField label={`Código${suffix}`} value={codigo} inputClassName="font-mono text-lg font-bold tracking-[0.18em]" onCopy={onCopy} />
        <CopyField label={`Link QR${suffix}`} value={url} inputClassName="font-mono text-xs" onCopy={onCopy} />
        <p className="text-xs text-[var(--evo-text-secondary)]">Expira: {new Date(expiresAt).toLocaleString('es-AR')}</p>
      </div>
      <div className="flex min-h-[200px] w-full items-center justify-center rounded-2xl border border-[var(--evo-border-1)] bg-white p-3 sm:w-[224px]">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={qrAlt} className="h-[200px] w-[200px]" />
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--evo-text-secondary)]">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Generando QR
          </div>
        )}
      </div>
    </div>
  );
}
