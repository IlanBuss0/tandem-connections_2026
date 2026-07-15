import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  FileText,
  LayoutTemplate,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchPrivateProfessionalNote,
  linkPrivateNoteDriveDocument,
  unlinkPrivateNoteDriveDocument,
  type PrivateProfessionalNote,
  type ProfessionalSession,
} from "@/data/api";

declare global {
  interface Window {
    google?: any;
    gapi?: any;
  }
}

type DriveDocument = NonNullable<PrivateProfessionalNote["documento_drive"]>;

const GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const GOOGLE_DOCS_SCOPE = "https://www.googleapis.com/auth/documents";
const GOOGLE_DOCS_MIME_TYPE = "application/vnd.google-apps.document";
const GOOGLE_CONSENT_STORAGE_KEY = "tandem.googleDriveConsentGranted";

type NoteTemplate = {
  id: string;
  name: string;
  description: string;
  accent: string;
  preview: string[];
  table?: string[][];
  build: (session: ProfessionalSession) => string;
};

const noteTemplates: NoteTemplate[] = [
  {
    id: "blank",
    name: "Pagina en blanco",
    description: "Crea un Google Docs vacio para escribir libremente.",
    accent: "#64748b",
    preview: [
      "Pagina libre",
      "Sin estructura previa",
      "Ideal para notas abiertas",
    ],
    build: () => "",
  },
  {
    id: "therapy-session",
    name: "Nota de sesion",
    description: "Estructura general para registro clinico breve.",
    accent: "#7c3aed",
    preview: [
      "Motivo y objetivo",
      "Observaciones clinicas",
      "Plan para proxima sesion",
    ],
    table: [
      ["Campo", "Registro"],
      ["Estado general", ""],
      ["Riesgo / alertas", ""],
      ["Tarea acordada", ""],
    ],
    build: (session) => `NOTA DE SESION

Sesion: ${session.titulo || "Sesion profesional"}
Fecha: ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}
Hora: ${new Date(session.fecha_sesion).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
Duracion: ${session.duracion_minutos} minutos

RESUMEN RAPIDO


MOTIVO / OBJETIVO DE LA SESION


TEMAS PRINCIPALES TRABAJADOS
- 
- 
- 

OBSERVACIONES CLINICAS


INTERVENCIONES REALIZADAS


RESPUESTA DEL PACIENTE


ACUERDOS / TAREAS PARA CASA
- 
- 

PLAN PARA PROXIMA SESION


NOTAS ADMINISTRATIVAS

TABLA DE SEGUIMIENTO

`,
  },
  {
    id: "cbt",
    name: "TCC / conducta",
    description: "Pensamientos, emociones, conductas e intervenciones.",
    accent: "#0f766e",
    preview: [
      "Situacion trabajada",
      "Pensamientos y emociones",
      "Estrategias practicadas",
    ],
    table: [
      ["Situacion", "Pensamiento", "Emocion", "Respuesta alternativa"],
      ["", "", "", ""],
      ["", "", "", ""],
      ["", "", "", ""],
    ],
    build: (session) => `REGISTRO TCC / CONDUCTUAL

Sesion: ${session.titulo || "Sesion profesional"}
Fecha: ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}

SITUACION TRABAJADA


PENSAMIENTOS / CREENCIAS IDENTIFICADAS
- 
- 

EMOCIONES ASOCIADAS
- Emocion:
- Intensidad:
- Contexto:

CONDUCTAS OBSERVADAS


ESTRATEGIAS PRACTICADAS
- Reestructuracion cognitiva:
- Respiracion / regulacion:
- Exposicion / practica:
- Otra:

TAREA PARA CASA


SEGUIMIENTO PARA PROXIMA SESION

TABLA TCC

`,
  },
  {
    id: "family",
    name: "Entrevista familiar",
    description: "Para reuniones con tutor, familia o red de apoyo.",
    accent: "#db2777",
    preview: ["Participantes", "Acuerdos familiares", "Recomendaciones"],
    table: [
      ["Participante", "Rol", "Acuerdo / compromiso"],
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    build: (session) => `ENTREVISTA FAMILIAR / RED DE APOYO

Sesion: ${session.titulo || "Sesion profesional"}
Fecha: ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}

PARTICIPANTES
- 
- 

CAMBIOS RELEVANTES DESDE LA ULTIMA SESION


FORTALEZAS OBSERVADAS


DIFICULTADES ACTUALES


ACUERDOS CON LA FAMILIA / TUTOR
- 
- 
- 

RECOMENDACIONES


PLAN DE SEGUIMIENTO

TABLA DE ACUERDOS

`,
  },
  {
    id: "school-support",
    name: "Apoyo escolar / funcional",
    description: "Rutina, autonomia, adaptaciones y objetivos.",
    accent: "#2563eb",
    preview: ["Area trabajada", "Nivel de apoyo", "Adaptaciones"],
    table: [
      ["Area", "Apoyo utilizado", "Respuesta", "Proximo paso"],
      ["Organizacion", "", "", ""],
      ["Autonomia", "", "", ""],
      ["Regulacion", "", "", ""],
    ],
    build: (session) => `APOYO ESCOLAR / FUNCIONAL

Sesion: ${session.titulo || "Sesion profesional"}
Fecha: ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}

AREA TRABAJADA
☐ Organizacion
☐ Comunicacion
☐ Autonomia
☐ Regulacion emocional
☐ Actividades escolares
☐ Otra:

OBJETIVO DE LA SESION


ACTIVIDADES REALIZADAS
- 
- 

NIVEL DE APOYO NECESARIO
☐ Bajo
☐ Medio
☐ Alto

ADAPTACIONES / APOYOS UTILIZADOS


AVANCES OBSERVADOS


PROXIMOS PASOS

TABLA FUNCIONAL

`,
  },
  {
    id: "progress-plan",
    name: "Progreso y plan",
    description: "Resumen de avances, barreras y objetivos proximos.",
    accent: "#ea580c",
    preview: ["Avances", "Barreras", "Objetivos proximos"],
    table: [
      ["Objetivo", "Estado", "Evidencia", "Proximo ajuste"],
      ["", "En progreso", "", ""],
      ["", "Logrado", "", ""],
      ["", "Pendiente", "", ""],
    ],
    build: (session) => `PROGRESO Y PLAN DE INTERVENCION

Sesion: ${session.titulo || "Sesion profesional"}
Fecha: ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}

AVANCES OBSERVADOS


BARRERAS / DIFICULTADES


RECURSOS QUE FUNCIONARON


OBJETIVOS PARA EL PROXIMO PERIODO
- 
- 
- 

INDICADORES A MONITOREAR


TABLA DE OBJETIVOS

`,
  },
];

function hexToRgbColor(hex: string) {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    color: {
      rgbColor: {
        red: ((value >> 16) & 255) / 255,
        green: ((value >> 8) & 255) / 255,
        blue: (value & 255) / 255,
      },
    },
  };
}

function buildFormatRequests(text: string, template: NoteTemplate) {
  const requests: any[] = [];
  const firstLineEnd = text.indexOf("\n");
  if (firstLineEnd > 0) {
    requests.push({
      updateTextStyle: {
        range: { startIndex: 1, endIndex: firstLineEnd + 1 },
        textStyle: {
          bold: true,
          fontSize: { magnitude: 18, unit: "PT" },
          foregroundColor: hexToRgbColor(template.accent),
        },
        fields: "bold,fontSize,foregroundColor",
      },
    });
    requests.push({
      updateParagraphStyle: {
        range: { startIndex: 1, endIndex: firstLineEnd + 1 },
        paragraphStyle: { namedStyleType: "TITLE" },
        fields: "namedStyleType",
      },
    });
  }

  const sectionPattern = /^[A-ZÁÉÍÓÚÑ0-9 /]+$/gm;
  let match: RegExpExecArray | null;
  while ((match = sectionPattern.exec(text)) !== null) {
    if (match.index === 0) continue;
    const start = match.index + 1;
    const end = start + match[0].length;
    requests.push({
      updateTextStyle: {
        range: { startIndex: start, endIndex: end },
        textStyle: {
          bold: true,
          foregroundColor: hexToRgbColor(template.accent),
        },
        fields: "bold,foregroundColor",
      },
    });
  }

  return requests;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${src}"]`,
    ) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("No se pudo cargar Google Drive."));
    if (!existing) document.head.appendChild(script);
  });
}

async function ensureGoogleScripts() {
  await Promise.all([
    loadScript("https://apis.google.com/js/api.js"),
    loadScript("https://accounts.google.com/gsi/client"),
  ]);
}

async function requestGoogleAccessToken(forceConsent = false) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Falta VITE_GOOGLE_CLIENT_ID.");

  await ensureGoogleScripts();

  return await new Promise<string>((resolve, reject) => {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: `${GOOGLE_DRIVE_SCOPE} ${GOOGLE_DOCS_SCOPE}`,
      callback: (tokenResponse: {
        access_token?: string;
        error?: string;
        error_description?: string;
      }) => {
        if (tokenResponse?.access_token) {
          localStorage.setItem(GOOGLE_CONSENT_STORAGE_KEY, "1");
          resolve(tokenResponse.access_token);
          return;
        }
        reject(
          new Error(
            tokenResponse?.error_description ||
              tokenResponse?.error ||
              "Google no devolvio un token.",
          ),
        );
      },
    });

    const alreadyGranted =
      localStorage.getItem(GOOGLE_CONSENT_STORAGE_KEY) === "1";
    tokenClient.requestAccessToken({
      prompt: forceConsent || !alreadyGranted ? "consent" : "",
    });
  });
}

function buildDocsUrl(fileId: string) {
  return `https://docs.google.com/document/d/${fileId}/edit`;
}

export default function ProfessionalPrivateNote({
  session,
}: {
  session: ProfessionalSession;
}) {
  const { toast } = useToast();
  const [document, setDocument] = useState<DriveDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"create" | "pick" | "unlink" | null>(
    null,
  );

  const loadLinkedDocument = useCallback(async () => {
    setLoading(true);
    try {
      const note = await fetchPrivateProfessionalNote(session.id);
      setDocument(note?.documento_drive || null);
    } catch {
      toast({
        title: "No se pudo cargar el documento vinculado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session.id, toast]);

  useEffect(() => {
    loadLinkedDocument();
  }, [loadLinkedDocument]);

  const persistDocument = async (file: { id: string; name?: string }) => {
    const linked = await linkPrivateNoteDriveDocument(session.id, {
      google_file_id: file.id,
      nombre: file.name || `Nota - ${session.titulo}`,
    });
    setDocument(linked);
    toast({
      title: "Documento vinculado",
      description: "Tandem guardo solo el acceso al Google Docs.",
    });
  };

  const fillLastTable = async (
    documentId: string,
    token: string,
    rows: string[][],
  ) => {
    if (!rows.length) return;
    const documentResponse = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}?fields=body/content/table`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!documentResponse.ok) return;
    const googleDocument = await documentResponse.json();
    const tables = (googleDocument.body?.content || []).filter(
      (item: any) => item.table,
    );
    const table = tables[tables.length - 1]?.table;
    if (!table) return;

    const insertRequests: any[] = [];
    table.tableRows?.forEach((row: any, rowIndex: number) => {
      row.tableCells?.forEach((cell: any, columnIndex: number) => {
        const text = rows[rowIndex]?.[columnIndex];
        if (!text) return;
        insertRequests.push({
          insertText: {
            location: { index: Number(cell.startIndex) + 1 },
            text,
          },
        });
      });
    });

    if (!insertRequests.length) return;
    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests: insertRequests.reverse() }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        detail || "Google Docs rechazo el contenido de la tabla.",
      );
    }
  };

  const applyTemplateToDocument = async (
    documentId: string,
    token: string,
    template: NoteTemplate,
  ) => {
    const templateText = template.build(session);
    if (!templateText.trim()) return;
    const requests: any[] = [
      {
        insertText: {
          location: { index: 1 },
          text: templateText,
        },
      },
      ...buildFormatRequests(templateText, template),
    ];
    if (template.table?.length) {
      requests.push({
        insertTable: {
          rows: template.table.length,
          columns: template.table[0]?.length || 2,
          location: { index: templateText.length + 1 },
        },
      });
    }

    const response = await fetch(
      `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requests }),
      },
    );
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || "Google Docs rechazo la plantilla.");
    }
    if (template.table?.length) {
      await fillLastTable(documentId, token, template.table);
    }
  };

  const createDriveDocument = async (template: NoteTemplate) => {
    setWorking("create");
    try {
      const token = await requestGoogleAccessToken(false);
      const title = `${template.id === "blank" ? "Nota" : template.name} - ${session.titulo || "Sesion profesional"} - ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}`;
      const response = await fetch("https://docs.googleapis.com/v1/documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          detail || "Google Docs rechazo la creacion del documento.",
        );
      }
      const created = await response.json();
      await applyTemplateToDocument(created.documentId, token, template);
      await persistDocument({
        id: created.documentId,
        name: created.title || title,
      });
    } catch (error) {
      toast({
        title: "No se pudo crear el Google Docs",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  const chooseDriveDocument = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const appId = import.meta.env.VITE_GOOGLE_APP_ID;
    if (!apiKey || !appId) {
      toast({
        title: "Google Drive no esta configurado",
        description: "Faltan VITE_GOOGLE_API_KEY o VITE_GOOGLE_APP_ID.",
        variant: "destructive",
      });
      return;
    }

    setWorking("pick");
    try {
      const token = await requestGoogleAccessToken(false);
      await new Promise<void>((resolve) => window.gapi.load("picker", resolve));
      const view = new window.google.picker.DocsView(
        window.google.picker.ViewId.DOCS,
      ).setMimeTypes(GOOGLE_DOCS_MIME_TYPE);
      const picker = new window.google.picker.PickerBuilder()
        .setAppId(appId)
        .setDeveloperKey(apiKey)
        .setOAuthToken(token)
        .addView(view)
        .setCallback(async (data: any) => {
          if (data.action === window.google.picker.Action.CANCEL) {
            setWorking(null);
            return;
          }
          if (data.action !== window.google.picker.Action.PICKED) return;
          const selected = data.docs?.[0];
          if (!selected?.id) {
            setWorking(null);
            return;
          }
          try {
            await persistDocument({ id: selected.id, name: selected.name });
          } catch {
            toast({
              title: "No se pudo vincular el documento",
              variant: "destructive",
            });
          } finally {
            setWorking(null);
          }
        })
        .build();
      picker.setVisible(true);
    } catch (error) {
      toast({
        title: "No se pudo abrir Google Drive",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
      setWorking(null);
    }
  };

  const unlinkDrive = async () => {
    if (!document) return;
    setWorking("unlink");
    try {
      await unlinkPrivateNoteDriveDocument(session.id);
      setDocument(null);
      toast({
        title: "Documento desvinculado",
        description: "El archivo original sigue en Google Drive.",
      });
    } catch {
      toast({
        title: "No se pudo desvincular el documento",
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border p-8 text-muted-foreground">
        <Loader2 className="mr-2 animate-spin" size={18} />
        Cargando documento...
      </div>
    );
  }

  if (!document) {
    return (
      <div className="space-y-5 rounded-xl border border-dashed bg-card p-5">
        <div className="text-center">
          <FileText className="mx-auto mb-3 text-primary" size={34} />
          <h3 className="font-semibold">Crear nota en Google Docs</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Elegi una pagina en blanco o una plantilla. La nota se completa y
            guarda dentro de Google Docs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {noteTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => createDriveDocument(template)}
              disabled={Boolean(working)}
              className="group overflow-hidden rounded-lg border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
            >
              <div className="bg-muted/30 p-4">
                <div className="mx-auto aspect-[4/5] max-w-[180px] rounded border bg-white p-3 shadow-sm">
                  <div
                    className="mb-2 h-3 w-3/4 rounded"
                    style={{ backgroundColor: template.accent }}
                  />
                  <div className="mb-3 h-1.5 w-1/2 rounded bg-slate-200" />
                  <div className="space-y-1.5">
                    {template.preview.map((line, index) => (
                      <div key={line} className="space-y-1">
                        <div
                          className="h-1.5 rounded"
                          style={{
                            width: `${92 - index * 13}%`,
                            backgroundColor:
                              index === 0 ? `${template.accent}33` : "#e5e7eb",
                          }}
                        />
                        <div
                          className="h-1 rounded bg-slate-100"
                          style={{ width: `${76 - index * 8}%` }}
                        />
                      </div>
                    ))}
                  </div>
                  {template.table && (
                    <div className="mt-3 grid grid-cols-2 overflow-hidden rounded border border-slate-200">
                      {Array.from({ length: 6 }, (_, index) => (
                        <div
                          key={index}
                          className="h-5 border-b border-r border-slate-100"
                          style={{
                            backgroundColor:
                              index < 2 ? `${template.accent}24` : "#ffffff",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3 p-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  style={{
                    backgroundColor: `${template.accent}1f`,
                    color: template.accent,
                  }}
                >
                  {template.id === "blank" ? (
                    <Plus size={17} />
                  ) : (
                    <LayoutTemplate size={17} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center border-t pt-4">
          <Button
            variant="outline"
            onClick={chooseDriveDocument}
            disabled={Boolean(working)}
          >
            {working === "pick" ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Link2 size={15} />
            )}
            Vincular existente
          </Button>
        </div>
      </div>
    );
  }

  const docsUrl =
    document.web_view_url || buildDocsUrl(document.google_file_id);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{document.nombre}</h3>
          <p className="text-xs text-muted-foreground">
            Google Docs vinculado a esta sesion
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={loadLinkedDocument}>
            <RefreshCw size={14} />
            Refrescar
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={docsUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              Abrir
            </a>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive"
            onClick={unlinkDrive}
            disabled={working === "unlink"}
          >
            {working === "unlink" ? (
              <Loader2 className="animate-spin" size={14} />
            ) : (
              <Unlink size={14} />
            )}
            Desvincular
          </Button>
        </div>
      </div>
      <iframe
        title={document.nombre}
        src={docsUrl}
        className="h-[720px] w-full rounded-xl border bg-white"
      />
    </div>
  );
}
