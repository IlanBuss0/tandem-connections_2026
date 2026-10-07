// Títulos de cortesía ("Lic.", "Dr.", "Dra.", "Prof.", "Psic."…): dos o más letras y punto.
const HONORIFIC = /^\p{L}{2,}\.$/u;

/** A quién se le avisa: el primer nombre del tutor que asignó (sin títulos), o un texto neutro. */
export function helpRecipientLabel(assignedByName?: string | null, assignedByRole?: string | null): string {
  if (assignedByRole === 'tutor') {
    const firstName = String(assignedByName || '').trim().split(/\s+/).find(word => word && !HONORIFIC.test(word));
    if (firstName) return firstName;
  }
  return 'quien te acompaña';
}
