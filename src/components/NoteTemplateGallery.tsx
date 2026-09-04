import { useEffect, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import NoteTemplatePreview from "@/components/NoteTemplatePreview";
import { noteTemplates, type NoteTemplate } from "@/data/noteTemplates";
import {
  deleteNoteTemplateFavorite,
  fetchNoteTemplateFavorites,
  saveNoteTemplateFavorite,
  type ProfessionalSession,
} from "@/data/api";

export default function NoteTemplateGallery({
  session,
  patientName,
  onSelect,
  disabled,
}: {
  session: ProfessionalSession;
  patientName?: string;
  onSelect: (template: NoteTemplate) => void;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [selected, setSelected] = useState<NoteTemplate | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchNoteTemplateFavorites()
      .then((ids) => {
        if (!cancelled) setFavorites(new Set(ids));
      })
      .catch(() => {
        // sin favoritos previos o sin conexion: la grilla igual funciona
      })
      .finally(() => {
        if (!cancelled) setFavoritesLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFavorite = async (template: NoteTemplate) => {
    const wasFavorite = favorites.has(template.id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(template.id);
      else next.add(template.id);
      return next;
    });
    try {
      if (wasFavorite) await deleteNoteTemplateFavorite(template.id);
      else await saveNoteTemplateFavorite(template.id);
    } catch {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(template.id);
        else next.delete(template.id);
        return next;
      });
      toast({ title: "No se pudo actualizar favoritos", variant: "destructive" });
    }
  };

  const visibleTemplates =
    filter === "favorites"
      ? noteTemplates.filter((template) => favorites.has(template.id))
      : noteTemplates;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
          }`}
        >
          Todas
        </button>
        <button
          type="button"
          onClick={() => setFilter("favorites")}
          className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "favorites" ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:border-primary/40"
          }`}
        >
          <Heart size={12} />
          Favoritas{favorites.size ? ` (${favorites.size})` : ""}
        </button>
      </div>

      {filter === "favorites" && favoritesLoaded && visibleTemplates.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Todavía no marcaste ninguna plantilla como favorita.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => setSelected(template)}
            disabled={disabled}
            className="group relative overflow-hidden rounded-lg border bg-background text-left transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md disabled:pointer-events-none disabled:opacity-60"
          >
            <div className="flex justify-center bg-muted/30 p-3">
              <NoteTemplatePreview
                blocks={template.blocks(session, patientName)}
                accent={template.accent}
                className="h-40 w-auto"
              />
            </div>
            {favorites.has(template.id) && (
              <Heart size={16} className="absolute right-2 top-2 fill-red-500 text-red-500" />
            )}
            <div className="p-3">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.name}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <NoteTemplatePreview
                  blocks={selected.blocks(session, patientName)}
                  accent={selected.accent}
                  className="h-64 w-auto"
                />
              </div>
              <p className="text-sm text-muted-foreground">{selected.description}</p>
              <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
                <Button variant="outline" onClick={() => toggleFavorite(selected)}>
                  <Heart
                    size={14}
                    className={favorites.has(selected.id) ? "fill-red-500 text-red-500" : undefined}
                  />
                  {favorites.has(selected.id) ? "Quitar de favoritas" : "Marcar favorita"}
                </Button>
                <Button
                  onClick={() => {
                    onSelect(selected);
                    setSelected(null);
                  }}
                  disabled={disabled}
                >
                  <Plus size={15} />
                  Usar esta plantilla
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
