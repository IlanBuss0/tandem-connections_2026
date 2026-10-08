import type { ReactNode } from 'react';
import { AgendaSheet } from '@/components/agenda/AgendaSheet';

type ReportReaderProps = {
  title: string;
  subtitle: string;
  content: string;
  onClose: () => void;
  footer: ReactNode;
  notice?: ReactNode;
  afterContent?: ReactNode;
};

export default function ReportReader({ title, subtitle, content, onClose, footer, notice, afterContent }: ReportReaderProps) {
  return (
    <AgendaSheet large title={title} subtitle={subtitle} onClose={onClose} footer={footer}>
      {notice}
      <div className="whitespace-pre-wrap rounded-2xl bg-[#F5EFFC] p-4 text-sm leading-relaxed text-[#2b2145]">{content}</div>
      {afterContent}
    </AgendaSheet>
  );
}
