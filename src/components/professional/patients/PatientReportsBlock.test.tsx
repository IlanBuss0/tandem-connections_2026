import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PatientReportsBlock from "@/components/professional/patients/PatientReportsBlock";
import ProfessionalPatientSessions from "@/components/professional/patients/ProfessionalPatientSessions";
import type { AgendaPatient } from "@/components/agenda/SessionFormSheet";
import type { GeneratedReport, ProfessionalSession } from "@/data/api";

const api = vi.hoisted(() => ({
  fetchProfessionalSessions: vi.fn(),
  sendReportToTutor: vi.fn(),
  deleteReport: vi.fn(),
  updateReport: vi.fn(),
  generatePatientReport: vi.fn(),
  fetchPrivateProfessionalNote: vi.fn(),
}));
vi.mock("@/data/api", () => api);
vi.mock("@/contexts/AccessibilityContext", () => ({ useAccessibility: () => ({ settings: { reduceMotion: false } }) }));

const patient = { id: "u1", name: "Martina Baez", pertenecienteId: 5 } as unknown as AgendaPatient;
const report = (id: number, generated: string, sent: boolean): GeneratedReport => ({
  id, id_profesional: 1, id_perteneciente: 5, titulo: `Reporte ${id}`, contenido: `Texto ${id}`, id_tipo: "manual",
  fecha_generacion: generated, enviado_al_tutor: sent, fecha_envio: sent ? generated : null,
});
const five = [
  report(1, "2026-08-01T12:00:00", true),
  report(2, "2026-08-15T12:00:00", true),
  report(3, "2026-09-10T12:00:00", true),
  report(4, "2026-09-21T12:00:00", true),
  report(5, "2026-09-28T12:00:00", false),
];

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchProfessionalSessions.mockResolvedValue([{ id: 9, id_perteneciente: 5, titulo: "Sesión profesional", fecha_sesion: "2026-09-28T16:00:00", has_note: true }] as unknown as ProfessionalSession[]);
  api.sendReportToTutor.mockResolvedValue({ ...five[4], enviado_al_tutor: true });
  api.deleteReport.mockResolvedValue({ rowsAffected: 1 });
});

describe("PatientReportsBlock", () => {
  it("sin reportes muestra el estado vacío y solo «Nuevo reporte»", () => {
    render(<PatientReportsBlock patient={patient} reports={[]} onReportsChanged={vi.fn()} onOpenReports={vi.fn()} />);
    expect(screen.getByText("Todavía no hay reportes")).toBeInTheDocument();
    expect(screen.getByText(/armamos el reporte para que lo leas antes/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuevo reporte para Martina/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ver los/ })).not.toBeInTheDocument();
  });

  it("con reportes muestra los últimos 3 y «Ver los N reportes» lleva a Reportes", () => {
    const onOpenReports = vi.fn();
    render(<PatientReportsBlock patient={patient} reports={five} onReportsChanged={vi.fn()} onOpenReports={onOpenReports} />);
    expect(screen.getByText(/5 reportes · último el 28 sep/)).toBeInTheDocument();
    ["Reporte 5", "Reporte 4", "Reporte 3"].forEach((title) => expect(screen.getByText(title)).toBeInTheDocument());
    expect(screen.queryByText("Reporte 2")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leer y enviar" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Ver los 5 reportes/ }));
    expect(onOpenReports).toHaveBeenCalledOnce();
  });

  it("con 3 reportes o menos no ofrece «Ver los N reportes»", () => {
    render(<PatientReportsBlock patient={patient} reports={five.slice(0, 3)} onReportsChanged={vi.fn()} onOpenReports={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Ver los/ })).not.toBeInTheDocument();
  });

  it("«Nuevo reporte» abre la hoja con el paciente bloqueado", async () => {
    render(<PatientReportsBlock patient={patient} reports={[]} onReportsChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Nuevo reporte para Martina/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Martina Baez")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Ver más" })).not.toBeInTheDocument();
    expect(await within(dialog).findByText("Sesión profesional")).toBeInTheDocument();
    expect(api.fetchProfessionalSessions).toHaveBeenCalledWith(5);
  });

  it("leer y enviar al tutor refresca la lista", async () => {
    const onReportsChanged = vi.fn();
    render(<PatientReportsBlock patient={patient} reports={five} onReportsChanged={onReportsChanged} />);
    fireEvent.click(screen.getByRole("button", { name: "Leer y enviar" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/Lo armó la IA con tus notas/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Enviar al tutor" }));
    await waitFor(() => expect(api.sendReportToTutor).toHaveBeenCalledWith(5));
    await waitFor(() => expect(onReportsChanged).toHaveBeenCalled());
  });

  it("el menú ⋯ bloquea editar y volver a generar si ya se envió, y permite eliminar", async () => {
    const onReportsChanged = vi.fn();
    render(<PatientReportsBlock patient={patient} reports={five} onReportsChanged={onReportsChanged} />);
    fireEvent.click(screen.getByRole("button", { name: "Más acciones del reporte de Reporte 4" }));
    const menu = await screen.findByRole("dialog");
    expect(within(menu).getByRole("button", { name: /Editar/ })).toBeDisabled();
    expect(within(menu).getByRole("button", { name: /Volver a generar/ })).toBeDisabled();
    fireEvent.click(within(menu).getByRole("button", { name: /Eliminar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Eliminar" }));
    await waitFor(() => expect(api.deleteReport).toHaveBeenCalledWith(4));
    await waitFor(() => expect(onReportsChanged).toHaveBeenCalled());
  });
});

describe("Pestaña Sesiones", () => {
  const renderSessions = (canViewHistory: boolean) => render(
    <ProfessionalPatientSessions
      patientName="Martina Baez"
      pertenecienteId={5}
      sessions={[]}
      canSchedule={false}
      reports={five}
      canViewHistory={canViewHistory}
      reportPatient={patient}
      onReportsChanged={vi.fn()}
      onSchedule={vi.fn()}
      onSessionsChanged={vi.fn()}
    />,
  );

  it("muestra el bloque de reportes solo con permiso de historial", () => {
    const { unmount } = renderSessions(true);
    expect(screen.getByRole("region", { name: "Reportes de Martina Baez" })).toBeInTheDocument();
    unmount();
    renderSessions(false);
    expect(screen.queryByRole("region", { name: /Reportes de/ })).not.toBeInTheDocument();
  });
});
