import { useMemo } from "react";
import { buildTemplatePreviewSpec } from "@/lib/templatePreview";
import type { Block } from "@/lib/googleDocs";

const PAGE_W = 160;
const PAGE_H = 200;
const PAD = 12;
const GAP = 4;

function hexChannel(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function tint(hex: string, ratio: number) {
  const { r, g, b } = hexChannel(hex);
  const mix = (channel: number) => Math.round(channel * ratio + 255 * (1 - ratio));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const TEXT_COLOR = "#e2e8f0";
const TEXT_MUTED_COLOR = "#f1f5f9";
const LABEL_BG = "#f1f5f9";
const BORDER_COLOR = "#e2e8f0";

/**
 * Mini-mockup SVG fiel a la plantilla real: se deriva de los mismos Block[]
 * que arma el Doc (googleDocs.ts), asi que nunca queda desincronizado si se
 * edita una plantilla. No es una captura literal del Doc (eso requeriria
 * infraestructura de Drive que no existe hoy) pero refleja la misma
 * estructura y colores que el builder real produce.
 */
export default function NoteTemplatePreview({
  blocks,
  accent,
  className,
}: {
  blocks: Block[];
  accent: string;
  className?: string;
}) {
  const spec = useMemo(() => buildTemplatePreviewSpec(blocks), [blocks]);

  const elements: React.ReactNode[] = [];
  let y = PAD;
  const usableW = PAGE_W - PAD * 2;
  let key = 0;
  const nextKey = () => key++;

  for (const row of spec.rows) {
    const w = (row.widthPct / 100) * usableW;
    switch (row.kind) {
      case "title":
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={w} height={8} rx={1.5} fill={accent} />);
        y += 8 + GAP;
        break;
      case "subtitle":
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={w} height={3} rx={1} fill={TEXT_MUTED_COLOR} />);
        y += 3 + GAP;
        break;
      case "sectionHeader":
        elements.push(
          <rect key={nextKey()} x={PAD - 3} y={y - 2} width={usableW + 6} height={10} rx={2} fill={tint(accent, 0.14)} />,
        );
        elements.push(<rect key={nextKey()} x={PAD} y={y + 1} width={w * 0.55} height={4} rx={1} fill={accent} />);
        y += 10 + GAP;
        break;
      case "heading":
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={w} height={5} rx={1} fill={accent} />);
        y += 5 + GAP;
        break;
      case "text":
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={w} height={3} rx={1} fill={TEXT_COLOR} />);
        y += 3 + GAP;
        break;
      case "textMuted":
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={w * 0.85} height={2.5} rx={1} fill={TEXT_MUTED_COLOR} />);
        y += 2.5 + GAP;
        break;
      case "checklist":
      case "bullets": {
        const count = row.itemCount || 2;
        for (let i = 0; i < count; i++) {
          if (row.kind === "checklist") {
            elements.push(
              <rect key={nextKey()} x={PAD} y={y} width={4} height={4} rx={0.8} fill="none" stroke={accent} strokeWidth={0.8} />,
            );
          } else {
            elements.push(<circle key={nextKey()} cx={PAD + 2} cy={y + 2} r={1.3} fill={accent} />);
          }
          elements.push(<rect key={nextKey()} x={PAD + 7} y={y + 0.7} width={w * 0.65} height={2.6} rx={1} fill={TEXT_COLOR} />);
          y += 6.5;
        }
        y += GAP;
        break;
      }
    }
  }

  if (spec.hasInfoGrid) {
    const rowH = 8;
    for (let r = 0; r < 3; r++) {
      elements.push(<rect key={nextKey()} x={PAD} y={y} width={usableW * 0.38} height={rowH - 1} fill={LABEL_BG} />);
      elements.push(
        <rect key={nextKey()} x={PAD + usableW * 0.38} y={y} width={usableW * 0.62} height={rowH - 1} fill="white" stroke={BORDER_COLOR} strokeWidth={0.5} />,
      );
      y += rowH;
    }
    y += GAP;
  }

  if (spec.hasTable) {
    const rowH = 8;
    elements.push(<rect key={nextKey()} x={PAD} y={y} width={usableW} height={rowH - 1} fill={accent} />);
    y += rowH;
    for (let r = 0; r < 2; r++) {
      elements.push(
        <rect key={nextKey()} x={PAD} y={y} width={usableW} height={rowH - 1} fill="white" stroke={BORDER_COLOR} strokeWidth={0.5} />,
      );
      y += rowH;
    }
    y += GAP;
  }

  if (spec.hasFooter) {
    const footerY = Math.max(y, PAGE_H - PAD - 4);
    elements.push(<line key={nextKey()} x1={PAD} y1={footerY - 3} x2={PAGE_W - PAD} y2={footerY - 3} stroke={BORDER_COLOR} strokeWidth={0.5} />);
    elements.push(<rect key={nextKey()} x={PAGE_W / 2 - 18} y={footerY} width={36} height={2} rx={1} fill={TEXT_MUTED_COLOR} />);
  }

  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className={className} role="img" aria-label="Vista previa de la plantilla">
      <rect x={0.5} y={0.5} width={PAGE_W - 1} height={PAGE_H - 1} rx={8} fill="white" stroke={BORDER_COLOR} />
      {elements}
    </svg>
  );
}
