const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

/** "Martes 29 de septiembre". */
export const longDate = (dateKey: string) =>
  cap(new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" }).replace(",", ""));

export const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const clockOf = (date: Date) => date.toTimeString().slice(0, 5);

/** "Martes 29". */
export const dayLabel = (date: Date) => cap(date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric" }).replace(",", ""));

export const MAX_PATIENT_CHIPS = 4;

/** Hasta 4 chips; con más, los primeros 4 (el elegido, si quedó afuera, reemplaza al cuarto). */
export function visiblePatients<T extends { pertenecienteId: number }>(patients: T[], value: string) {
  if (patients.length <= MAX_PATIENT_CHIPS) return patients;
  const firstFour = patients.slice(0, MAX_PATIENT_CHIPS);
  const chosen = patients.find((patient) => String(patient.pertenecienteId) === value);
  if (!chosen || firstFour.includes(chosen)) return firstFour;
  return [...firstFour.slice(0, MAX_PATIENT_CHIPS - 1), chosen];
}
