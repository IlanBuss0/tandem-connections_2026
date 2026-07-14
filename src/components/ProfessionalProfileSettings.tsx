import { useEffect, useState } from 'react';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchProfessionalOwnProfile, saveProfessionalOwnProfile, type ProfessionalOwnProfile } from '@/data/api';

type FormState = {
  descripcion: string; experiencia: string; precio_sesion: string; informacion_precio: string;
  modalidad: string; disponibilidad: string; correo_contacto: string; whatsapp_contacto: string;
  visible_en_tienda: boolean; publicar_correo: boolean; publicar_whatsapp: boolean;
};
const empty: FormState = { descripcion: '', experiencia: '', precio_sesion: '', informacion_precio: '', modalidad: '', disponibilidad: '', correo_contacto: '', whatsapp_contacto: '', visible_en_tienda: false, publicar_correo: false, publicar_whatsapp: false };

export default function ProfessionalProfileSettings() {
  const { toast } = useToast();
  const [data, setData] = useState<ProfessionalOwnProfile | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchProfessionalOwnProfile().then(result => { setData(result); const p = result.perfil; setForm({ descripcion: p?.descripcion || '', experiencia: p?.experiencia || '', precio_sesion: p?.precio_sesion == null ? '' : String(p.precio_sesion), informacion_precio: p?.informacion_precio || '', modalidad: p?.modalidad || '', disponibilidad: p?.disponibilidad || '', correo_contacto: p?.correo_contacto || '', whatsapp_contacto: p?.whatsapp_contacto || '', visible_en_tienda: Boolean(p?.visible_en_tienda), publicar_correo: Boolean(p?.publicar_correo), publicar_whatsapp: Boolean(p?.publicar_whatsapp) }); }).catch(() => toast({ title: 'No se pudo cargar tu perfil', variant: 'destructive' })).finally(() => setLoading(false)); }, [toast]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const save = async () => { setSaving(true); try { const result = await saveProfessionalOwnProfile(form); setData(result); toast({ title: 'Perfil profesional guardado' }); } catch (error) { toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : undefined, variant: 'destructive' }); } finally { setSaving(false); } };
  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  return <div className="space-y-5"><div><h2 className="font-heading text-xl font-bold">Mi perfil profesional</h2><p className="text-sm text-muted-foreground">Controla cómo apareces en el directorio para tutores y pertenecientes.</p></div><div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2"><ShieldCheck className="text-primary" size={18} /><p className="font-semibold">Datos profesionales verificados</p></div><p className="mt-2 text-sm">{data?.profesional.profesion}{data?.profesional.especialidad ? ` · ${data.profesional.especialidad}` : ''}</p><p className="text-xs text-muted-foreground">Matricula: {data?.profesional.matricula} · {data?.profesional.institucion || 'Sin institucion'}</p></div><div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Presentacion</Label><Textarea rows={4} value={form.descripcion} onChange={e => update('descripcion', e.target.value)} placeholder="Conta cómo trabajas y a quién acompañas." /></div><div className="space-y-2 sm:col-span-2"><Label>Experiencia</Label><Textarea rows={3} value={form.experiencia} onChange={e => update('experiencia', e.target.value)} /></div><div className="space-y-2"><Label>Modalidad</Label><Input value={form.modalidad} onChange={e => update('modalidad', e.target.value)} placeholder="Virtual, presencial o mixta" /></div><div className="space-y-2"><Label>Disponibilidad</Label><Input value={form.disponibilidad} onChange={e => update('disponibilidad', e.target.value)} placeholder="Lunes a viernes por la tarde" /></div><div className="space-y-2"><Label>Precio por sesion</Label><Input type="number" min="0" value={form.precio_sesion} onChange={e => update('precio_sesion', e.target.value)} /></div><div className="space-y-2"><Label>Informacion del precio</Label><Input value={form.informacion_precio} onChange={e => update('informacion_precio', e.target.value)} placeholder="Consultar cobertura o bonificaciones" /></div><div className="space-y-2"><Label>Correo profesional</Label><Input type="email" value={form.correo_contacto} onChange={e => update('correo_contacto', e.target.value)} /></div><div className="flex items-end gap-3 pb-2"><Switch checked={form.publicar_correo} onCheckedChange={value => update('publicar_correo', value)} /><span className="text-sm">Mostrar correo en el directorio</span></div><div className="space-y-2"><Label>WhatsApp profesional</Label><Input value={form.whatsapp_contacto} onChange={e => update('whatsapp_contacto', e.target.value)} placeholder="+5491123456789" /></div><div className="flex items-end gap-3 pb-2"><Switch checked={form.publicar_whatsapp} onCheckedChange={value => update('publicar_whatsapp', value)} /><span className="text-sm">Mostrar WhatsApp en el directorio</span></div><div className="flex items-center gap-3 rounded-lg border p-3 sm:col-span-2"><Switch checked={form.visible_en_tienda} onCheckedChange={value => update('visible_en_tienda', value)} /><div><p className="text-sm font-medium">Publicar mi perfil</p><p className="text-xs text-muted-foreground">Solo aparecerá si tu validación profesional está aprobada.</p></div></div></div><Button onClick={save} disabled={saving} className="w-full sm:w-auto"><Save size={15} className="mr-2" />{saving ? 'Guardando...' : 'Guardar perfil'}</Button></div>;
}
