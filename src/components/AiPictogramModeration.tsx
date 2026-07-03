import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { aiPictogramsApi, type AiCreation } from '@/services/ai-pictograms';

export default function AiPictogramModeration() {
  const { toast } = useToast();
  const [items,setItems]=useState<AiCreation[]>([]), [reasons,setReasons]=useState<Record<string,string>>({});
  const load=()=>aiPictogramsApi.moderation().then(setItems).catch(e=>toast({title:'No se pudo cargar',description:e.message,variant:'destructive'}));
  useEffect(()=>{load();},[]);
  const review=async(id:string,approved:boolean)=>{try{await aiPictogramsApi.review(id,approved,reasons[id]);await load();toast({title:approved?'Pictograma publicado':'Devuelto al creador'});}catch(e){toast({title:'No se pudo revisar',description:e instanceof Error?e.message:'Error',variant:'destructive'});}};
  return <div><h2 className="mb-1 text-2xl font-bold">Moderacion de pictogramas IA</h2><p className="mb-5 text-sm text-muted-foreground">Al aprobar, queda visible en el catalogo general con autoria TANDEM IA.</p><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map(x=><article key={x.id} className="rounded-xl border bg-card p-4"><img src={x.imageUrl} alt={x.name} className="aspect-square w-full rounded-lg bg-white object-contain"/><h3 className="mt-3 font-bold">{x.name}</h3><p className="text-sm text-muted-foreground">{x.description}</p>{x.referenceHadPeople&&<p className="mt-2 rounded bg-amber-100 p-2 text-xs text-amber-900">La referencia contenia una persona: revisar privacidad.</p>}<Textarea className="mt-3" placeholder="Motivo obligatorio si rechazas" value={reasons[x.id]||''} onChange={e=>setReasons(v=>({...v,[x.id]:e.target.value}))}/><div className="mt-3 flex gap-2"><Button onClick={()=>review(x.id,true)}>Aprobar</Button><Button variant="destructive" onClick={()=>review(x.id,false)}>Rechazar</Button></div></article>)}</div>{!items.length&&<p className="rounded-xl border p-8 text-center text-muted-foreground">No hay pictogramas pendientes.</p>}</div>;
}
