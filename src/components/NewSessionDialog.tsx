import { useEffect, useState } from "react";
import { CalendarPlus, FilePlus2, Loader2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { GoogleApiError, withGoogleToken } from "@/lib/googleAuth";
import {
  createDoc,
  getDocEndIndex,
  insertBlocks,
  type Block,
} from "@/lib/googleDocs";
import {
  getFile,
  moveFile,
  noteAppProperties,
  resolveSessionFolder,
  setAppProperties,
} from "@/lib/googleDrive";
import { findTemplate, noteTemplates } from "@/data/noteTemplates";
import type { ProfessionalSession } from "@/data/api";

type Mode = "append" | "new-doc";

function isDriveApiDisabled(error: unknown) {
  return (
    error instanceof GoogleApiError &&
    (error.reason === "accessNotConfigured" || error.reason === "SERVICE_DISABLED")
  );
}

function todayShort() {
  return new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export default function NewSessionDialog({
  session,
  patientName,
  currentDocId,
  open,
  onOpenChange,
  onAppended,
  onCreatedDoc,
}: {
  session: ProfessionalSession;
  patientName?: string;
  currentDocId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppended: () => void;
  onCreatedDoc: (file: { id: string; name: string }) => void;
}) {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>("append");
  const [templateId, setTemplateId] = useState("therapy-session");
  const [working, setWorking] = useState(false);

  // Al abrir, propone la plantilla usada la última vez (guardada en el Doc).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    withGoogleToken((token) => getFile(token, currentDocId, "appProperties"))
      .then((file) => {
        const saved = file.appProperties?.tandemTemplateId;
        if (!cancelled && findTemplate(saved)) setTemplateId(saved!);
      })
      .catch(() => {
        // sin Drive API o sin metadata: se mantiene el default
      });
    return () => {
      cancelled = true;
    };
  }, [open, currentDocId]);

  const run = async () => {
    const template = findTemplate(templateId) || noteTemplates[1];
    const todaySession: ProfessionalSession = {
      ...session,
      fecha_sesion: new Date().toISOString(),
    };

    setWorking(true);
    try {
      if (mode === "append") {
        await withGoogleToken(async (token) => {
          const endIndex = await getDocEndIndex(token, currentDocId);
          const blocks: Block[] = [
            { kind: "pageBreak" },
            { kind: "heading", level: 1, text: `Sesión ${todayShort()}` },
            ...template
              .blocks(todaySession, patientName)
              .filter((block) => block.kind !== "title"),
          ];
          await insertBlocks(currentDocId, token, blocks, template.accent, {
            startIndex: endIndex - 1,
          });
          try {
            await setAppProperties(
              token,
              currentDocId,
              noteAppProperties(session, template.id),
            );
          } catch (metadataError) {
            if (!isDriveApiDisabled(metadataError)) {
              toast({
                title: "La sección se agregó, pero no se pudo actualizar la plantilla por defecto",
                description:
                  metadataError instanceof Error ? metadataError.message : undefined,
                variant: "destructive",
              });
            }
          }
        });
        toast({
          title: `Sesión ${todayShort()} agregada`,
          description: "La nueva sección aparece en el índice del documento.",
        });
        onOpenChange(false);
        onAppended();
        return;
      }

      const created = await withGoogleToken(async (token) => {
        const folder = await resolveSessionFolder(token, session, patientName);
        const title = `${todayShort()} · ${session.titulo || "Sesión"}`;
        const doc = await createDoc(token, title);
        // A partir de acá el doc ya existe en Drive: si algo falla, se
        // devuelve igual (con el error adjunto) para no perder la
        // referencia y no arriesgarse a que un reintento cree un duplicado.
        try {
          await moveFile(token, doc.documentId, folder.id);
          await insertBlocks(
            doc.documentId,
            token,
            template.blocks(todaySession, patientName),
            template.accent,
          );
          await setAppProperties(
            token,
            doc.documentId,
            noteAppProperties(session, template.id),
          );
          return { id: doc.documentId, name: doc.title || title, folder: folder.name, partialError: null as unknown };
        } catch (partialError) {
          return { id: doc.documentId, name: doc.title || title, folder: folder.name, partialError };
        }
      });
      if (created.partialError) {
        toast({
          title: "El documento se creó pero quedó incompleto",
          description:
            created.partialError instanceof Error
              ? created.partialError.message
              : "No se pudo terminar de organizar o completar la plantilla.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Nota creada",
          description: `“${created.name}” quedó en la carpeta “${created.folder}”.`,
        });
      }
      onOpenChange(false);
      onCreatedDoc({ id: created.id, name: created.name });
    } catch (error) {
      toast({
        title: "No se pudo crear la nueva sesión",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !working && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus size={18} className="text-primary" />
            Nueva sesión ({todayShort()})
          </DialogTitle>
          <DialogDescription>
            Agregá la nota de hoy: como sección nueva en este documento o como
            documento aparte dentro de la carpeta de la serie.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={mode} onValueChange={(value) => setMode(value as Mode)} className="gap-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              mode === "append" ? "border-primary bg-primary/5" : ""
            }`}
          >
            <RadioGroupItem value="append" className="mt-0.5" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <ListPlus size={14} />
                Sección en este documento
              </span>
              <span className="text-xs text-muted-foreground">
                Salto de página + título “Sesión {todayShort()}” (aparece en el
                índice lateral del Doc) + la plantilla.
              </span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              mode === "new-doc" ? "border-primary bg-primary/5" : ""
            }`}
          >
            <RadioGroupItem value="new-doc" className="mt-0.5" />
            <span>
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <FilePlus2 size={14} />
                Documento nuevo en la carpeta
              </span>
              <span className="text-xs text-muted-foreground">
                Crea “{todayShort()} · {session.titulo || "Sesión"}” dentro de la
                carpeta de Drive de esta serie.
              </span>
            </span>
          </label>
        </RadioGroup>

        <div className="space-y-1.5">
          <Label>Plantilla</Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {noteTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: template.accent }}
                    />
                    {template.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={working}>
            Cancelar
          </Button>
          <Button onClick={run} disabled={working}>
            {working ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <CalendarPlus size={15} />
            )}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
