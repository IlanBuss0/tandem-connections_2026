import type { Block } from "@/lib/googleDocs";
import type { ProfessionalSession } from "@/data/api";

export type NoteTemplate = {
  id: string;
  name: string;
  description: string;
  accent: string;
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
    blocks: () => [],
  },
  {
    id: "therapy-session",
    name: "Nota de sesión",
    description: "Estructura general para registro clínico breve.",
    accent: "#7c3aed",
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
  {
    id: "intake",
    name: "Primera entrevista / anamnesis",
    description: "Motivo de consulta, antecedentes y objetivos iniciales.",
    accent: "#4f46e5",
    blocks: (session, patientName) => [
      { kind: "title", text: "Primera entrevista / anamnesis", subtitle: "Evaluación inicial · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Motivo de consulta" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Quién deriva / cómo llega" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Antecedentes del desarrollo" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Diagnósticos previos / intervenciones anteriores" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Composición familiar" },
      {
        kind: "table",
        header: ["Integrante", "Vínculo", "Observaciones"],
        rows: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Áreas a evaluar" },
      {
        kind: "checklist",
        items: [
          "Comunicación",
          "Interacción social",
          "Autonomía / vida diaria",
          "Regulación emocional",
          "Aprendizaje / escolaridad",
        ],
      },
      { kind: "sectionHeader", text: "Objetivos iniciales del proceso" },
      { kind: "lines", count: 3 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "adaptive-skills",
    name: "Evaluación de habilidades adaptativas",
    description: "Nivel de apoyo por área: comunicación, autonomía, socialización.",
    accent: "#059669",
    blocks: (session, patientName) => [
      { kind: "title", text: "Evaluación de habilidades adaptativas", subtitle: "Áreas funcionales · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Comunicación" },
      { kind: "checklist", items: ["Bajo apoyo", "Apoyo moderado", "Apoyo alto"] },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Autonomía / vida diaria" },
      { kind: "checklist", items: ["Bajo apoyo", "Apoyo moderado", "Apoyo alto"] },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Socialización" },
      { kind: "checklist", items: ["Bajo apoyo", "Apoyo moderado", "Apoyo alto"] },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Motricidad" },
      { kind: "checklist", items: ["Bajo apoyo", "Apoyo moderado", "Apoyo alto"] },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Resumen por área" },
      {
        kind: "table",
        header: ["Área", "Nivel de apoyo", "Prioridad de trabajo"],
        rows: [
          ["Comunicación", "", ""],
          ["Autonomía", "", ""],
          ["Socialización", "", ""],
          ["Motricidad", "", ""],
        ],
      },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "intervention-plan",
    name: "Plan de intervención",
    description: "Objetivos a corto/mediano plazo y responsables por acuerdo.",
    accent: "#0891b2",
    blocks: (session, patientName) => [
      { kind: "title", text: "Plan de intervención", subtitle: "Objetivos y estrategias · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Objetivos a corto plazo (1-3 meses)" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Objetivos a mediano plazo (3-6 meses)" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Estrategias y recursos a utilizar" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Responsables por ámbito" },
      {
        kind: "table",
        header: ["Ámbito", "Responsable", "Acción acordada"],
        rows: [
          ["Familia", "", ""],
          ["Escuela", "", ""],
          ["Profesional", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Frecuencia y modalidad de seguimiento" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Criterios de revisión del plan" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "emotional-crisis",
    name: "Regulación emocional / manejo de crisis",
    description: "Desencadenantes, señales de alerta y plan de acción.",
    accent: "#dc2626",
    blocks: (session, patientName) => [
      { kind: "title", text: "Regulación emocional / manejo de crisis", subtitle: "Plan de prevención y respuesta · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Desencadenantes identificados" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Señales de alerta tempranas" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Nivel de intensidad de la crisis" },
      { kind: "checklist", items: ["Leve", "Moderada", "Alta / requiere intervención inmediata"] },
      { kind: "sectionHeader", text: "Estrategias de regulación que funcionaron antes" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Plan de acción paso a paso" },
      {
        kind: "table",
        header: ["Paso", "Acción", "Responsable"],
        rows: [
          ["1", "", ""],
          ["2", "", ""],
          ["3", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Contactos de emergencia" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Seguimiento post-crisis" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "discharge",
    name: "Cierre de proceso / alta terapéutica",
    description: "Logros alcanzados, recomendaciones y objetivos cumplidos.",
    accent: "#65a30d",
    blocks: (session, patientName) => [
      { kind: "title", text: "Cierre de proceso / alta terapéutica", subtitle: "Resumen final del tratamiento · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Motivo del cierre" },
      { kind: "checklist", items: ["Alta terapéutica", "Objetivos cumplidos", "Derivación", "Interrupción del tratamiento"] },
      { kind: "sectionHeader", text: "Logros alcanzados durante el proceso" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Estado de los objetivos planteados" },
      {
        kind: "table",
        header: ["Objetivo", "Estado final", "Observaciones"],
        rows: [
          ["", "Logrado", ""],
          ["", "Logrado parcial", ""],
          ["", "No logrado", ""],
        ],
      },
      { kind: "sectionHeader", text: "Áreas que requieren continuidad" },
      { kind: "lines", count: 2 },
      { kind: "sectionHeader", text: "Recomendaciones para familia / escuela" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Derivaciones sugeridas" },
      { kind: "lines", count: 2 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
  {
    id: "team-meeting",
    name: "Reunión de equipo interdisciplinario",
    description: "Participantes, acuerdos y tabla de responsables/tareas.",
    accent: "#9333ea",
    blocks: (session, patientName) => [
      { kind: "title", text: "Reunión de equipo interdisciplinario", subtitle: "Coordinación entre profesionales · Tándem" },
      baseInfoGrid(session, patientName),
      { kind: "sectionHeader", text: "Participantes" },
      {
        kind: "table",
        header: ["Nombre", "Rol / disciplina", "Institución"],
        rows: [
          ["", "", ""],
          ["", "", ""],
          ["", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Temas tratados" },
      { kind: "bullets", items: ["", "", ""] },
      { kind: "sectionHeader", text: "Acuerdos alcanzados" },
      { kind: "lines", count: 3 },
      { kind: "sectionHeader", text: "Tareas y responsables" },
      {
        kind: "table",
        header: ["Tarea", "Responsable", "Fecha límite"],
        rows: [
          ["", "", ""],
          ["", "", ""],
        ],
      },
      { kind: "sectionHeader", text: "Próxima reunión" },
      { kind: "lines", count: 1 },
      { kind: "footer", text: CONFIDENTIALITY },
    ],
  },
];

export function findTemplate(id: string | undefined | null) {
  return noteTemplates.find((template) => template.id === id) || null;
}
