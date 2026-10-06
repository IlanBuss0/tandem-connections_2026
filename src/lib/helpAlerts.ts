import type { Notification } from '@/data/api';

export type HelpReason = 'ayuda' | 'no_entiende' | 'pausa';

const HELP_PREFIX = 'activity_help';
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

export function isHelpAlert(notification: Pick<Notification, 'referenceType'>): boolean {
  return Boolean(notification.referenceType?.startsWith(HELP_PREFIX));
}

export function helpReason(notification: Pick<Notification, 'referenceType'>): HelpReason {
  const reason = notification.referenceType?.split(':')[1];
  return reason === 'no_entiende' || reason === 'pausa' ? reason : 'ayuda';
}

/** No leídas, de ayuda, de las últimas 2 horas y no descartadas; la más nueva primero. */
export function pendingHelpAlerts(list: Notification[], dismissedIds: ReadonlySet<string> | readonly string[], now = Date.now()): Notification[] {
  const dismissed = new Set(dismissedIds);
  return list
    .filter((item) => {
      if (item.read || !isHelpAlert(item) || dismissed.has(item.id)) return false;
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
