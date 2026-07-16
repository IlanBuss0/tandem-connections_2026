import { useCallback, useEffect, useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchPrivateProfessionalNote,
  linkPrivateNoteDriveDocument,
  unlinkPrivateNoteDriveDocument,
  type PrivateProfessionalNote,
  type ProfessionalSession,
} from "@/data/api";
import {
  GOOGLE_DOCS_MIME_TYPE,
  GoogleApiError,
  ensureGoogleScripts,
  requestGoogleAccessToken,
  withGoogleToken,
} from "@/lib/googleAuth";
import { createDoc, insertBlocks } from "@/lib/googleDocs";
import {
  findSessionFolder,
  isGoogleDoc,
  listChildren,
  moveFile,
  noteAppProperties,
  resolveSessionFolder,
  setAppProperties,
  type DriveFile,
} from "@/lib/googleDrive";
import type { NoteTemplate } from "@/data/noteTemplates";
import NewSessionDialog from "@/components/NewSessionDialog";
import NoteTemplateGallery from "@/components/NoteTemplateGallery";

type DriveDocument = NonNullable<PrivateProfessionalNote["documento_drive"]>;

function buildDocsUrl(fileId: string) {
  return `https://docs.google.com/document/d/${fileId}/edit`;
}

/** La Drive API puede no estar habilitada todavia en el proyecto de Cloud
 * del profesional: ese caso especifico se omite en silencio (la nota igual
 * se crea, solo queda sin carpeta/metadata). Cualquier otro error se avisa. */
function isDriveApiDisabled(error: unknown) {
  return (
    error instanceof GoogleApiError &&
    (error.reason === "accessNotConfigured" || error.reason === "SERVICE_DISABLED")
  );
}

export default function ProfessionalPrivateNote({
  session,
  patientName,
}: {
  session: ProfessionalSession;
  patientName?: string;
}) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [document, setDocument] = useState<DriveDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<"create" | "pick" | "unlink" | "link" | null>(null);
  const [viewingDoc, setViewingDoc] = useState<{ id: string; name: string } | null>(null);
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [seriesDocs, setSeriesDocs] = useState<DriveFile[] | null>(null);
  const [seriesOpen, setSeriesOpen] = useState(false);
  const [seriesLoading, setSeriesLoading] = useState(false);
  // Doc que se llegó a crear en Drive pero cuyo vínculo con la sesión (en el
  // backend de Tándem) todavía no se guardó — para poder reintentar el link
  // sin volver a crear el documento y duplicarlo.
  const [unlinkedDoc, setUnlinkedDoc] = useState<{ id: string; name: string } | null>(null);

  const loadLinkedDocument = useCallback(async () => {
    setLoading(true);
    try {
      const note = await fetchPrivateProfessionalNote(session.id);
      const linked = note?.documento_drive || null;
      setDocument(linked);
      setViewingDoc(
        linked ? { id: linked.google_file_id, name: linked.nombre } : null,
      );
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
    setViewingDoc({ id: linked.google_file_id, name: linked.nombre });
    setUnlinkedDoc(null);
    toast({
      title: "Documento vinculado",
      description: "Tandem guardo solo el acceso al Google Docs.",
    });
  };

  const retryLinkDocument = async () => {
    if (!unlinkedDoc) return;
    setWorking("link");
    try {
      await persistDocument(unlinkedDoc);
    } catch (error) {
      toast({
        title: "Sigue sin poder vincularse",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking(null);
    }
  };

  const loadSeriesDocs = useCallback(async () => {
    setSeriesLoading(true);
    try {
      const docs = await withGoogleToken(async (token) => {
        const folder = await findSessionFolder(token, session);
        if (!folder) return [];
        return (await listChildren(token, folder.id)).filter(isGoogleDoc);
      });
      setSeriesDocs(docs);
    } catch (error) {
      setSeriesDocs([]);
      toast({
        title: "No se pudieron listar las notas de la serie",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSeriesLoading(false);
    }
  }, [session, toast]);

  const createDriveDocument = async (template: NoteTemplate) => {
    setWorking("create");
    // Referencia al doc ya creado en Drive (si se llega a crear) para poder
    // distinguir "nada se creó" de "se creó pero algo después falló" — en
    // el segundo caso NO hay que reintentar creando un doc nuevo.
    let created: { documentId: string; title?: string } | null = null;
    try {
      const token = await requestGoogleAccessToken(false);
      const title = `${template.id === "blank" ? "Nota" : template.name} - ${session.titulo || "Sesion profesional"} - ${new Date(session.fecha_sesion).toLocaleDateString("es-AR")}`;
      created = await createDoc(token, title);
      await insertBlocks(
        created.documentId,
        token,
        template.blocks(session, patientName),
        template.accent,
      );
      // Organización en Drive (carpeta de la serie + metadata). Si la Drive
      // API todavía no está habilitada, la nota se crea igual, suelta —
      // pero cualquier OTRO error (cuota, permisos, etc.) se avisa: si no,
      // "Notas de la serie" nunca la va a encontrar y nadie se entera.
      try {
        const folder = await resolveSessionFolder(token, session, patientName);
        await moveFile(token, created.documentId, folder.id);
        await setAppProperties(
          token,
          created.documentId,
          noteAppProperties(session, template.id),
        );
      } catch (organizeError) {
        if (!isDriveApiDisabled(organizeError)) {
          toast({
            title: "La nota se creó pero no se pudo organizar en una carpeta",
            description:
              organizeError instanceof Error ? organizeError.message : undefined,
            variant: "destructive",
          });
        }
      }
      await persistDocument({
        id: created.documentId,
        name: created.title || title,
      });
    } catch (error) {
      if (created) {
        setUnlinkedDoc({
          id: created.documentId,
          name: created.title || `Nota - ${session.titulo}`,
        });
        toast({
          title: "El documento se creó en Drive pero no se pudo vincular",
          description:
            "No hace falta crear otro: usá 'Reintentar vínculo' abajo." +
            (error instanceof Error ? ` (${error.message})` : ""),
          variant: "destructive",
        });
      } else {
        toast({
          title: "No se pudo crear el Google Docs",
          description: error instanceof Error ? error.message : undefined,
          variant: "destructive",
        });
      }
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
      await ensureGoogleScripts();
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
      setViewingDoc(null);
      setSeriesDocs(null);
      setSeriesOpen(false);
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

  const linkViewingDoc = async () => {
    if (!viewingDoc) return;
    setWorking("link");
    try {
      await persistDocument({ id: viewingDoc.id, name: viewingDoc.name });
    } catch {
      toast({
        title: "No se pudo vincular el documento",
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
        {unlinkedDoc && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">
                “{unlinkedDoc.name}” se creó en Drive pero no quedó vinculado a
                esta sesión.
              </p>
              <p className="text-xs text-amber-800">
                No crees otra nota: reintentá el vínculo o abrí el documento
                para revisarlo.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="outline" asChild>
                <a
                  href={buildDocsUrl(unlinkedDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={14} />
                  Abrir
                </a>
              </Button>
              <Button size="sm" onClick={retryLinkDocument} disabled={Boolean(working)}>
                {working === "link" ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Link2 size={14} />
                )}
                Reintentar vínculo
              </Button>
            </div>
          </div>
        )}
        <div className="text-center">
          <FileText className="mx-auto mb-3 text-primary" size={34} />
          <h3 className="font-semibold">Crear nota en Google Docs</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Elegi una pagina en blanco o una plantilla. La nota se completa y
            guarda dentro de Google Docs.
          </p>
        </div>

        <NoteTemplateGallery
          session={session}
          patientName={patientName}
          onSelect={createDriveDocument}
          disabled={Boolean(working)}
        />

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

  const activeDoc = viewingDoc || {
    id: document.google_file_id,
    name: document.nombre,
  };
  const docsUrl =
    activeDoc.id === document.google_file_id && document.web_view_url
      ? document.web_view_url
      : buildDocsUrl(activeDoc.id);
  const viewingLinkedDoc = activeDoc.id === document.google_file_id;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{activeDoc.name}</h3>
          <p className="text-xs text-muted-foreground">
            {viewingLinkedDoc
              ? "Google Docs vinculado a esta sesion"
              : "Nota de la serie (sin vincular a esta sesion)"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setNewSessionOpen(true)}>
            <CalendarPlus size={14} />
            Nueva sesion
          </Button>
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
          {viewingLinkedDoc ? (
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
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={linkViewingDoc}
              disabled={working === "link"}
            >
              {working === "link" ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Link2 size={14} />
              )}
              Vincular a esta sesion
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-primary/30 bg-primary/5">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-primary"
          onClick={() => {
            const next = !seriesOpen;
            setSeriesOpen(next);
            if (next && seriesDocs === null) loadSeriesDocs();
          }}
        >
          <span className="flex items-center gap-2">
            <FileText size={15} />
            Ver notas anteriores de esta serie
            {seriesDocs ? ` (${seriesDocs.length})` : ""}
          </span>
          {seriesOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
        {seriesOpen && (
          <div className="border-t px-4 py-3">
            {seriesLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={14} />
                Buscando notas en la carpeta de la serie...
              </p>
            )}
            {!seriesLoading && seriesDocs && seriesDocs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Esta serie todavia no tiene una carpeta con otras notas. Crea una
                con el boton “Nueva sesion”.
              </p>
            )}
            {!seriesLoading && seriesDocs && seriesDocs.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seriesDocs.map((doc) => {
                  const isActive = doc.id === activeDoc.id;
                  const isLinked = doc.id === document.google_file_id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setViewingDoc({ id: doc.id, name: doc.name })}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        isActive
                          ? "border-primary bg-primary/10 font-semibold text-primary"
                          : "hover:border-primary/50"
                      }`}
                    >
                      <FileText size={12} />
                      {doc.name}
                      {isLinked && (
                        <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-medium text-primary">
                          Vinculada
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {isMobile ? (
        // En el celular el Doc embebido suele quedar en blanco por cookies
        // de terceros bloqueadas (Safari, incognito, Chrome cada vez mas
        // estricto) — ahí es mas confiable abrir siempre en pestaña nueva.
        <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-10 text-center">
          <FileText size={40} className="text-primary" />
          <div>
            <p className="font-medium">{activeDoc.name}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Se abre en una pestaña nueva de Google Docs para que puedas
              escribir sin problemas desde el celular.
            </p>
          </div>
          <Button size="lg" asChild>
            <a href={docsUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Abrir el documento
            </a>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <iframe
            key={activeDoc.id}
            title={activeDoc.name}
            src={docsUrl}
            className="h-[720px] w-full rounded-xl border bg-white"
          />
          <p className="text-center text-xs text-muted-foreground">
            ¿No ves el documento? Puede ser por cookies de terceros bloqueadas
            en el navegador —{" "}
            <a
              href={docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline"
            >
              abrilo en una pestaña nueva
            </a>
            .
          </p>
        </div>
      )}

      <NewSessionDialog
        session={session}
        patientName={patientName}
        currentDocId={activeDoc.id}
        open={newSessionOpen}
        onOpenChange={setNewSessionOpen}
        onAppended={() => {
          setSeriesDocs(null);
        }}
        onCreatedDoc={(file) => {
          setViewingDoc(file);
          setSeriesDocs(null);
          setSeriesOpen(false);
        }}
      />
    </div>
  );
}
