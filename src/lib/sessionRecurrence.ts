export type RecurrenceFrequency =
  | "none"
  | "weekly"
  | "twice_weekly"
  | "biweekly"
  | "monthly";

export const recurrenceLabels: Record<RecurrenceFrequency, string> = {
  none: "No se repite",
  weekly: "Una vez por semana",
  twice_weekly: "Dos veces por semana",
  biweekly: "Una vez cada 2 semanas",
  monthly: "Una vez por mes",
};
