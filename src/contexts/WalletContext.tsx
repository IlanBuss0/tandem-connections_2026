import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { tandemApi } from '@/services/api';
import { fetchPertenecienteByUsuarioId } from '@/data/api';
import { AvatarCategory, AvatarConfig, avatarCatalog, equipmentCategories, compatibleCode, defaultAvatar, equipmentCode, freeInventory, ownedConfig, wardrobeItems } from '@/features/avatar/avatarCatalog';
import { localAvatarStorage, readAvatarConfig, serializeAvatar, walletKey, WalletState } from '@/features/avatar/avatarStorage';
import type { Avatar, ItemAvatar } from '@/types/database';
import { ApiError } from '@/services/api/client';

export type { WalletState } from '@/features/avatar/avatarStorage';
interface BackendSnapshot { avatar: Avatar; items: ItemAvatar[] }
interface WalletCtx {
  state: WalletState; savedConfig: AvatarConfig; loading: boolean; saving: boolean; error: string | null; message: string;
  catalog: typeof wardrobeItems; earn: (amount: number, reason: string) => Promise<void>;
  buy: (id: string) => Promise<{ok: boolean; reason?: string}>; equip: (id: string) => Promise<void>;
  unequip: (category: AvatarCategory) => Promise<void>; select: (category: AvatarCategory,id: string) => void;
  saveAvatar: () => Promise<void>; hasItem: (id: string) => boolean; isEquipped: (id: string) => boolean; refresh: () => Promise<boolean>;
}
const WalletContext = createContext<WalletCtx | null>(null);

// A keyed provider prevents state and pending requests from crossing accounts.
export function WalletProvider({children}: {children: ReactNode}) {
  const {user}=useAuth();
  return <UserWallet key={user?.id || '__guest__'} userId={user?.id || '__guest__'} belonging={user?.role==='user'}>{children}</UserWallet>;
}
function UserWallet({userId,belonging,children}: {userId:string;belonging:boolean;children:ReactNode}) {
  const [state,setState]=useState<WalletState>(()=>localAvatarStorage.load(userId));
  const [savedConfig,setSavedConfig]=useState(state.config);
  const stateRef=useRef(state);
  const [snapshot,setSnapshot]=useState<BackendSnapshot|null>(null);
  const [loading,setLoading]=useState(belonging);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const busy=useRef(false);
  const generation=useRef(0);
  const invalidateRequests=useCallback(()=>{generation.current++;},[]);
  const initialized=useRef(false);
  const remote=belonging && /^\d+$/.test(userId);
  const apply=useCallback((next:WalletState,persist=true)=>{
    if(persist) localAvatarStorage.save(userId,next);
    stateRef.current=next;setState(next);
  },[userId]);

  const refresh=useCallback(async()=>{
    if(!remote) {setLoading(false);return true;}
    const ticket=++generation.current;
    setLoading(true);setError(null);
    try {
      const [owner,avatars,balances,items,records]=await Promise.all([
        fetchPertenecienteByUsuarioId(userId),tandemApi.avatares.getAll({cache:'no-store'}),tandemApi.saldosPuntos.getAll({cache:'no-store'}),
        tandemApi.itemsAvatares.getAll({cache:'no-store'}),tandemApi.inventariosAvatares.getAll({cache:'no-store'}),
      ]);
      if(!owner) throw new Error('No encontramos tu perfil.');
      let avatar=avatars.find(a=>Number(a.id_perteneciente)===Number(owner.id));
      const local=localAvatarStorage.load(userId);
      if(!avatar) {
        const base={...local,config:ownedConfig(local.config,freeInventory)};
        const created=await tandemApi.avatares.create({id_perteneciente:owner.id,avatar_json:serializeAvatar(base)});
        avatar={id:Number(created.id),id_perteneciente:owner.id,nivel:1,experiencia:0,avatar_api:null,avatar_externo_id:null,avatar_json:serializeAvatar(base)};
      }
      const receiptCodes=records.filter(record=>Number(record.id_avatar)===Number(avatar.id))
        .map(record=>items.find(item=>Number(item.id)===Number(record.id_item_avatar))?.codigo_item_externo).filter((id):id is string=>!!id);
      const inventory=[...new Set([...freeInventory,...receiptCodes.flatMap(code=>compatibleCode(code)||[])])];
      const parsed=(()=>{try{return JSON.parse(avatar.avatar_json||'{}');}catch{return {};}})();
      const hasStudioLocal = (()=>{try{return JSON.parse(localStorage.getItem(walletKey(userId))||'{}').version===2||JSON.parse(localStorage.getItem('tandem:avatar-studio:v1:'+encodeURIComponent(userId))||'{}').version===1;}catch{return false;}})();
      const persistedConfig=ownedConfig(parsed.version===2||!hasStudioLocal?readAvatarConfig(parsed):local.config,inventory);
      const config=initialized.current?ownedConfig(stateRef.current.config,inventory):persistedConfig;
      const next:WalletState={...local,config,inventory,
        legacyInventory:[...new Set([...local.legacyInventory,...receiptCodes.filter(code=>!code.includes(':'))])],
        legacyAvatar:local.legacyAvatar??(parsed.version!==2?parsed:parsed.legacyAvatar),
        balance:Number(balances.find(balance=>Number(balance.id_perteneciente)===Number(owner.id))?.saldo??0)};
      if(ticket!==generation.current) return false;
      apply(next,false);
      try {localAvatarStorage.save(userId,{...next,config:persistedConfig});}
      catch {setError('Tu cuenta está sincronizada, pero este navegador no pudo guardar una copia local.');}
      initialized.current=true;setSavedConfig(persistedConfig);setSnapshot({avatar,items});
      return true;
    } catch {
      if(ticket===generation.current) {setSnapshot(null);setError('No pudimos sincronizar la tienda. Podés ver tu avatar guardado; reintentá para comprar o guardar en la cuenta.');}
      return false;
    } finally {if(ticket===generation.current) setLoading(false);}
  },[remote,userId,apply]);
  useEffect(()=>{void refresh();return invalidateRequests;},[refresh,invalidateRequests]);
  useEffect(()=>{
    if(JSON.stringify(state.config)===JSON.stringify(savedConfig)) return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);
    return ()=>window.removeEventListener('beforeunload',warn);
  },[state.config,savedConfig]);

  const select=(category:AvatarCategory,id:string)=>{
    if(busy.current||loading) return;
    const current=stateRef.current;
    if(!avatarCatalog[category].some(item=>item.id===id&&item.available)) return;
    if(equipmentCategories.includes(category as typeof equipmentCategories[number])&&!current.inventory.includes(equipmentCode(category,id))) return;
    apply({...current,config:{...current.config,[category]:id}},false);setMessage('');
  };
  const persist=async(next:WalletState)=>{
    if(remote) {
      if(!snapshot) throw new Error('La cuenta no está sincronizada.');
      await tandemApi.avatares.update(snapshot.avatar.id,{avatar_json:serializeAvatar(next)});
      apply(next,false);setSavedConfig(next.config);
      try {localAvatarStorage.save(userId,next);return true;}
      catch {return false;}
    }
    apply(next);setSavedConfig(next.config);
    return true;
  };
  const saveAvatar=async()=>{
    if(busy.current) return;
    busy.current=true;setSaving(true);setError(null);setMessage('');
    const next={...stateRef.current,config:{...stateRef.current.config}};
    try {const cached=await persist(next);setMessage(cached?'Avatar guardado.':'Avatar guardado en tu cuenta. Este navegador no pudo guardar una copia local.');}
    catch {setError('No pudimos guardar tu avatar. Tus cambios siguen disponibles para reintentar.');}
    finally {busy.current=false;setSaving(false);}
  };
  const equip=async(code:string)=>{
    const item=wardrobeItems.find(item=>item.id===code);
    if(!item||!stateRef.current.inventory.includes(code)||busy.current||loading) return;
    busy.current=true;setSaving(true);setError(null);
    try {await persist({...stateRef.current,config:{...stateRef.current.config,[item.category]:item.option}});}
    catch {setError('No pudimos equipar el objeto. Intentá nuevamente.');}
    finally {busy.current=false;setSaving(false);}
  };
  const buy=async(id:string)=>{
    if(busy.current) return {ok:false,reason:'Esperá a que termine la operación actual.'};
    const item=wardrobeItems.find(item=>item.id===id);
    if(!item||stateRef.current.inventory.includes(id)) return {ok:false,reason:'Este objeto ya está disponible o no existe.'};
    if(!snapshot||!remote) return {ok:false,reason:'Conectate a tu cuenta para comprar con monedas.'};
    const dbItem=snapshot.items.find(item=>item.codigo_item_externo===id&&item.activo);
    if(!dbItem) return {ok:false,reason:'Este objeto no está disponible en la tienda.'};
    busy.current=true;setSaving(true);
    try {
      await tandemApi.inventariosAvatares.create({id_avatar:snapshot.avatar.id,id_item_avatar:dbItem.id,equipado:false,fecha_obtencion:new Date().toISOString()});
      if(!await refresh()) return {ok:false,reason:'La compra fue procesada, pero falta actualizar tu inventario. Reintentá sincronizar antes de comprar nuevamente.'};
      return {ok:true};
    } catch (error) {
      const reason=error instanceof ApiError&&error.status<500?error.message:'No pudimos confirmar la compra. Sincronizá antes de volver a comprar.';
      // Refresh even after a lost response: the transaction may have committed.
      await refresh();
      return {ok:false,reason};
    }
    finally {busy.current=false;setSaving(false);}
  };
  const earn=async(_amount:number,_reason:string)=>{await refresh();};
  const catalog=wardrobeItems.map(item=>({...item,price:snapshot?.items.find(db=>db.codigo_item_externo===item.id)?.precio_punto??item.price}));
  return <WalletContext.Provider value={{state,savedConfig,loading,saving,error,message,catalog,earn,buy,equip,
    unequip:category=>equip(equipmentCode(category,defaultAvatar[category])),select,saveAvatar,
    hasItem:id=>state.inventory.includes(id),isEquipped:id=>equipmentCategories.some(category=>equipmentCode(category,state.config[category])===id),refresh}}>{children}</WalletContext.Provider>;
}
export function useWallet() {const context=useContext(WalletContext);if(!context) throw new Error('useWallet must be inside WalletProvider');return context;}
