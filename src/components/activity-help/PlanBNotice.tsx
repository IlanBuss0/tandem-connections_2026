import { X } from 'lucide-react';

interface Props {
  text: string;
  onClose: () => void;
}

export default function PlanBNotice({ text, onClose }: Props) {
  return (
    <div role="note" className="flex items-start gap-3 rounded-2xl border border-[#A8E3C9] bg-[#DCF5EA] p-4">
      <span className="text-2xl leading-none" aria-hidden>💡</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#0B6B4A]">Plan B</p>
        <p className="mt-0.5 text-base font-semibold leading-snug text-[#134E3A]">{text}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar Plan B"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0B6B4A] hover:bg-white/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
