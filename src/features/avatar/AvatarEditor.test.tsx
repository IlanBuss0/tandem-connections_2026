import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import AvatarEditor from './AvatarEditor';
import AvatarRenderer from './AvatarRenderer';
import AvatarPreview from '@/components/AvatarPreview';
import { WalletProvider, useWallet } from '@/contexts/WalletContext';
import { avatarCatalog, clothingCategories, defaultAvatar, freeInventory, validateAvatar, wardrobeItems } from './avatarCatalog';
import { localAvatarStorage, migrateWallet, readAvatarConfig, serializeAvatar, walletKey } from './avatarStorage';
import { profileAvatarUrl } from './profileAvatar';
import { avatarAnchors, accessoryLayers, bottomLayers, hairLayers, shoeLayers, topLayers } from './AvatarLayers';
import { fitBodyPath, fitBodyX } from './avatarGeometry';
import { hairShapes } from './AvatarHair';

const fixture=vi.hoisted(()=>({user:{id:'one',role:'user'},balance:500,receipts:[] as {id:number;id_avatar:number;id_item_avatar:number}[],avatar:{} as {id:number;id_perteneciente:number;avatar_json:string}}));
vi.mock('@/contexts/AuthContext',()=>({useAuth:()=>({user:fixture.user})}));
vi.mock('@/data/api',()=>({fetchPertenecienteByUsuarioId:vi.fn(async()=>({id:10}))}));
vi.mock('@/services/api',()=>({tandemApi:{
 avatares:{getAll:vi.fn(async()=>[fixture.avatar]),create:vi.fn(),update:vi.fn(async(_id:number,payload:{avatar_json:string})=>{fixture.avatar.avatar_json=payload.avatar_json;})},
 saldosPuntos:{getAll:vi.fn(async()=>[{id_perteneciente:10,saldo:fixture.balance}])},
 itemsAvatares:{getAll:vi.fn(async()=>wardrobeItems.map((item,index)=>({id:index+1,codigo_item_externo:item.id,precio_punto:item.price,activo:true})))},
 inventariosAvatares:{getAll:vi.fn(async()=>fixture.receipts),create:vi.fn(async(payload:{id_avatar:number;id_item_avatar:number})=>{
   const item=wardrobeItems[payload.id_item_avatar-1];
   if(fixture.balance<item.price) throw new Error('balance');
   fixture.balance-=item.price;fixture.receipts.push({...payload,id:fixture.receipts.length+1});return {id:fixture.receipts.length};
 })},
}}));
import { tandemApi } from '@/services/api';
let wallet:ReturnType<typeof useWallet>;
function Probe(){wallet=useWallet();return <><output data-testid="balance">{wallet.state.balance}</output><AvatarRenderer config={wallet.state.config}/></>;}
const mount=()=>render(<WalletProvider><AvatarEditor/><Probe/></WalletProvider>);
beforeEach(()=>{
 localStorage.clear();vi.clearAllMocks();fixture.user={id:'one',role:'user'};fixture.balance=500;fixture.receipts=[];
 fixture.avatar={id:20,id_perteneciente:10,avatar_json:serializeAvatar(migrateWallet(null))};
});
afterEach(()=>{cleanup();vi.restoreAllMocks();});

describe('migration and unified storage',()=>{
 it('retains balances, purchases, history and legacy appearance',()=>{
  const old={balance:321,inventory:['shirt-green','pet-cat','hair-cap'],history:[{id:'old',amount:70}],appearance:{colorPiel:'oscuro',peinado:'largo',colorPelo:'rojo'},equipped:{ropa:'shirt-green'}};
  const next=migrateWallet(old);
  expect(next.balance).toBe(321);expect(next.history).toEqual(old.history);expect(next.legacyAvatar).toEqual(old);
  expect(next.legacyInventory).toContain('pet-cat');expect(next.inventory).toContain('top:tee-green');
  expect(next.config).toMatchObject({skinTone:'deep',hairstyle:'long',hairColor:'copper',top:'tee-green'});
 });
 it('restores the previous prototype without granting new paid items',()=>{
  localStorage.setItem('tandem:avatar-studio:v1:one',JSON.stringify({version:1,equipped:{...defaultAvatar,top:'jacket'}}));
  const next=localAvatarStorage.load('one');
  expect(next.config.top).toBe('jacket');expect(next.inventory).not.toContain('top:tee-black');
 });
 it('preserves a recoverable backup and isolates users',()=>{
  const old={balance:123,inventory:['shirt-red']};localStorage.setItem(walletKey('one'),JSON.stringify(old));
  localAvatarStorage.save('one',localAvatarStorage.load('one'));
  expect(JSON.parse(localStorage.getItem(walletKey('one')+':legacy-backup')!)).toEqual(old);
  expect(localAvatarStorage.load('two').balance).toBe(0);
  expect(localAvatarStorage.load('two').inventory).not.toContain('top:tee-red');
 });
 it('validates malformed configuration and locked choices',()=>{
  expect(validateAvatar({top:'invalid'})).toEqual(defaultAvatar);
  expect(migrateWallet({version:2,config:{...defaultAvatar,top:'tee-black'}}).config.top).toBe(defaultAvatar.top);
  expect(readAvatarConfig('{bad')).toEqual(defaultAvatar);
  expect(readAvatarConfig({appearance:{ropa:4}}).top).toBe(defaultAvatar.top);
 });
});

describe('vector resources and profile fallback',()=>{
 it('falls back to the current character when a custom photo fails, and accepts a new photo',()=>{
  const view=render(<AvatarPreview config={{...defaultAvatar,base:'feminine',hairstyle:'long'}} photo="https://images.test/missing.jpg"/>);
  fireEvent.error(view.container.querySelector('img')!);
  expect(view.container.querySelector('img')).toBeNull();
  expect(view.container.querySelector('svg')).toHaveAttribute('data-base','feminine');
  expect(view.container.querySelector('[data-hairstyle="long"]')).not.toBeNull();
  view.rerender(<AvatarPreview photo="https://images.test/new.jpg"/>);
  expect(view.container.querySelector('img')).toHaveAttribute('src','https://images.test/new.jpg');
 });
 it('uses distinct anatomy with the same hairstyle and retains attachment anchors',()=>{
  const male=renderToStaticMarkup(<AvatarRenderer config={defaultAvatar}/>);
  const female=renderToStaticMarkup(<AvatarRenderer config={{...defaultAvatar,base:'feminine'}}/>);
  expect(male).not.toEqual(female);
  expect(female).toContain('data-base="feminine"');expect(female).toContain('data-hairstyle="swept"');
  expect(fitBodyX(110,205,'feminine')).toBeGreaterThan(110);
  expect(fitBodyX(110,360,'feminine')).toBeLessThan(110);
  for(const y of [333,533]) for(const x of [116,176]) expect(fitBodyX(x,y,'feminine')).toBe(x);
  expect(fitBodyPath('M116 533L176 533','feminine')).toBe('M116 533L176 533');
 });
 it('gives every hairstyle a distinct front/back silhouette and fits every accessory on both bases',()=>{
  expect(new Set(Object.values(hairShapes).map(shape=>shape.front+(shape.back||''))).size).toBe(avatarCatalog.hairstyle.length);
  for(const base of ['masculine','feminine']) for(const hair of avatarCatalog.hairstyle) for(const accessory of avatarCatalog.accessory){
   const svg=renderToStaticMarkup(<AvatarRenderer config={{...defaultAvatar,base,hairstyle:hair.id,accessory:accessory.id}}/>);
   expect(svg).toContain('data-hairstyle="'+hair.id+'"');expect(svg).not.toMatch(/undefined|NaN/);
   if(accessory.resource==='cap') expect(svg).toMatch(/data-layer="hair"[^>]+clip-path="url/);
  }
 });
 it('has unique codes, actual resources and common ankle anchors',()=>{
  expect(new Set(wardrobeItems.map(item=>item.id)).size).toBe(wardrobeItems.length);
  const resources={hairstyle:hairLayers,top:topLayers,bottom:bottomLayers,shoes:shoeLayers,accessory:accessoryLayers};
  for(const [category,layers] of Object.entries(resources)) for(const item of avatarCatalog[category]) expect(layers[item.resource]).toBeTypeOf('function');
  expect(avatarAnchors.leftAnkleX+avatarAnchors.rightAnkleX).toBe(292);
 });
 it('keeps anatomy stable across all clothing combinations on each base',()=>{
  for(const base of ['masculine','feminine']) {
  const sample=renderToStaticMarkup(<AvatarRenderer config={{...defaultAvatar,base}}/>);
  const body=sample.match(/<g data-layer="body">([\s\S]*?)<\/g>/)![1].replace(/avatar-[^-]+-skin/g,'skin');
  for(const top of avatarCatalog.top) for(const bottom of avatarCatalog.bottom) for(const shoes of avatarCatalog.shoes) for(const accessory of avatarCatalog.accessory){
   const svg=renderToStaticMarkup(<AvatarRenderer config={{...defaultAvatar,base,top:top.id,bottom:bottom.id,shoes:shoes.id,accessory:accessory.id}}/>);
   expect(svg).not.toContain('undefined');expect(svg).toContain('translate(292 0) scale(-1 1)');
   expect(svg.match(/<g data-layer="body">([\s\S]*?)<\/g>/)![1].replace(/avatar-[^-]+-skin/g,'skin')).toBe(body);
  }
  }
 },20000);
 it('prefers custom photos, ignores old generated URLs and provides a circular portrait',()=>{
  expect(profileAvatarUrl({avatar_imagen_origen_url:'https://images.test/alex.jpg'} as never)).toBe('https://images.test/alex.jpg');
  expect(profileAvatarUrl({avatar_imagen_origen_url:'https://api.dicebear.com/a.png',avatar_imagen_url:'https://storage.test/old.png'} as never)).toMatch(/^data:image\/svg/);
  const {container}=render(<AvatarPreview config={defaultAvatar}/>);
  expect(container.querySelector('svg')).toHaveAttribute('viewBox','70 -5 160 205');
  expect(container.querySelector('img')).toBeNull();
 });
});

describe('single shared configuration',()=>{
 it('preserves all choices while switching body bases and after reload',async()=>{
  const view=mount();await screen.findByRole('radio',{name:'Buzo lila'});
  act(()=>wallet.select('hairColor','copper'));act(()=>wallet.select('skinTone','deep'));
  await act(()=>wallet.equip('accessory:glasses'));
  const prior={...wallet.state.config};
  fireEvent.click(screen.getByRole('button',{name:'Base'}));fireEvent.click(screen.getByRole('radio',{name:'Base femenina'}));
  expect(wallet.state.config).toEqual({...prior,base:'feminine'});
  fireEvent.click(screen.getByRole('button',{name:'Guardar mi avatar'}));await screen.findByText('Avatar guardado.');view.unmount();
  mount();await screen.findByRole('radio',{name:'Buzo lila'});expect(wallet.state.config).toEqual({...prior,base:'feminine'});
 });
 it('offers only owned hairstyles, buys through the same wallet and persists the equipped hairstyle',async()=>{
  fixture.user.id='101';const view=mount();await screen.findByRole('radio',{name:'Buzo lila'});
  fireEvent.click(screen.getByRole('button',{name:'Peinado'}));
  expect(screen.getAllByRole('radio')).toHaveLength(7);expect(screen.queryByRole('radio',{name:'Rodete'})).toBeNull();
  act(()=>wallet.select('hairstyle','bun'));await act(()=>wallet.equip('hairstyle:bun'));expect(wallet.state.config.hairstyle).toBe('swept');
  await act(async()=>{expect((await wallet.buy('hairstyle:bun')).ok).toBe(true);});
  expect(wallet.state.balance).toBe(400);expect(wallet.state.inventory).toContain('hairstyle:bun');
  expect(screen.getByRole('radio',{name:'Rodete'})).toBeInTheDocument();
  await act(()=>wallet.equip('hairstyle:bun'));expect(screen.getByRole('radio',{name:'Rodete'})).toBeChecked();
  expect(JSON.parse(fixture.avatar.avatar_json).equipped.hairstyle).toBe('hairstyle:bun');
  view.unmount();mount();await screen.findByRole('radio',{name:'Buzo lila'});
  fireEvent.click(screen.getByRole('button',{name:'Peinado'}));expect(screen.getByRole('radio',{name:'Rodete'})).toBeChecked();
 });
 it('migrates the server appearance when no local studio configuration exists',async()=>{
  fixture.user.id='101';fixture.avatar.avatar_json=JSON.stringify({appearance:{colorPiel:'oscuro',peinado:'largo',colorPelo:'rojo',ropa:'blazerCamisa'}});
  mount();expect(await screen.findByRole('radio',{name:'Campera celeste'})).toBeChecked();
  expect(wallet.state.config).toMatchObject({skinTone:'deep',hairstyle:'long',hairColor:'copper'});
 });
 it('keeps a successful server save when a local cache cannot be written',async()=>{
  fixture.user.id='101';mount();await screen.findByRole('radio',{name:'Buzo lila'});
  vi.spyOn(localAvatarStorage,'save').mockImplementation(()=>{throw new Error('quota');});
  fireEvent.click(screen.getByRole('radio',{name:'Campera celeste'}));fireEvent.click(screen.getByRole('button',{name:'Guardar mi avatar'}));
  expect(await screen.findByText('Avatar guardado en tu cuenta. Este navegador no pudo guardar una copia local.')).toBeInTheDocument();
  expect(JSON.parse(fixture.avatar.avatar_json).config.top).toBe('jacket');expect(wallet.savedConfig.top).toBe('jacket');
 });
 it('updates all views immediately and restores saved changes',async()=>{
  const first=mount();fireEvent.click(await screen.findByRole('radio',{name:'Campera celeste'}));
  expect(wallet.state.config.top).toBe('jacket');
  expect(screen.getAllByRole('img').every(svg=>svg.querySelector('[data-item="jacket"]'))).toBe(true);
  fireEvent.click(screen.getByRole('button',{name:'Guardar mi avatar'}));
  await screen.findByText('Avatar guardado.');first.unmount();
  mount();expect(await screen.findByRole('radio',{name:'Campera celeste'})).toBeChecked();
 });
 it('hides locked clothes and rejects direct equip/select attempts',async()=>{
  mount();await screen.findByRole('radio',{name:'Buzo lila'});
  expect(screen.queryByRole('radio',{name:'Remera negra'})).toBeNull();
  act(()=>wallet.select('top','tee-black'));await act(()=>wallet.equip('top:tee-black'));
  expect(wallet.state.config.top).toBe('hoodie');
 });
 it('buys through the existing backend, refreshes its balance and equips across the editor',async()=>{
  fixture.user.id='101';mount();await screen.findByRole('radio',{name:'Buzo lila'});
  await act(async()=>{expect(await wallet.buy('top:tee-black')).toEqual({ok:true});});
  expect(tandemApi.inventariosAvatares.create).toHaveBeenCalledTimes(1);
  expect(fixture.balance).toBe(430);expect(wallet.state.balance).toBe(430);expect(wallet.state.inventory).toContain('top:tee-black');
  await act(()=>wallet.equip('top:tee-black'));
  expect(screen.getByRole('radio',{name:'Remera negra'})).toBeChecked();
  expect(JSON.parse(fixture.avatar.avatar_json).equipped.top).toBe('top:tee-black');
  expect(localAvatarStorage.load('101').config.top).toBe('tee-black');
 });
 it('cannot spend a fallback wallet when the backend is unavailable',async()=>{
  fixture.user.id='101';vi.mocked(tandemApi.avatares.getAll).mockRejectedValueOnce(new Error('offline'));
  mount();await screen.findAllByRole('alert');
  await act(async()=>{expect((await wallet.buy('top:tee-black')).ok).toBe(false);});
  expect(tandemApi.inventariosAvatares.create).not.toHaveBeenCalled();
 });
 it('never shares an avatar when switching accounts',async()=>{
  const view=mount();fireEvent.click(await screen.findByRole('radio',{name:'Campera celeste'}));
  fireEvent.click(screen.getByRole('button',{name:'Guardar mi avatar'}));await screen.findByText('Avatar guardado.');
  fixture.user={id:'two',role:'user'};view.rerender(<WalletProvider><AvatarEditor/><Probe/></WalletProvider>);
  expect(await screen.findByRole('radio',{name:'Buzo lila'})).toBeChecked();
  expect(wallet.state.inventory).toEqual(freeInventory);
 });
 it('does not claim success on a failed save',async()=>{
  mount();await screen.findByRole('radio',{name:'Buzo lila'});
  vi.spyOn(localAvatarStorage,'save').mockImplementation(()=>{throw new Error('quota');});
  fireEvent.click(screen.getByRole('radio',{name:'Campera celeste'}));fireEvent.click(screen.getByRole('button',{name:'Guardar mi avatar'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos guardar');
  expect(wallet.state.config.top).toBe('jacket');
 });
 it('can remove optional accessories without changing clothes',async()=>{
  mount();await screen.findByRole('radio',{name:'Buzo lila'});await act(()=>wallet.equip('accessory:cap'));
  expect(wallet.state.config.accessory).toBe('cap');await act(()=>wallet.unequip('accessory'));
  expect(wallet.state.config.accessory).toBe('none');expect(wallet.state.config.top).toBe('hoodie');
 });
});
