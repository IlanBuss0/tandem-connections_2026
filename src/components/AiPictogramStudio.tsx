import { useEffect, useState } from 'react';
import { CheckCircle2, ImageIcon, Loader2, Save, Send, Sparkles, Trash2, UsersRound } from 'lucide-react';
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
  const [selectedTargets, setSelectedTargets] = useState<number[]>([]);
  const [name, setName] = useState(''), [description, setDescription] = useState('');
  const [category, setCategory] = useState('otros'), [mode, setMode] = useState<'quick'|'final'>('quick');
  const [reference, setReference] = useState<File|null>(null), [hasPeople, setHasPeople] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState(''), [catalog, setCatalog] = useState<Pictogram[]>([]), [referencePic, setReferencePic] = useState<Pictogram|null>(null);
  const [preview, setPreview] = useState<AiGeneration|null>(null), [busy, setBusy] = useState(false);
  const [revisionInstructions, setRevisionInstructions] = useState('');
  const uniqueSelectedTargets = Array.from(new Set(selectedTargets.map(Number).filter(Boolean)));

  const load = async () => {
    const [t, m] = await Promise.all([aiPictogramsApi.targets(), aiPictogramsApi.mine()]);
    setTargets(t);
    setMine(m.filter((item, index, all) => all.findIndex(other => (other.imageUrl || other.id) === (item.imageUrl || item.id)) === index));
    setSelectedTargets(prev => prev.length > 0 ? prev : (t[0] ? [t[0].id] : []));
  };

  useEffect(() => {
    load().catch(e => toast({ title: 'No se pudo cargar', description: e.message, variant: 'destructive' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!catalogQuery.trim()) {
      setCatalog([]);
      return;
    }
    const timer = setTimeout(() => {
      fetchPictograms({ search: catalogQuery.trim(), limit: 8 })
        .then(items => {
          if (!cancelled) setCatalog(items);
        })
        .catch(() => {
          if (!cancelled) setCatalog([]);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [catalogQuery]);

  const buildGenerationFormData = () => {
    const data = new FormData();
    const firstTargetId = uniqueSelectedTargets[0] || 0;
    Object.entries({
      targetPertenecienteId: String(firstTargetId),
      name,
      description,
      category,
      mode: reference || referencePic ? 'final' : mode,
      referenceHadPeople: String(hasPeople),
      revisionInstructions,
    }).forEach(([k, v]) => data.set(k, v));
    if (reference) data.set('reference', reference);
    if (referencePic) data.set('referencePictogramId', referencePic.id);
    return data;
  };

  const generate = async () => {
    setBusy(true);
    try {
      const data = buildGenerationFormData();
      const nextPreview = preview
        ? await aiPictogramsApi.revise(preview.id, data)
        : await aiPictogramsApi.generate(data);
      setPreview(nextPreview);
      if (preview) {
        setRevisionInstructions('');
        toast({ title: 'Vista previa actualizada' });
      }
    } catch (e) {
      toast({
        title: preview ? 'No se pudo editar' : 'No se pudo generar',
        description: e instanceof Error ? e.message : 'Error inesperado',
        variant: 'destructive'
      });
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!preview || busy) return;
    setBusy(true);
    try {
      await aiPictogramsApi.save(preview.id, uniqueSelectedTargets);
      setPreview(null);
      setRevisionInstructions('');
      await load();
      toast({ title: 'Guardado en privado' });
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    if (busy) return;
    if (preview) {
      setBusy(true);
      try {
        await aiPictogramsApi.discard(preview.id);
        setPreview(null);
        setRevisionInstructions('');
      } finally {
        setBusy(false);
      }
    }
  };

  const submit = async (id: string) => {
    await aiPictogramsApi.submit(id);
    await load();
    toast({ title: 'Enviado a revision' });
  };

  const correct = async (item: AiCreation) => {
    const nextName = window.prompt('Nombre corregido', item.name);
    if (!nextName) return;
    const nextDescription = window.prompt('Descripcion corregida', item.description || '') ?? item.description ?? '';
    await aiPictogramsApi.update(item.id, { name: nextName, description: nextDescription, category: item.category });
    await load();
    toast({ title: 'Correcciones guardadas' });
  };

  return (
    <div className="space-y-6 rounded-3xl bg-[#faf8ff] p-4 sm:p-6">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#ede4f8] bg-white px-3 py-1 text-xs font-semibold text-[#6b4c9a] shadow-sm">
          <Sparkles size={14} />
          IA para comunicación visual
        </div>
        <h2 className="font-heading text-3xl font-bold leading-tight text-[#4b2f78] sm:text-4xl">Crear pictograma con IA</h2>
        <div className="max-w-2xl space-y-1">
          <p className="text-sm font-medium text-[#5f5570] sm:text-base">Describí lo que necesitás y generaremos una imagen fácil de comprender.</p>
          <p className="text-xs text-[#8b7aa0] sm:text-sm">El pictograma será privado hasta que solicites su publicación.</p>
        </div>
      </header>

      <div className="grid gap-6 rounded-3xl border border-[#ede4f8] bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="space-y-5">
          <section className="space-y-3 rounded-2xl border border-[#ede4f8] bg-[#fffefe] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6b4c9a] text-sm font-bold text-white">1</span>
              <div>
                <h3 className="text-sm font-bold text-[#4b2f78]">¿Quién podrá ver este pictograma?</h3>
                <p className="text-xs text-[#8b7aa0]">Solo las personas seleccionadas podrán verlo.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <label className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#d8c7ef] bg-[#faf8ff] px-3 py-2 font-semibold text-[#4b2f78] transition hover:border-[#6b4c9a]/50 focus-within:ring-2 focus-within:ring-[#6b4c9a]/20">
                <input
                  type="checkbox"
                  checked={selectedTargets.length === targets.length && targets.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTargets(targets.map(x => x.id));
                    } else {
                      setSelectedTargets([]);
                    }
                  }}
                  className="h-4 w-4 rounded border-[#d8c7ef] accent-[#6b4c9a]"
                />
                <UsersRound size={14} />
                Todos
              </label>
              {targets.map(x => (
                <label key={x.id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#ede4f8] bg-white px-3 py-2 text-[#5f5570] transition hover:border-[#6b4c9a]/40 hover:bg-[#faf8ff] focus-within:ring-2 focus-within:ring-[#6b4c9a]/20">
                  <input
                    type="checkbox"
                    checked={selectedTargets.includes(x.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTargets(prev => Array.from(new Set([...prev, x.id])));
                      } else {
                        setSelectedTargets(prev => prev.filter(id => id !== x.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-[#d8c7ef] accent-[#6b4c9a]"
                  />
                  {x.name}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#ede4f8] bg-[#fffefe] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6b4c9a] text-sm font-bold text-white">2</span>
              <div>
                <h3 className="text-sm font-bold text-[#4b2f78]">Contenido del pictograma</h3>
                <p className="text-xs text-[#8b7aa0]">Cuanto más clara sea la descripción, mejor será el resultado.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#4b2f78]">Nombre del pictograma</label>
              <Input value={name} onChange={e => setName(e.target.value)} maxLength={160} placeholder="Ejemplo: Casa inundada" className="min-h-11 rounded-xl border-[#d8c7ef] bg-[#faf8ff] text-[#4a4a5a] placeholder:text-[#b8b0c8] focus-visible:ring-[#6b4c9a]/25" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#4b2f78]">Describí la imagen</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={1200} placeholder="Ejemplo: Una casa con agua entrando por la puerta y una persona intentando entrar." className="min-h-32 rounded-xl border-[#d8c7ef] bg-[#faf8ff] text-[#4a4a5a] placeholder:text-[#b8b0c8] focus-visible:ring-[#6b4c9a]/25" />
              <p className="text-xs text-[#8b7aa0]">Cuanto más clara sea la descripción, mejor será el resultado.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[#4b2f78]">Categoría</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="min-h-11 rounded-xl border-[#d8c7ef] bg-[#faf8ff] text-[#4a4a5a] focus:ring-[#6b4c9a]/25"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-[#ede4f8] bg-[#fffefe] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6b4c9a] text-sm font-bold text-white">3</span>
              <div>
                <h3 className="text-sm font-bold text-[#4b2f78]">Tipo de generación</h3>
                <p className="text-xs text-[#8b7aa0]">Elegí entre rapidez o mayor calidad visual.</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              <Button type="button" disabled={busy} variant={mode === 'quick' && !reference && !referencePic ? 'default' : 'outline'} onClick={() => !reference && !referencePic && setMode('quick')} className={`h-auto min-h-20 justify-start whitespace-normal rounded-2xl border p-4 text-left transition ${mode === 'quick' && !reference && !referencePic ? 'border-[#6b4c9a] bg-[#6b4c9a] text-white shadow-sm hover:bg-[#5a3c8a]' : 'border-[#d8c7ef] bg-white text-[#4b2f78] hover:border-[#6b4c9a]/50 hover:bg-[#faf8ff]'}`}>
                <span className="flex w-full min-w-0 items-start gap-3">
                  <CheckCircle2 size={18} className={mode === 'quick' && !reference && !referencePic ? 'mt-0.5 text-white' : 'mt-0.5 text-[#6b4c9a]'} />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-bold">Vista previa rápida</span>
                    <span className={`block text-xs font-normal ${mode === 'quick' && !reference && !referencePic ? 'text-white/85' : 'text-[#8b7aa0]'}`}>Generación sencilla en pocos segundos.</span>
                  </span>
                </span>
              </Button>
              <Button type="button" disabled={busy} variant={mode === 'final' || !!reference || !!referencePic ? 'default' : 'outline'} onClick={() => setMode('final')} className={`h-auto min-h-20 justify-start whitespace-normal rounded-2xl border p-4 text-left transition ${mode === 'final' || !!reference || !!referencePic ? 'border-[#6b4c9a] bg-[#6b4c9a] text-white shadow-sm hover:bg-[#5a3c8a]' : 'border-[#d8c7ef] bg-white text-[#4b2f78] hover:border-[#6b4c9a]/50 hover:bg-[#faf8ff]'}`}>
                <span className="flex w-full min-w-0 items-start gap-3">
                  <CheckCircle2 size={18} className={mode === 'final' || !!reference || !!referencePic ? 'mt-0.5 text-white' : 'mt-0.5 text-[#6b4c9a]'} />
                  <span className="min-w-0 space-y-1">
                    <span className="block font-bold">Imagen final</span>
                    <span className={`block text-xs font-normal ${mode === 'final' || !!reference || !!referencePic ? 'text-white/85' : 'text-[#8b7aa0]'}`}>Mayor calidad y nivel de detalle.</span>
                  </span>
                </span>
              </Button>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-[#ede4f8] bg-[#fffefe] p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6b4c9a] text-sm font-bold text-white">4</span>
              <div>
                <h3 className="text-sm font-bold text-[#4b2f78]">Agregar una referencia</h3>
                
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-dashed border-[#d8c7ef] bg-[#faf8ff] p-3">
              <label className="text-sm font-semibold text-[#4b2f78]">Subir una imagen de referencia</label>
              <p className="text-xs text-[#8b7aa0]">Al agregar una referencia se utilizará automáticamente la generación de mayor calidad.</p>
              <Input type="file" accept="image/png,image/jpeg,image/webp" onChange={e => { const f = e.target.files?.[0] || null; setReference(f); if (f) { setReferencePic(null); setMode('final'); } }} className="min-h-11 cursor-pointer rounded-xl border-[#d8c7ef] bg-white text-[#4a4a5a] file:mr-3 file:rounded-lg file:border-0 file:bg-[#ede4f8] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#6b4c9a] focus-visible:ring-[#6b4c9a]/25" />
              {reference && <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-full border border-[#d8c7ef] bg-white px-3 py-2 text-xs font-medium text-[#5f5570] focus-within:ring-2 focus-within:ring-[#6b4c9a]/20"><input type="checkbox" checked={hasPeople} onChange={e => setHasPeople(e.target.checked)} className="h-4 w-4 rounded border-[#d8c7ef] accent-[#6b4c9a]" />Contiene una persona</label>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#4b2f78]">Elegir un pictograma del catálogo</label>
              <Input value={catalogQuery} onChange={e => setCatalogQuery(e.target.value)} placeholder="Buscar referencia en el catálogo..." className="min-h-11 rounded-xl border-[#d8c7ef] bg-[#faf8ff] text-[#4a4a5a] placeholder:text-[#b8b0c8] focus-visible:ring-[#6b4c9a]/25" />
              {catalog.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {catalog.map(pic => (
                    <button type="button" key={pic.id} disabled={busy} onClick={() => { setReferencePic(pic); setReference(null); setMode('final'); }} className={'rounded-2xl border bg-white p-2 text-left transition hover:border-[#6b4c9a]/50 hover:bg-[#faf8ff] focus:outline-none focus:ring-2 focus:ring-[#6b4c9a]/25 disabled:opacity-60 ' + (referencePic?.id === pic.id ? 'border-[#6b4c9a] ring-2 ring-[#6b4c9a]/20' : 'border-[#ede4f8]')}>
                      <img src={pic.imageUrl} alt={pic.name} className="aspect-square w-full rounded-xl bg-[#faf8ff] object-contain p-1" />
                      <span className="mt-1 block truncate text-[11px] font-medium text-[#5f5570]">{pic.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <Button onClick={generate} disabled={busy || !!preview || uniqueSelectedTargets.length === 0 || name.trim().length < 2 || description.trim().length < 5} className="min-h-12 w-full rounded-2xl bg-[#6b4c9a] text-base font-bold text-white shadow-sm shadow-purple-200 transition hover:bg-[#5a3c8a] focus-visible:ring-[#6b4c9a]/30 disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? <Loader2 className="mr-2 animate-spin" size={18} /> : <Sparkles className="mr-2" size={18} />}
            {preview ? 'Vista previa generada' : 'Crear vista previa'}
          </Button>
        </div>

        <div className="min-h-80 rounded-3xl border border-[#ede4f8] bg-gradient-to-br from-[#faf8ff] to-white p-4 lg:sticky lg:top-6 lg:self-start">
          {preview ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#ede4f8] bg-white p-3 shadow-sm">
                <img src={preview.previewUrl} alt={preview.name} className="aspect-square max-h-[420px] w-full rounded-2xl bg-white object-contain" />
              </div>

              <div className="rounded-2xl border border-[#ede4f8] bg-white p-4 shadow-sm">
                <div className="mb-3 space-y-1">
                  <p className="text-sm font-bold text-[#4b2f78]">Editar antes de guardar</p>
                  <p className="text-xs text-[#8b7aa0]">Podés pedir ajustes antes de guardar el pictograma privado.</p>
                </div>
                <Textarea
                  value={revisionInstructions}
                  onChange={e => setRevisionInstructions(e.target.value)}
                  maxLength={1200}
                  placeholder="Escribi que queres cambiar. La IA usa esta preview como referencia y suma la imagen o pictograma que hayas elegido."
                  className="min-h-28 rounded-xl border-[#d8c7ef] bg-[#faf8ff] text-[#4a4a5a] placeholder:text-[#b8b0c8] focus-visible:ring-[#6b4c9a]/25"
                />
                <Button className="mt-3 min-h-11 w-full rounded-xl border-[#d8c7ef] text-[#6b4c9a] hover:bg-[#faf8ff] focus-visible:ring-[#6b4c9a]/25" variant="outline" onClick={generate} disabled={busy || uniqueSelectedTargets.length === 0 || name.trim().length < 2 || description.trim().length < 5}>
                  {busy ? <Loader2 className="mr-2 animate-spin" size={16} /> : <Sparkles className="mr-2" size={16} />}
                  Regenerar edición
                </Button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button onClick={save} disabled={busy || uniqueSelectedTargets.length === 0} className="min-h-11 rounded-xl bg-[#6b4c9a] font-semibold text-white hover:bg-[#5a3c8a] disabled:opacity-60"><Save className="mr-2" size={16} />Guardar privado</Button>
                <Button variant="outline" onClick={discard} disabled={busy} className="min-h-11 rounded-xl border-[#d8c7ef] text-[#6b4c9a] hover:bg-[#faf8ff] disabled:opacity-60"><Trash2 className="mr-2" size={16} />Descartar</Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-dashed border-[#d8c7ef] bg-white/80 p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ede4f8] text-[#6b4c9a]">
                <ImageIcon size={30} />
              </div>
              <p className="text-lg font-bold text-[#4b2f78]">Tu pictograma aparecerá acá</p>
              <p className="mt-2 max-w-xs text-sm text-[#8b7aa0]">Completá la descripción y seleccioná “Crear vista previa”.</p>
            </div>
          )}
        </div>
      </div>

      <section className="rounded-3xl border border-[#ede4f8] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-[#4b2f78]">Mis creaciones</h3>
          <p className="text-sm text-[#8b7aa0]">Pictogramas privados creados con IA.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mine.map(x => (
            <article key={x.id} className="rounded-2xl border border-[#ede4f8] bg-[#fffefe] p-3 shadow-sm">
              <img src={x.imageUrl} alt={x.name} className="aspect-square w-full rounded-xl bg-[#faf8ff] object-contain p-2" />
              <div className="mt-2 flex justify-between gap-2">
                <div>
                  <b className="text-[#4b2f78]">{x.name}</b>
                  <p className="text-xs text-[#8b7aa0]">{x.status}</p>
                </div>
                <div className="flex gap-1">
                  {x.status === 'rejected' && <Button size="sm" variant="outline" onClick={() => correct(x)} className="rounded-xl border-[#d8c7ef] text-[#6b4c9a] hover:bg-[#faf8ff]">Corregir</Button>}
                  {(x.status === 'private' || x.status === 'rejected') && <Button size="sm" variant="outline" onClick={() => submit(x.id)} className="rounded-xl border-[#d8c7ef] text-[#6b4c9a] hover:bg-[#faf8ff]"><Send className="mr-1" size={14} />Publicar</Button>}
                </div>
              </div>
              {x.reviewReason && <p className="mt-2 rounded-xl bg-destructive/10 p-2 text-xs text-destructive">{x.reviewReason}</p>}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
