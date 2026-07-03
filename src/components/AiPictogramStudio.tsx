import { useEffect, useState } from 'react';
import { Loader2, Save, Send, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { aiPictogramsApi, type AiCreation, type AiGeneration, type AiTarget } from '@/services/ai-pictograms';
import { fetchPictograms, type Pictogram } from '@/data/api';

const categories = ['acciones y rutinas','actividades','casa','comida','comunicacion','emociones','escuela y aprendizaje','higiene','lugares','objetos','ocio','personas','salud y cuerpo','transporte','vida diaria','otros'];

export default function AiPictogramStudio() {
  const { toast } = useToast();
  const [targets, setTargets] = useState<AiTarget[]>([]), [mine, setMine] = useState<AiCreation[]>([]);
  const [target, setTarget] = useState(''), [name, setName] = useState(''), [description, setDescription] = useState('');
  const [category, setCategory] = useState('otros'), [mode, setMode] = useState<'quick'|'final'>('quick');
  const [reference, setReference] = useState<File|null>(null), [hasPeople, setHasPeople] = useState(false);
  const [catalogQuery,setCatalogQuery]=useState(''), [catalog,setCatalog]=useState<Pictogram[]>([]), [referencePic,setReferencePic]=useState<Pictogram|null>(null);
  const [preview, setPreview] = useState<AiGeneration|null>(null), [busy, setBusy] = useState(false);
  const load = async () => { const [t, m] = await Promise.all([aiPictogramsApi.targets(), aiPictogramsApi.mine()]); setTargets(t); setMine(m); setTarget(v => v || String(t[0]?.id || '')); };
  useEffect(() => { load().catch(e => toast({ title: 'No se pudo cargar', description: e.message, variant: 'destructive' })); }, []);
  const generate = async () => { setBusy(true); try { const data = new FormData(); Object.entries({ targetPertenecienteId: target, name, description, category, mode: reference||referencePic ? 'final' : mode, referenceHadPeople: String(hasPeople) }).forEach(([k,v]) => data.set(k,v)); if(reference) data.set('reference',reference); if(referencePic)data.set('referencePictogramId',referencePic.id); setPreview(await aiPictogramsApi.generate(data)); } catch(e) { toast({ title:'No se pudo generar', description:e instanceof Error?e.message:'Error inesperado', variant:'destructive' }); } finally { setBusy(false); } };
  const save = async () => { if(!preview)return; setBusy(true); try { await aiPictogramsApi.save(preview.id); setPreview(null); await load(); toast({title:'Guardado en privado'}); } finally { setBusy(false); } };
  const discard = async () => { if(preview){ await aiPictogramsApi.discard(preview.id); setPreview(null); } };
  const submit = async (id:string) => { await aiPictogramsApi.submit(id); await load(); toast({title:'Enviado a revision'}); };
  const correct = async (item:AiCreation) => { const nextName=window.prompt('Nombre corregido',item.name); if(!nextName)return; const nextDescription=window.prompt('Descripcion corregida',item.description||'') ?? item.description ?? ''; await aiPictogramsApi.update(item.id,{name:nextName,description:nextDescription,category:item.category}); await load(); toast({title:'Correcciones guardadas'}); };
  return <div className="space-y-6">
    <header><h2 className="font-heading text-2xl font-bold">Crear pictograma con IA</h2><p className="text-sm text-muted-foreground">Queda privado para el perteneciente hasta que solicites su publicacion.</p></header>
    <div className="grid gap-5 rounded-2xl border bg-card p-5 md:grid-cols-2">
      <div className="space-y-4">
        <Select value={target} onValueChange={setTarget}><SelectTrigger><SelectValue placeholder="Perteneciente"/></SelectTrigger><SelectContent>{targets.map(x=><SelectItem key={x.id} value={String(x.id)}>{x.name}</SelectItem>)}</SelectContent></Select>
        <Input value={name} onChange={e=>setName(e.target.value)} maxLength={160} placeholder="Nombre del pictograma"/>
        <Textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={1200} placeholder="Describe exactamente que debe comunicar"/>
        <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{categories.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
        <div className="grid grid-cols-2 gap-2"><Button type="button" variant={mode==='quick'&&!reference&&!referencePic?'default':'outline'} onClick={()=>!reference&&!referencePic&&setMode('quick')}>Rapido - Schnell</Button><Button type="button" variant={mode==='final'||!!reference||!!referencePic?'default':'outline'} onClick={()=>setMode('final')}>Final - FLUX 2 Pro</Button></div>
        <div><p className="mb-1 text-xs text-muted-foreground">Subir referencia opcional (activa modo final)</p><Input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0]||null;setReference(f);if(f){setReferencePic(null);setMode('final');}}}/>{reference&&<label className="mt-2 flex gap-2 text-xs"><input type="checkbox" checked={hasPeople} onChange={e=>setHasPeople(e.target.checked)}/>Contiene una persona</label>}</div>
        <div><p className="mb-1 text-xs text-muted-foreground">O elegir un pictograma del catalogo</p><div className="flex gap-2"><Input value={catalogQuery} onChange={e=>setCatalogQuery(e.target.value)} placeholder="Buscar referencia"/><Button type="button" variant="outline" onClick={()=>fetchPictograms({search:catalogQuery,limit:8}).then(setCatalog)}>Buscar</Button></div>{catalog.length>0&&<div className="mt-2 grid grid-cols-4 gap-2">{catalog.map(pic=><button type="button" key={pic.id} onClick={()=>{setReferencePic(pic);setReference(null);setMode('final');}} className={'rounded border p-1 '+(referencePic?.id===pic.id?'border-primary ring-2 ring-primary/20':'')}><img src={pic.imageUrl} alt={pic.name} className="aspect-square w-full object-contain"/><span className="block truncate text-[10px]">{pic.name}</span></button>)}</div>}</div>
        <Button onClick={generate} disabled={busy||!target||name.trim().length<2||description.trim().length<5}>{busy?<Loader2 className="mr-2 animate-spin" size={16}/>:<Sparkles className="mr-2" size={16}/>}Generar vista previa</Button>
      </div>
      <div className="flex min-h-80 items-center justify-center rounded-xl bg-muted/40 p-4">{preview?<div className="space-y-3"><img src={preview.previewUrl} alt={preview.name} className="aspect-square max-h-96 rounded-xl bg-white object-contain"/><div className="flex gap-2"><Button onClick={save}><Save className="mr-2" size={16}/>Guardar privado</Button><Button variant="outline" onClick={discard}><Trash2 className="mr-2" size={16}/>Descartar</Button></div></div>:<p className="text-sm text-muted-foreground">La vista previa aparecera aca.</p>}</div>
    </div>
    <section><h3 className="mb-3 text-xl font-bold">Mis creaciones</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{mine.map(x=><article key={x.id} className="rounded-xl border bg-card p-3"><img src={x.imageUrl} alt={x.name} className="aspect-square w-full rounded-lg bg-white object-contain"/><div className="mt-2 flex justify-between gap-2"><div><b>{x.name}</b><p className="text-xs text-muted-foreground">{x.status}</p></div><div className="flex gap-1">{x.status==='rejected'&&<Button size="sm" variant="outline" onClick={()=>correct(x)}>Corregir</Button>}{(x.status==='private'||x.status==='rejected')&&<Button size="sm" variant="outline" onClick={()=>submit(x.id)}><Send className="mr-1" size={14}/>Publicar</Button>}</div></div>{x.reviewReason&&<p className="mt-2 bg-destructive/10 p-2 text-xs text-destructive">{x.reviewReason}</p>}</article>)}</div></section>
  </div>;
}
