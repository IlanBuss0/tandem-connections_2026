import { useState } from 'react';
import { Plus, Edit2, Copy, Trash2, Send, EyeOff, Sparkles, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomActivities } from '@/contexts/CustomActivitiesContext';
import type { User } from '@/data/api';
import ActivityBuilder from './ActivityBuilder';
import { useToast } from '@/components/ui/use-toast';

export default function ActivityManager({ assignableUsers }: { assignableUsers?: User[] }) {
  const { user } = useAuth();
  const { byCreator, remove, duplicate, publish, unpublish } = useCustomActivities();
  const { toast } = useToast();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  if (!user) return null;
  const list = byCreator(user.id);
  const drafts = list.filter(a => a.draft);
  const published = list.filter(a => !a.draft);
  const userNameById = new Map((assignableUsers || []).map(item => [item.id, item.name]));

  const open = (id?: string) => { setEditingId(id); setBuilderOpen(true); };
  const close = () => { setBuilderOpen(false); setEditingId(undefined); };
  const publishDraft = async (id: string) => {
    setPublishingId(id);
    try {
      const assignment = await publish(id);
      if (assignment.denied.length || assignment.errors.length) {
        toast({
          title: assignment.assigned ? 'Actividad publicada parcialmente' : 'No se pudo publicar',
          description: assignment.assigned
            ? 'Algunos vinculados no recibieron la actividad porque el tutor no lo permite.'
            : 'El tutor no permite asignar esta actividad a los vinculados seleccionados.',
          variant: assignment.assigned ? 'default' : 'destructive',
        });
      } else {
        toast({ title: 'Actividad publicada', description: 'La actividad fue asignada correctamente.' });
      }
    } catch (error) {
      toast({
        title: 'No se pudo publicar',
        description: error instanceof Error ? error.message : 'Revisa la conexion con el backend.',
        variant: 'destructive',
      });
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 border border-border flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-semibold text-foreground flex items-center gap-2"><Sparkles size={16} className="text-primary" /> Actividades creadas</h3>
          <p className="text-xs text-muted-foreground">Diseñá actividades a medida y asignalas a tus vinculados.</p>
        </div>
        <Button onClick={() => open()} className="gradient-primary text-primary-foreground shrink-0"><Plus size={14} className="mr-1" /> Nueva</Button>
      </div>

      {list.length === 0 && (
        <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-3xl mb-2">✨</p>
          <p className="text-sm font-semibold text-foreground">Aún no creaste actividades</p>
          <p className="text-xs text-muted-foreground mb-4">Empezá con una plantilla y personalizala.</p>
          <Button onClick={() => open()} className="gradient-primary text-primary-foreground"><Plus size={14} className="mr-1" /> Crear primera actividad</Button>
        </div>
      )}

      {published.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Publicadas ({published.length})</p>
          <div className="space-y-2">
            {published.map(a => <Row key={a.id} a={a} userNameById={userNameById} onEdit={() => open(a.id)} onDuplicate={() => duplicate(a.id)} onRemove={() => remove(a.id)} onUnpublish={() => unpublish(a.id)} />)}
          </div>
        </div>
      )}

      {drafts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Borradores ({drafts.length})</p>
          <div className="space-y-2">
            {drafts.map(a => <Row key={a.id} a={a} userNameById={userNameById} onEdit={() => open(a.id)} onDuplicate={() => duplicate(a.id)} onRemove={() => remove(a.id)} onPublish={() => publishDraft(a.id)} publishing={publishingId === a.id} draft />)}
          </div>
        </div>
      )}

      {builderOpen && <ActivityBuilder initialId={editingId} onClose={close} assignableUsersOverride={assignableUsers} />}
    </div>
  );
}

function Row({ a, draft, userNameById, onEdit, onDuplicate, onRemove, onPublish, onUnpublish, publishing }: any) {
  const assignedNames = (a.assignedToIds || []).map((id: string) => a.assignedNames?.[id] || userNameById?.get(id) || `Usuario ${id}`);
  return (
    <div className="bg-card rounded-lg border border-border p-3">
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{a.stepIcons?.[0] || '📌'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-sm text-foreground truncate">{a.title}</p>
            {draft && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Borrador</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">{a.category} · {a.difficulty} · {a.duration} · {a.points} pts · {a.steps.length} pasos</p>
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Users size={10} /> {assignedNames.length > 0 ? assignedNames.join(', ') : 'sin asignar'}</span>
            {a.dueDate && <span className="flex items-center gap-1"><Calendar size={10} /> {a.dueDate}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onEdit}><Edit2 size={12} className="mr-1" />Editar</Button>
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onDuplicate}><Copy size={12} className="mr-1" />Duplicar</Button>
        {draft
          ? <Button size="sm" className="h-7 px-2 text-xs gradient-primary text-primary-foreground" onClick={onPublish} disabled={publishing}><Send size={12} className="mr-1" />{publishing ? 'Publicando...' : 'Publicar'}</Button>
          : <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onUnpublish}><EyeOff size={12} className="mr-1" />Despublicar</Button>}
        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={onRemove}><Trash2 size={12} /></Button>
      </div>
    </div>
  );
}
