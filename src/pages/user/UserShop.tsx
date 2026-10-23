import { useState } from 'react';
import { Check, Coins, Lock, ShoppingBag, Sparkles } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { CATEGORY_LABELS, LEGACY_SHOP_ITEMS } from '@/data/shopItems';
import CoinBadge from '@/components/CoinBadge';
import { Button } from '@/components/ui/button';
import AvatarEditor from '@/features/avatar/AvatarEditor';
import AvatarRenderer from '@/features/avatar/AvatarRenderer';
import { EquipmentCategory, equipmentCategories, compatibleCode } from '@/features/avatar/avatarCatalog';
import { isPermissionEnabled, PERTENECIENTE_PERMISSIONS, usePermissionContext } from '@/hooks/usePermissions';
import { toast } from '@/hooks/ui/use-toast';
import '@/features/avatar/avatar.css';

export default function UserShop() {
  const {state,savedConfig,catalog,loading,saving,error,buy,hasItem,refresh}=useWallet();
  const [tab,setTab]=useState<'avatar'|'tienda'>('avatar');
  const [category,setCategory]=useState<EquipmentCategory|'all'>('all');
  const {context}=usePermissionContext();
  const canSpend=isPermissionEnabled(context?.perteneciente?.permisos_efectivos?.permisos,PERTENECIENTE_PERMISSIONS.GASTAR_PUNTOS,false);
  const dirty=JSON.stringify(state.config)!==JSON.stringify(savedConfig);
  const items=catalog.filter(item=>category==='all'||item.category===category);
  const openShop=(category:EquipmentCategory)=>{setCategory(category);setTab('tienda');};
  const purchase=async(id:string)=>{
    const result=await buy(id);
    toast({title:result.ok?'Compra realizada':'No se pudo comprar',description:result.ok?'Ya podés elegir el artículo en Mi avatar.':result.reason,variant:result.ok?'default':'destructive'});
  };
  return <div className="space-y-5 pb-24 lg:pb-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-3xl font-bold text-[#6b4c9a]">Tienda y avatar</h2><p className="mt-1 text-sm text-[#70617e]">Un espacio para crear tu estilo</p></div><CoinBadge size="md"/></div>
    <nav className="flex gap-1 rounded-2xl bg-[#f5f0ff] p-1" aria-label="Tienda y avatar">
      {([{id:'avatar',label:'Mi avatar',icon:Sparkles},{id:'tienda',label:'Tienda',icon:ShoppingBag}] as const).map(({id,label,icon:Icon})=><button key={id} type="button" aria-pressed={tab===id} onClick={()=>setTab(id)} className={'flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-primary '+(tab===id?'bg-white text-[#624582] shadow-sm':'text-[#70617e]')}><Icon size={17} aria-hidden/>{label}</button>)}
    </nav>
    {error&&<div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{error}<Button variant="outline" className="ml-2 min-h-11" disabled={saving||loading} onClick={refresh}>Reintentar sincronización</Button></div>}
    <div hidden={tab!=='avatar'}><AvatarEditor onShop={openShop}/>
      {state.legacyInventory.length>0&&<details className="mt-4 rounded-2xl border border-violet-100 bg-white p-4 text-sm text-[#554067]">
        <summary className="min-h-11 cursor-pointer font-semibold">Compras anteriores conservadas</summary>
        <p className="mb-3">Tus prendas equivalentes están disponibles en el editor. Los objetos sin equivalente siguen registrados en tu historial.</p>
        <ul>{state.legacyInventory.map(id=>{const code=compatibleCode(id);return <li key={id}>{LEGACY_SHOP_ITEMS.find(item=>item.id===id)?.name||id}{code?' → '+catalog.find(item=>item.id===code)?.name:' → Conservado en tu historial'}</li>;})}</ul>
      </details>}
    </div>
    {tab==='tienda'&&<section aria-label="Catálogo de tienda" className="space-y-4">
      {dirty&&<p role="status" className="rounded-xl bg-violet-50 p-3 text-sm text-[#604582]">Tu selección sigue disponible en Mi avatar. Recordá guardarla.</p>}
      {loading&&<p role="status">Sincronizando artículos y monedas…</p>}
      {!canSpend&&<p className="rounded-xl bg-violet-50 p-3 text-sm text-[#604582]"><Lock className="mr-2 inline" size={16}/>Las compras están deshabilitadas. Podés usar tus prendas disponibles.</p>}
      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar prendas">
        {(['all',...equipmentCategories] as const).map(cat=><button type="button" key={cat} aria-pressed={category===cat} onClick={()=>setCategory(cat)} className={'min-h-11 shrink-0 rounded-full border px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary '+(cat===category?'border-[#765393] bg-[#765393] text-white':'bg-white text-[#654c7a]')}>{cat==='all'?'Todos':CATEGORY_LABELS[cat]}</button>)}
      </nav>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{items.map(item=>{
        const owned=hasItem(item.id),insufficient=state.balance<item.price,cat=item.category as EquipmentCategory;
        return <article key={item.id} className="avatar-product flex min-w-0 flex-col rounded-2xl border border-violet-100 bg-white p-2.5">
          <div className="relative mb-2 flex h-28 items-center justify-center overflow-hidden rounded-xl bg-[#f7f3fb]">
            <AvatarRenderer config={{...state.config,[cat]:item.option,...(cat==='hairstyle'?{accessory:'none'}:{})}} category={cat} decorative className="h-full w-full"/>
            {owned&&<span className="absolute right-1 top-1 rounded-full bg-[#765393] p-1 text-white"><Check size={14} aria-label="Adquirido"/></span>}
          </div><h3 className="text-sm font-semibold text-[#554067]">{item.name}</h3><p className="mb-2 text-xs text-[#70617e]">{CATEGORY_LABELS[cat]}</p>
          <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-[#654c7a]"><Coins size={15} aria-hidden/>{item.price===0?'Gratis':`${item.price} monedas`}</p>
          <Button type="button" disabled={owned||saving||loading||!canSpend||insufficient} className="mt-auto min-h-11 rounded-xl bg-[#765393] px-2 text-xs text-white hover:bg-[#63437f]" aria-label={owned?'Adquirido: '+item.name:insufficient?'Monedas insuficientes: '+item.name:'Comprar '+item.name} onClick={()=>purchase(item.id)}>
            {owned?'Adquirido':insufficient?'Monedas insuficientes':'Comprar'}
          </Button>
        </article>;
      })}</div>
    </section>}
  </div>;
}
