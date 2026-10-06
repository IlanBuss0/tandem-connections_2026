/** A quién se le avisa: el primer nombre del tutor que asignó, o un texto neutro. */
export function helpRecipientLabel(assignedByName?: string | null, assignedByRole?: string | null): string {
  if (assignedByRole === 'tutor') {
    const firstName = String(assignedByName || '').trim().split(/\s+/)[0];
    if (firstName) return firstName;
  }
  return 'quien te acompaña';
}
