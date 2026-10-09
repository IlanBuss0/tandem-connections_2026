import { useEffect, useState, type ReactNode } from 'react';
import { Loader2, Save, ShieldCheck, Stethoscope, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchProfessionalOwnProfile, saveProfessionalOwnProfile, type ProfessionalOwnProfile, type User } from '@/data/api';
import { ProfileBase, ProfileHeroAvatar, ProfileInfoGrid, ProfileLayout, ProfileLoading } from '@/components/account/ProfileLayout';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfessionalTab } from '@/components/professional/ProfessionalNavigation';

type FormState = { descripcion: string; experiencia: string; precio_sesion: string; informacion_precio: string; modalidad: string; disponibilidad: string; correo_contacto: string; whatsapp_contacto: string; visible_en_tienda: boolean; publicar_correo: boolean; publicar_whatsapp: boolean };

const empty: FormState = { descripcion: '', experiencia: '', precio_sesion: '', informacion_precio: '', modalidad: '', disponibilidad: '', correo_contacto: '', whatsapp_contacto: '', visible_en_tienda: false, publicar_correo: false, publicar_whatsapp: false };

/**
 * Mi perfil del profesional: misma base visual que el Perteneciente y el Tutor
 * (ProfileBase). Muestra los datos verificados de la cuenta y de la práctica,
 * y deja editar aquí el contenido público del perfil (presentación, atención,
 * contacto y visibilidad) — la Configuración queda reservada para la cuenta.
 */
export default function ProfessionalProfile({ patients, onNavigate }: { patients: Array<User & { autonomy?: string }>; onNavigate: (tab: ProfessionalTab) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<ProfessionalOwnProfile | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfessionalOwnProfile()
      .then(result => {
        setData(result);
        const profile = result.perfil;
        setForm({
          descripcion: profile?.descripcion || '',
          experiencia: profile?.experiencia || '',
          precio_sesion: profile?.precio_sesion == null ? '' : String(profile.precio_sesion),
          informacion_precio: profile?.informacion_precio || '',
          modalidad: profile?.modalidad || '',
          disponibilidad: profile?.disponibilidad || '',
          correo_contacto: profile?.correo_contacto || '',
          whatsapp_contacto: profile?.whatsapp_contacto || '',
          visible_en_tienda: Boolean(profile?.visible_en_tienda),
          publicar_correo: Boolean(profile?.publicar_correo),
          publicar_whatsapp: Boolean(profile?.publicar_whatsapp),
        });
      })
      .catch(() => toast({ title: 'No se pudo cargar tu perfil', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [toast]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(prev => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      const result = await saveProfessionalOwnProfile(form);
      setData(result);
      toast({ title: 'Perfil profesional guardado' });
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : undefined, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ProfileLayout><ProfileLoading /></ProfileLayout>;

  const professional = data?.profesional;
  const profile = data?.perfil;
  const relations = patients.map(patient => ({
    id: patient.id,
    name: patient.name,
    detail: [patient.supportLevel, patient.autonomy].filter(Boolean).join(' · ') || 'Perteneciente vinculado',
  }));

  return (
    <ProfileBase
      hero={{
        avatar: <ProfileHeroAvatar><HeaderUserAvatar avatar={user?.avatar} name={user?.name} /></ProfileHeroAvatar>,
        name: user?.name || 'Profesional',
        username: user?.username,
        roleLabel: 'Profesional',
        secondary: [professional?.profesion, professional?.especialidad].filter(Boolean).join(' · '),
        metrics: [
          { label: 'Vinculados', value: patients.length },
          { label: 'Perfil', value: profile?.visible_en_tienda ? 'Público' : 'Privado' },
          { label: 'Modalidad', value: profile?.modalidad || 'Sin definir' },
        ],
        onSettings: () => onNavigate('profile-settings'),
      }}
      data={{
        items: [
          { label: 'Correo', value: user?.email || 'Sin registrar' },
          { label: 'Usuario', value: user?.username ? `@${user.username}` : 'Sin registrar' },
        ],
      }}
      roleSection={{
        title: 'Información profesional',
        description: 'Datos verificados de tu práctica',
        icon: ShieldCheck,
        children: (
          <ProfileInfoGrid items={[
            { label: 'Profesión', value: professional?.profesion || 'Sin registrar' },
            { label: 'Especialidad', value: professional?.especialidad || 'Sin registrar' },
            { label: 'Matrícula', value: professional?.matricula || 'Sin registrar' },
            { label: 'Institución', value: professional?.institucion || 'Sin registrar' },
          ]} />
        ),
      }}
      extraSections={[
        {
          title: 'Perfil público',
          description: 'Así te mostrás en el directorio',
          icon: Stethoscope,
          children: (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field wide label="Presentación"><Textarea rows={4} value={form.descripcion} onChange={e => update('descripcion', e.target.value)} placeholder="Contá cómo trabajás y a quién acompañás." /></Field>
                <Field wide label="Experiencia"><Textarea rows={3} value={form.experiencia} onChange={e => update('experiencia', e.target.value)} /></Field>
                <Field label="Modalidad"><Input value={form.modalidad} onChange={e => update('modalidad', e.target.value)} placeholder="Virtual, presencial o mixta" /></Field>
                <Field label="Disponibilidad"><Input value={form.disponibilidad} onChange={e => update('disponibilidad', e.target.value)} /></Field>
                <Field label="Precio por sesión"><Input type="number" min="0" value={form.precio_sesion} onChange={e => update('precio_sesion', e.target.value)} /></Field>
                <Field label="Información del precio"><Input value={form.informacion_precio} onChange={e => update('informacion_precio', e.target.value)} /></Field>
                <Field label="Correo profesional"><Input type="email" value={form.correo_contacto} onChange={e => update('correo_contacto', e.target.value)} /></Field>
                <Toggle checked={form.publicar_correo} onChange={value => update('publicar_correo', value)} label="Mostrar correo" />
                <Field label="WhatsApp profesional"><Input value={form.whatsapp_contacto} onChange={e => update('whatsapp_contacto', e.target.value)} /></Field>
                <Toggle checked={form.publicar_whatsapp} onChange={value => update('publicar_whatsapp', value)} label="Mostrar WhatsApp" />
                <div className="flex items-center gap-3 rounded-2xl border border-[#ebe3f3] bg-[#fcfaff] p-3 sm:col-span-2">
                  <Switch checked={form.visible_en_tienda} onCheckedChange={value => update('visible_en_tienda', value)} />
                  <div>
                    <p className="text-sm font-medium">Publicar mi perfil</p>
                    <p className="text-xs text-muted-foreground">Solo aparecerá si tu validación profesional está aprobada.</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={save} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#6933b4] px-6 text-sm font-bold text-white shadow-md transition-colors hover:bg-[#6933b4]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60">
                  {saving ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Save size={16} aria-hidden />}
                  Guardar cambios
                </button>
              </div>
            </>
          ),
        },
      ]}
      relations={{
        title: 'Pertenecientes vinculados',
        description: 'Personas que acompañás actualmente',
        icon: Users,
        items: relations,
        emptyText: 'Todavía no hay pertenecientes vinculados.',
      }}
    />
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={`space-y-2 ${wide ? 'sm:col-span-2' : ''}`}><Label>{label}</Label>{children}</div>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <label className="flex min-h-11 items-center gap-3 rounded-2xl border border-[#ebe3f3] px-3 text-sm"><Switch checked={checked} onCheckedChange={onChange} />{label}</label>;
}
