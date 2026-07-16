import type { Block } from "@/lib/googleDocs";
import type { ProfessionalSession } from "@/data/api";

export type NoteTemplate = {
  id: string;
  name: string;
  description: string;
  accent: string;
  preview: string[];
  previewTable?: boolean;
  blocks: (session: ProfessionalSession, patientName?: string) => Block[];
};

const CONFIDENTIALITY =
  "Documento clínico confidencial — Uso exclusivo del profesional tratante · Tándem";

function sessionDate(session: ProfessionalSession) {
  return new Date(session.fecha_sesion).toLocaleDateString("es-AR");
}

function sessionTime(session: ProfessionalSession) {
  return new Date(session.fecha_sesion).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function baseInfoGrid(
  session: ProfessionalSession,
  patientName?: string,
): Block {
  return {
    kind: "infoGrid",
    rows: [
      ["Paciente", patientName || ""],
      ["Sesión", session.titulo || "Sesión profesional"],
      ["Fecha", sessionDate(session)],
      ["Hora", sessionTime(session)],
      ["Duración", `${session.duracion_minutos} minutos`],
    ],
  };
}

export const noteTemplates: NoteTemplate[] = [
  {
    id: "blank",
    name: "Página en blanco",
    description: "Crea un Google Docs vacío para escribir libremente.",
    accent: "#64748b",
    preview: ["Página libre", "Sin estructura previa", "Ideal para notas abiertas"],
    blocks: () => [],
  },
  {
    id: "therapy-session",
    name: "Nota de sesión",
    description: "Estructura general para registro clínico breve.",
    accent: "#7c3aed",
    preview: ["Motivo y objetivo", "Observaciones clínicas", "Plan para próxima sesión"],
    previewTable: true,
    blocks: (session, patientName) => [
      { kind: "title", text: "Nota de sesión", subtitle: "Registro clínico · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Motivo / objetivo de la sesión" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Temas principales trabajados" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Observaciones clínicas" },
      { kind: "lines", count: 4 },
      { kind: "sectionHeader", text: "Riesgo / alertas" },
      {
        kind: "checklist",
        items: [
          "Sin indicadores de riesgo",
          "Ideación / verbalizaciones a monitorear",
          "Conducta de riesgo observada",
          "Requiere derivación / interconsulta",
        ],
      },
      { kind: "sectionHeader", text: "Seguimiento" },
      {
        kind: "table",
        header: ["Campo", "Registro"],
        rows: [
          ["Estado general", ""],
          ["Respuesta del paciente", ""],
          ["Tarea acordada", ""],
        ],
      },
      { kind: "sectionHeader", text: "Plan para la próxima sesión" },
      { kind: "lines", count: 3 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "cbt",
    name: "TCC / conducta",
    description: "Pensamientos, emociones, conductas e intervenciones.",
    accent: "#0f766e",
    preview: ["Situación trabajada", "Pensamientos y emociones", "Estrategias practicadas"],
    previewTable: true,
    blocks: (session, patientName) => [
      { kind: "title", text: "Registro TCC / conductual", subtitle: "Terapia cognitivo-conductual · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Situación trabajada" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Registro cognitivo" },
      {
        kind: "table",
        header: ["Situación", "Pensamiento", "Emoción", "Respuesta alternativa"],
        rows: [
          ["", "", "", ""],
          ["", "", "", ""],
          ["", "", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Conductas observadas" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Estrategias practicadas" },
      {
        kind: "checklist",
        items: [
          "Reestructuración cognitiva",
          "Respiración / regulación",
          "Exposición / práctica",
          "Resolución de problemas",
          "Otra",
        ],
      },
      { kind: "sectionHeader", text: "Tarea para casa" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Seguimiento para próxima sesión" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "family",
    name: "Entrevista familiar",
    description: "Para reuniones con tutor, familia o red de apoyo.",
    accent: "#db2777",
    preview: ["Participantes", "Acuerdos familiares", "Recomendaciones"],
    previewTable: true,
    blocks: (session, patientName) => [
      { kind: "title", text: "Entrevista familiar / red de apoyo", subtitle: "Trabajo con familia y entorno · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Participantes" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Cambios relevantes desde la última sesión" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Fortalezas observadas" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Dificultades actuales" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Acuerdos con la familia / tutor" },
      {
        kind: "table",
        header: ["Participante", "Rol", "Acuerdo / compromiso"],
        rows: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Recomendaciones" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Plan de seguimiento" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "school-support",
    name: "Apoyo escolar / funcional",
    description: "Rutina, autonomía, adaptaciones y objetivos.",
    accent: "#2563eb",
    preview: ["Área trabajada", "Nivel de apoyo", "Adaptaciones"],
    previewTable: true,
    blocks: (session, patientName) => [
      { kind: "title", text: "Apoyo escolar / funcional", subtitle: "Autonomía y adaptaciones · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Área trabajada" },
      {
        kind: "checklist",
        items: [
          "Organización",
          "Comunicación",
          "Autonomía",
          "Regulación emocional",
          "Actividades escolares",
          "Otra",
        ],
      },
      { kind: "sectionHeader", text: "Objetivo de la sesión" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Actividades realizadas" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Nivel de apoyo necesario" },
      { kind: "checklist", items: ["Bajo", "Medio", "Alto"] },
      { kind: "sectionHeader", text: "Registro funcional" },
      {
        kind: "table",
        header: ["Área", "Apoyo utilizado", "Respuesta", "Próximo paso"],
        rows: [
          ["Organización", "", "", ""],
          ["Autonomía", "", "", ""],
          ["Regulación", "", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Próximos pasos" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "progress-plan",
    name: "Progreso y plan",
    description: "Resumen de avances, barreras y objetivos próximos.",
    accent: "#ea580c",
    preview: ["Avances", "Barreras", "Objetivos próximos"],
    previewTable: true,
    blocks: (session, patientName) => [
      { kind: "title", text: "Progreso y plan de intervención", subtitle: "Evolución del tratamiento · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Avances observados" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Barreras / dificultades" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Recursos que funcionaron" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Estado de objetivos" },
      {
        kind: "table",
        header: ["Objetivo", "Estado", "Evidencia", "Próximo ajuste"],
        rows: [
          ["", "En progreso", "", ""],
          ["", "Logrado", "", ""],
          ["", "Pendiente", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Objetivos para el próximo período" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Indicadores a monitorear" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
];

export function findTemplate(id: string | undefined | null) {
  return noteTemplates.find((template) => template.id === id) || null;
}
