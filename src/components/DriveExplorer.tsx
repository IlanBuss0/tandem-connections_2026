import { useCallback, useMemo, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  Folder,
  FolderInput,
  FolderPlus,
  HardDrive,
  Loader2,
  MoreVertical,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { GOOGLE_CONSENT_STORAGE_KEY, withGoogleToken } from "@/lib/googleAuth";
import {
  createFolder,
  isFolder,
  listAllFiles,
  moveFile,
  renameFile,
  trashFile,
  type DriveFile,
} from "@/lib/googleDrive";

type Crumb = { id: string; name: string };

const DRAG_MIME = "application/x-tandem-drive-file";

export default function DriveExplorer() {
  const { toast } = useToast();
  const [connected, setConnected] = useState(
    () => localStorage.getItem(GOOGLE_CONSENT_STORAGE_KEY) === "1",
  );
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [path, setPath] = useState<Crumb[]>([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState<DriveFile | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const currentFolderId = path.length ? path[path.length - 1].id : null;
  const folderIds = useMemo(
    () => new Set(files.filter(isFolder).map((file) => file.id)),
    [files],
  );
  const allFolders = useMemo(
    () =>
      files
        .filter(isFolder)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [files],
  );

  const visibleItems = useMemo(() => {
    const inCurrent = files.filter((file) => {
      if (currentFolderId) return file.parents?.includes(currentFolderId);
      // Raíz: nada de sus parents es una carpeta visible para la app.
      return !(file.parents || []).some((parent) => folderIds.has(parent));
    });
    return inCurrent.sort((a, b) => {
      if (isFolder(a) !== isFolder(b)) return isFolder(a) ? -1 : 1;
      return a.name.localeCompare(b.name, "es");
    });
  }, [files, currentFolderId, folderIds]);

  const notifyError = useCallback(
    (title: string, error: unknown) => {
      toast({
        title,
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
    [toast],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const all = await withGoogleToken((token) => listAllFiles(token));
      setFiles(all);
      setLoaded(true);
      setConnected(true);
    } catch (error) {
      notifyError("No se pudo cargar Google Drive", error);
    } finally {
      setLoading(false);
    }
  }, [notifyError]);

  const runMove = async (file: DriveFile, targetFolderId: string) => {
    if (file.id === targetFolderId) return;
    setWorking(true);
    try {
      await withGoogleToken((token) =>
        moveFile(token, file.id, targetFolderId, file.parents?.join(",")),
      );
      toast({ title: "Archivo movido" });
      await refresh();
    } catch (error) {
      notifyError("No se pudo mover el archivo", error);
    } finally {
      setWorking(false);
    }
  };

  const submitNewFolder = async () => {
    const name = newFolderName.trim();
    if (!name) return;
    setWorking(true);
    try {
      await withGoogleToken((token) =>
        createFolder(token, name, currentFolderId || undefined),
      );
      setNewFolderOpen(false);
      setNewFolderName("");
      toast({ title: "Carpeta creada" });
      await refresh();
    } catch (error) {
      notifyError("No se pudo crear la carpeta", error);
    } finally {
      setWorking(false);
    }
  };

  const submitRename = async () => {
    const name = renameValue.trim();
    if (!renameTarget || !name) return;
    setWorking(true);
    try {
      await withGoogleToken((token) => renameFile(token, renameTarget.id, name));
      setRenameTarget(null);
      toast({ title: "Nombre actualizado" });
      await refresh();
    } catch (error) {
      notifyError("No se pudo renombrar", error);
    } finally {
      setWorking(false);
    }
  };

  const sendToTrash = async (file: DriveFile) => {
    setWorking(true);
    try {
      await withGoogleToken((token) => trashFile(token, file.id));
      toast({
        title: "Enviado a la papelera",
        description: "Podés restaurarlo desde la papelera de Google Drive.",
      });
      await refresh();
    } catch (error) {
      notifyError("No se pudo enviar a la papelera", error);
    } finally {
      setWorking(false);
    }
  };

  const handleDrop = (targetFolderId: string) => (event: React.DragEvent) => {
    event.preventDefault();
    setDragOverId(null);
    try {
      const payload = JSON.parse(event.dataTransfer.getData(DRAG_MIME));
      const file = files.find((item) => item.id === payload?.fileId);
      if (file) runMove(file, targetFolderId);
    } catch {
      // drag ajeno: se ignora
    }
  };

  const dropTargetProps = (targetFolderId: string) => ({
    onDragOver: (event: React.DragEvent) => {
      if (!event.dataTransfer.types.includes(DRAG_MIME)) return;
      event.preventDefault();
      setDragOverId(targetFolderId);
    },
    onDragLeave: () => setDragOverId((id) => (id === targetFolderId ? null : id)),
    onDrop: handleDrop(targetFolderId),
  });

  if (!connected || !loaded) {
    return (
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-foreground">Documentos</h2>
        <div className="rounded-xl border border-dashed bg-card p-8 text-center">
          <HardDrive className="mx-auto mb-3 text-primary" size={34} />
          <h3 className="font-semibold">Tus notas y carpetas de Google Drive</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Organizá las notas de tus sesiones en carpetas sin salir de Tándem.
            Solo se muestran los archivos creados con Tándem.
          </p>
          <Button className="mt-4" onClick={refresh} disabled={loading}>
            {loading ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <HardDrive size={15} />
            )}
            Conectar Google Drive
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading font-bold text-xl text-foreground">Documentos</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setNewFolderOpen(true)} disabled={working}>
            <FolderPlus size={14} />
            Nueva carpeta
          </Button>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading || working}>
            <RefreshCw size={14} className={loading ? "animate-spin" : undefined} />
            Refrescar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1 text-sm">
        <button
          type="button"
          onClick={() => setPath([])}
          className={`flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
            dragOverId === "root" ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-muted"
          } ${path.length === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
          {...dropTargetProps("root")}
        >
          <HardDrive size={14} />
          Mi unidad
        </button>
        {path.map((crumb, index) => (
          <span key={crumb.id} className="flex items-center gap-1">
            <ChevronRight size={13} className="text-muted-foreground" />
            <button
              type="button"
              onClick={() => setPath(path.slice(0, index + 1))}
              className={`rounded-md px-2 py-1 transition-colors ${
                dragOverId === crumb.id ? "bg-primary/15 ring-1 ring-primary" : "hover:bg-muted"
              } ${index === path.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
              {...dropTargetProps(crumb.id)}
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      {visibleItems.length === 0 && !loading && (
        <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          {currentFolderId
            ? "Esta carpeta está vacía. Arrastrá archivos hasta acá para moverlos (o usá “Mover a...” desde el menú “⋮” en el celular)."
            : "Todavía no hay documentos creados con Tándem."}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {visibleItems.map((file) => {
          const folder = isFolder(file);
          return (
            <div
              key={file.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  DRAG_MIME,
                  JSON.stringify({ fileId: file.id }),
                );
                event.dataTransfer.effectAllowed = "move";
              }}
              {...(folder ? dropTargetProps(file.id) : {})}
              className={`flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                folder ? "cursor-pointer" : "cursor-grab"
              } ${dragOverId === file.id ? "border-primary bg-primary/10" : "hover:border-primary/40"}`}
              onClick={() => {
                if (folder) setPath([...path, { id: file.id, name: file.name }]);
              }}
              {...(folder
                ? {
                    role: "button",
                    tabIndex: 0,
                    "aria-label": `Abrir carpeta ${file.name}`,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setPath([...path, { id: file.id, name: file.name }]);
                      }
                    },
                  }
                : { "aria-label": file.name })}
            >
              {folder ? (
                <Folder size={22} className="shrink-0 text-amber-500" fill="currentColor" fillOpacity={0.25} />
              ) : (
                <FileText size={22} className="shrink-0 text-blue-600" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                {file.modifiedTime && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(file.modifiedTime).toLocaleDateString("es-AR")}
                  </p>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(event) => event.stopPropagation()}
                    disabled={working}
                  >
                    <MoreVertical size={15} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                  {!folder && file.webViewLink && (
                    <DropdownMenuItem onClick={() => window.open(file.webViewLink, "_blank")}>
                      <ExternalLink size={14} className="mr-2" />
                      Abrir en Google Docs
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setMoveTarget(file)}>
                    <FolderInput size={14} className="mr-2" />
                    Mover a...
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameTarget(file);
                      setRenameValue(file.name);
                    }}
                  >
                    <Pencil size={14} className="mr-2" />
                    Renombrar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => sendToTrash(file)}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Enviar a papelera
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        En computadora: arrastrá un archivo sobre una carpeta (o sobre “Mi
        unidad”) para moverlo. Desde el celular, usá el menú “⋮” de cada
        archivo → “Mover a...”.
      </p>

      {/* Nueva carpeta */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva carpeta</DialogTitle>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="Nombre de la carpeta"
            onKeyDown={(event) => event.key === "Enter" && submitNewFolder()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitNewFolder} disabled={working || !newFolderName.trim()}>
              {working ? <Loader2 className="animate-spin" size={15} /> : <FolderPlus size={15} />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renombrar */}
      <Dialog open={Boolean(renameTarget)} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Renombrar</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submitRename()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancelar
            </Button>
            <Button onClick={submitRename} disabled={working || !renameValue.trim()}>
              {working ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mover a... */}
      <Dialog open={Boolean(moveTarget)} onOpenChange={(open) => !open && setMoveTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Mover “{moveTarget?.name}” a...</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border p-2 text-sm hover:border-primary"
              onClick={() => {
                if (moveTarget) runMove(moveTarget, "root");
                setMoveTarget(null);
              }}
            >
              <HardDrive size={16} />
              Mi unidad (raíz)
            </button>
            {allFolders
              .filter((folder) => folder.id !== moveTarget?.id)
              .map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg border p-2 text-sm hover:border-primary"
                  onClick={() => {
                    if (moveTarget) runMove(moveTarget, folder.id);
                    setMoveTarget(null);
                  }}
                >
                  <Folder size={16} className="text-amber-500" />
                  {folder.name}
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
