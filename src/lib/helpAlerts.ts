import type { Notification } from '@/data/api';

export type HelpReason = 'ayuda' | 'no_entiende' | 'pausa' | 'tarjeta';

const HELP_PREFIX = 'activity_help';
const HELP_CARD_SCAN = 'help_card_scan';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

function isHelpCardScan(notification: Pick<Notification, 'referenceType'>): boolean {
  return notification.referenceType === HELP_CARD_SCAN;
}

export function isHelpAlert(notification: Pick<Notification, 'referenceType'>): boolean {
  return Boolean(notification.referenceType?.startsWith(HELP_PREFIX)) || isHelpCardScan(notification);
}

export function helpReason(notification: Pick<Notification, 'referenceType'>): HelpReason {
  if (isHelpCardScan(notification)) return 'tarjeta';
  const reason = notification.referenceType?.split(':')[1];
  return reason === 'no_entiende' || reason === 'pausa' ? reason : 'ayuda';
}

/** De cada persona, solo el escaneo más nuevo cuenta: tras descartarlo no reaparece uno anterior. */
function latestScanIdBySource(list: Notification[], now: number): Map<string, string> {
  const latest = new Map<string, { id: string; time: number }>();
  for (const item of list) {
    if (!isHelpCardScan(item)) continue;
    const time = new Date(item.timestamp).getTime();
    if (!Number.isFinite(time) || now - time > MAX_AGE_MS) continue;
    const source = item.sourceUserId ?? '';
    if (!latest.has(source) || time > latest.get(source)!.time) latest.set(source, { id: item.id, time });
  }
  return new Map([...latest].map(([source, { id }]) => [source, id]));
}

/** No leídas, de ayuda (incluye escaneos de la tarjeta), de las últimas 2 horas y no descartadas; la más nueva primero. */
export function pendingHelpAlerts(list: Notification[], dismissedIds: ReadonlySet<string> | readonly string[], now = Date.now()): Notification[] {
  const dismissed = new Set(dismissedIds);
  const latestScans = latestScanIdBySource(list, now);
  return list
    .filter((item) => {
      if (item.read || !isHelpAlert(item) || dismissed.has(item.id)) return false;
      if (isHelpCardScan(item) && latestScans.get(item.sourceUserId ?? '') !== item.id) return false;
      const time = new Date(item.timestamp).getTime();
      return Number.isFinite(time) && now - time <= MAX_AGE_MS;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export type HelpMessagePart = { text: string; bold: boolean; breakBefore?: boolean };

/** Parte el mensaje para resaltar el título entre «» y el texto del paso (lo que sigue a los dos puntos). */
export function parseHelpMessage(message: string): HelpMessagePart[] {
  const match = /^([^«]*)«([^»]+)»(.*)$/s.exec(message);
  if (!match) return [{ text: message, bold: false }];
  const [, before, title, after] = match;
  const parts: HelpMessagePart[] = [];
  if (before) parts.push({ text: before, bold: false });
  parts.push({ text: title, bold: true });
  const colon = after.indexOf(': ');
  if (colon >= 0) {
    parts.push({ text: after.slice(0, colon + 1), bold: false });
    const stepText = after.slice(colon + 2);
    if (stepText) parts.push({ text: stepText, bold: true, breakBefore: true });
  } else if (after) {
    parts.push({ text: after, bold: false });
  }
  return parts;
}
