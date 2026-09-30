import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProfessionalCalendar, { type AgendaPatient } from "@/components/ProfessionalCalendar";
import type { ProfessionalSession } from "@/data/api";

const today = new Date();
today.setHours(16, 0, 0, 0);
const iso = today.toISOString();

const sessions: ProfessionalSession[] = [
  { id: 1, id_profesional: 1, id_perteneciente: 1, fecha_sesion: iso, titulo: "Terapia", duracion_minutos: 45, estado: "programada", recordatorios: [], recurrence_group_id: "g1", recurrence_rule: { frequency: "weekly", count: 8 }, recurrence_index: 11 },
];

vi.mock("@/data/api", () => ({
  fetchProfessionalSessions: vi.fn(async () => sessions),
  createProfessionalSession: vi.fn(),
  updateProfessionalSession: vi.fn(),
  deleteProfessionalSession: vi.fn(),
  resizeSessionSeries: vi.fn(),
}));
vi.mock("@/contexts/CalendarContext", () => ({
  eventTypes: ["mañana", "escuela"],
  typeColor: {},
  useCalendar: () => ({ events: [{ id: "e1", userId: "1", title: "Almuerzo", date: new Date().toLocaleDateString("sv-SE"), time: "12:30", type: "mañana", description: "", color: "", reminders: [] }], addEvent: vi.fn(), updateEvent: vi.fn(), deleteEvent: vi.fn() }),
}));
vi.mock("@/components/ProfessionalPrivateNote", () => ({ default: () => null }));

const patient = (id: number, name: string) => ({ id: String(id), name, pertenecienteId: id }) as unknown as AgendaPatient;
const few = [patient(1, "Martina"), patient(2, "Sol"), patient(3, "Tomás"), patient(4, "Caro")];
const many = [...few, patient(5, "Joel"), patient(6, "Álvaro")];

describe("ProfessionalCalendar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra un solo calendario con sesiones y eventos mezclados, sin selector ni filtros", async () => {
    render(<ProfessionalCalendar patients={few} />);
    expect(screen.getByRole("heading", { name: "Tu calendario" })).toBeInTheDocument();
    await screen.findByText("Martina", { selector: "p" });
    expect(screen.getByText("Almuerzo", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByText(/Semana|Lista|Todos los estados|Buscar/)).not.toBeInTheDocument();
  });

  it("el menú ⋯ de una sesión de serie ofrece gestionar la serie", async () => {
    render(<ProfessionalCalendar patients={few} />);
    fireEvent.click(await screen.findByRole("button", { name: /Más acciones de la sesión de Martina/ }));
    const dialog = await screen.findByRole("dialog");
    ["Editar sesión", "Editar serie", "Marcar pasadas como completadas", "Eliminar sesión"].forEach((label) =>
      expect(within(dialog).getByText(label)).toBeInTheDocument(),
    );
  });

  it("con 4 pacientes o menos muestra todos los chips y no 'Ver más'", async () => {
    render(<ProfessionalCalendar patients={few} />);
    fireEvent.click(screen.getByRole("button", { name: /Sesión/ }));
    const dialog = await screen.findByRole("dialog");
    few.forEach((p) => expect(within(dialog).getByRole("button", { name: p.name })).toBeInTheDocument());
    expect(within(dialog).queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
  });

  it("con más de 4 pacientes muestra 4 chips + 'Ver más' y elige desde el mini modal con buscador", async () => {
    render(<ProfessionalCalendar patients={many} />);
    fireEvent.click(screen.getByRole("button", { name: /Sesión/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).queryByRole("button", { name: "Joel" })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Ver más" }));
    const picker = (await screen.findAllByRole("dialog")).at(-1)!;
    fireEvent.change(within(picker).getByLabelText(/Buscar paciente/), { target: { value: "alvaro" } });
    expect(within(picker).queryByText("Joel")).not.toBeInTheDocument();
    fireEvent.click(within(picker).getByText("Álvaro"));
    await waitFor(() => expect(screen.getAllByRole("dialog")).toHaveLength(1));
    const chip = within(screen.getByRole("dialog")).getByRole("button", { name: "Álvaro" });
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Caro" })).not.toBeInTheDocument();
  });
});
