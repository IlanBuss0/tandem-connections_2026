import { useMemo, type ReactNode } from "react";
import { selectPreviewBlocks, truncateText } from "@/lib/templatePreview";
import type { Block } from "@/lib/googleDocs";

const PAGE_W = 160;
const PAGE_H = 200;
const PAD = 10;
const USABLE_W = PAGE_W - PAD * 2;
const FONT = "Arial, Helvetica, sans-serif";

function hexChannel(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function tint(hex: string, ratio: number) {
  const { r, g, b } = hexChannel(hex);
  const mix = (channel: number) => Math.round(channel * ratio + 255 * (1 - ratio));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function shade(hex: string, ratio: number) {
  const { r, g, b } = hexChannel(hex);
  const mix = (channel: number) => Math.round(channel * ratio);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

const GRAY_TEXT = "#64748b";
const GRAY_LINE = "#cbd5e1";
const LABEL_BG = "#f1f5f9";
const BORDER_COLOR = "#e2e8f0";

/** ~1.8 unidades de viewBox por caracter en Arial a este tamaño de fuente. */
function charsFor(fontSize: number, widthPx: number) {
  return Math.max(4, Math.floor(widthPx / (fontSize * 0.56)));
}

/**
 * Preview fiel a la plantilla real: renderiza el TEXTO REAL de cada bloque
 * (mismos que usa el builder de Docs en googleDocs.ts) en vez de un mockup
 * abstracto — así se ve nítido y muestra exactamente qué contiene cada
 * plantilla, y nunca se desincroniza si se edita una.
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
  const previewBlocks = useMemo(() => selectPreviewBlocks(blocks), [blocks]);

  const elements: ReactNode[] = [];
  let y = PAD + 2;
  let key = 0;
  const nextKey = () => key++;

  const stop = () => y > PAGE_H - PAD;

  for (const block of previewBlocks) {
    if (stop()) break;
    switch (block.kind) {
      case "title": {
        const fontSize = 8.5;
        elements.push(
          <text key={nextKey()} x={PAD} y={y + fontSize} fontSize={fontSize} fontWeight={700} fill={accent} fontFamily={FONT}>
            {truncateText(block.text, charsFor(fontSize, USABLE_W))}
          </text>,
        );
        y += fontSize + 4;
        if (block.subtitle) {
          const subSize = 5;
          elements.push(
            <text key={nextKey()} x={PAD} y={y + subSize} fontSize={subSize} fill={GRAY_TEXT} fontStyle="italic" fontFamily={FONT}>
              {truncateText(block.subtitle, charsFor(subSize, USABLE_W))}
            </text>,
          );
          y += subSize + 4;
        }
        y += 2;
        break;
      }
      case "heading": {
        const fontSize = block.level === 1 ? 7 : 6;
        elements.push(
          <text key={nextKey()} x={PAD} y={y + fontSize} fontSize={fontSize} fontWeight={700} fill={accent} fontFamily={FONT}>
            {truncateText(block.text, charsFor(fontSize, USABLE_W))}
          </text>,
        );
        y += fontSize + 5;
        break;
      }
      case "sectionHeader": {
        const fontSize = 5.5;
        const bandH = fontSize + 4;
        elements.push(<rect key={nextKey()} x={PAD - 3} y={y - 2} width={USABLE_W + 6} height={bandH} rx={1.5} fill={tint(accent, 0.14)} />);
        elements.push(
          <text key={nextKey()} x={PAD} y={y + fontSize - 0.5} fontSize={fontSize} fontWeight={700} fill={shade(accent, 0.85)} fontFamily={FONT}>
            {truncateText(block.text, charsFor(fontSize, USABLE_W))}
          </text>,
        );
        y += bandH + 4;
        break;
      }
      case "paragraph": {
        const fontSize = 5;
        const text = block.text || "(a completar)";
        elements.push(
          <text
            key={nextKey()}
            x={PAD}
            y={y + fontSize}
            fontSize={fontSize}
            fill={block.muted ? "#94a3b8" : "#475569"}
            fontStyle={block.muted || !block.text ? "italic" : undefined}
            fontFamily={FONT}
          >
            {truncateText(text, charsFor(fontSize, USABLE_W))}
          </text>,
        );
        y += fontSize + 4;
        break;
      }
      case "lines": {
        const count = Math.min(block.count, 3);
        for (let i = 0; i < count; i++) {
          elements.push(<line key={nextKey()} x1={PAD} y1={y + 4} x2={PAGE_W - PAD} y2={y + 4} stroke={GRAY_LINE} strokeWidth={0.5} strokeDasharray="1.5,1.5" />);
          y += 6;
        }
        y += 2;
        break;
      }
      case "checklist":
      case "bullets": {
        const items = block.items.slice(0, 3);
        const fontSize = 5;
        for (const item of items) {
          if (stop()) break;
          if (block.kind === "checklist") {
            elements.push(<rect key={nextKey()} x={PAD} y={y} width={4} height={4} rx={0.7} fill="none" stroke={accent} strokeWidth={0.7} />);
          } else {
            elements.push(<circle key={nextKey()} cx={PAD + 2} cy={y + 2} r={1.2} fill={accent} />);
          }
          const textX = PAD + 7;
          const availableW = USABLE_W - 7;
          if (item) {
            elements.push(
              <text key={nextKey()} x={textX} y={y + fontSize - 0.5} fontSize={fontSize} fill="#475569" fontFamily={FONT}>
                {truncateText(item, charsFor(fontSize, availableW))}
              </text>,
            );
          } else {
            elements.push(<line key={nextKey()} x1={textX} y1={y + 3} x2={textX + availableW * 0.6} y2={y + 3} stroke={GRAY_LINE} strokeWidth={0.5} strokeDasharray="1.5,1.5" />);
          }
          y += 7;
        }
        y += 2;
        break;
      }
      case "infoGrid": {
        const rowH = 7;
        const fontSize = 4.3;
        const labelW = USABLE_W * 0.34;
        for (const [label, value] of block.rows.slice(0, 4)) {
          if (stop()) break;
          elements.push(<rect key={nextKey()} x={PAD} y={y} width={labelW} height={rowH - 1} fill={LABEL_BG} />);
          elements.push(<rect key={nextKey()} x={PAD + labelW} y={y} width={USABLE_W - labelW} height={rowH - 1} fill="white" stroke={BORDER_COLOR} strokeWidth={0.4} />);
          elements.push(
            <text key={nextKey()} x={PAD + 2} y={y + rowH - 2.3} fontSize={fontSize} fontWeight={600} fill="#475569" fontFamily={FONT}>
              {truncateText(label, charsFor(fontSize, labelW - 3))}
            </text>,
          );
          elements.push(
            <text key={nextKey()} x={PAD + labelW + 2} y={y + rowH - 2.3} fontSize={fontSize} fill="#334155" fontFamily={FONT}>
              {truncateText(value || "—", charsFor(fontSize, USABLE_W - labelW - 3))}
            </text>,
          );
          y += rowH;
        }
        y += 3;
        break;
      }
      case "table": {
        const rowH = 7;
        const fontSize = 4.2;
        const cols = block.header.length || 1;
        const colW = USABLE_W / cols;
        elements.push(<rect key={nextKey()} x={PAD} y={y} width={USABLE_W} height={rowH - 1} fill={accent} />);
        block.header.forEach((label, colIndex) => {
          elements.push(
            <text key={nextKey()} x={PAD + colIndex * colW + 1.5} y={y + rowH - 2.5} fontSize={fontSize} fontWeight={700} fill="white" fontFamily={FONT}>
              {truncateText(label, charsFor(fontSize, colW - 2))}
            </text>,
          );
        });
        y += rowH;
        for (const row of block.rows.slice(0, 2)) {
          if (stop()) break;
          elements.push(<rect key={nextKey()} x={PAD} y={y} width={USABLE_W} height={rowH - 1} fill="white" stroke={BORDER_COLOR} strokeWidth={0.4} />);
          row.slice(0, cols).forEach((cell, colIndex) => {
            elements.push(
              <text key={nextKey()} x={PAD + colIndex * colW + 1.5} y={y + rowH - 2.5} fontSize={fontSize} fill="#475569" fontFamily={FONT}>
                {truncateText(cell || "—", charsFor(fontSize, colW - 2))}
              </text>,
            );
          });
          y += rowH;
        }
        y += 3;
        break;
      }
      case "footer": {
        const footerY = Math.max(y, PAGE_H - PAD - 6);
        const fontSize = 4;
        elements.push(<line key={nextKey()} x1={PAD} y1={footerY - 3} x2={PAGE_W - PAD} y2={footerY - 3} stroke={BORDER_COLOR} strokeWidth={0.5} />);
        elements.push(
          <text key={nextKey()} x={PAGE_W / 2} y={footerY + 1} fontSize={fontSize} fill="#94a3b8" fontStyle="italic" textAnchor="middle" fontFamily={FONT}>
            {truncateText(block.text, charsFor(fontSize, USABLE_W))}
          </text>,
        );
        y = PAGE_H;
        break;
      }
    }
  }

  return (
    <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} className={className} role="img" aria-label="Vista previa de la plantilla">
      <rect x={0.5} y={0.5} width={PAGE_W - 1} height={PAGE_H - 1} rx={8} fill="white" stroke={BORDER_COLOR} />
      {elements}
    </svg>
  );
}
