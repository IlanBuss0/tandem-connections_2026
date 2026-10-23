// Run from the frontend root with Vite running: node src/features/avatar/avatar-flow.browser.cjs
// Controlled API fixtures: no credentials, real accounts or balances are used.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const wardrobe = require('./avatarWardrobe.json');
const baseUrl = process.env.AVATAR_REVIEW_URL || 'http://localhost:8081';
const output = path.join(os.tmpdir(), 'tandem-avatar-final-review');
fs.mkdirSync(output, { recursive: true });
const defaults = { base:'masculine',skinTone:'warm',hairstyle:'swept',hairColor:'chestnut',eyeColor:'hazel',top:'hoodie',bottom:'jeans',shoes:'white',accessory:'none' };
const accounts = new Map([9001,9002].map(id=>[id,{balance:id===9001?500:0,receipts:[],avatar:{id:id+800,id_perteneciente:id+900,avatar_json:JSON.stringify({version:2,config:defaults}),avatar_imagen_origen_url:baseUrl+'/missing-profile.jpg'}}]));
let currentUser=9001, authenticated=true, rejectNext=false;

(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1366,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();
  if(process.env.AVATAR_ATLAS_ONLY==='1'){await atlas(page,output);console.log('ATLAS',output);return;}
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',dialog=>dialog.accept());
  await page.addInitScript(()=>localStorage.setItem('tandem_active_tab','shop'));
  await page.route('**/missing-profile.jpg',route=>route.fulfill({status:404,body:''}));
  await page.route('**/socket.io/**',route=>route.abort());
  await page.route('**/api/**',async route=>{
   const request=route.request(),url=new URL(request.url()),p=url.pathname;
   if(!p.startsWith('/api/')) return route.continue();
   const account=accounts.get(currentUser);
   const user={id:currentUser,id_tipo_usuario:1,nombre:'Alex',apellido:'Prueba',nombre_usuario:'avatar-review',email_verificado:true};
   let data=[],status=200;
   if(p==='/api/auth/login'){authenticated=true;data={user};}
   else if(p==='/api/auth/logout'){authenticated=false;data={ok:true};}
   else if(p==='/api/auth/me'||p==='/api/auth/refresh'){data=p.endsWith('/me')?user:{user};if(!authenticated){status=401;data={message:'Sin sesión'};}}
   else if(p===`/api/pertenecientes/usuario/${currentUser}`) data={id:currentUser+900,id_usuario:currentUser};
   else if(p==='/api/avatares') data=[account.avatar];
   else if(p===`/api/avatares/${account.avatar.id}`&&request.method()==='PUT'){Object.assign(account.avatar,request.postDataJSON());data={rowsAffected:1};}
   else if(p==='/api/saldos-puntos') data=[{id:1,id_perteneciente:currentUser+900,saldo:account.balance}];
   else if(p==='/api/items-avatares') data=wardrobe.map((item,i)=>({id:i+1,codigo_item_externo:item.id,precio_punto:item.price,activo:true}));
   else if(p==='/api/inventarios-avatares'){
    if(request.method()==='POST'){
     const body=request.postDataJSON(),item=wardrobe[body.id_item_avatar-1];
     if(rejectNext||account.balance<item.price){rejectNext=false;status=409;data={message:'Saldo insuficiente.'};}
     else if(account.receipts.some(row=>row.id_item_avatar===body.id_item_avatar)){status=409;data={message:'El artículo ya pertenece al inventario.'};}
     else {account.balance-=item.price;account.receipts.push({...body,id:account.receipts.length+1});data={id:account.receipts.length};}
    }else data=account.receipts;
   }
   else if(p==='/api/permisos/contexto') data={ok:true,data:{perteneciente:{permisos_efectivos:{permisos:{GastarPuntos:{habilitado:true},EditarPerfil:{habilitado:true}}}}}};
   else if(p.endsWith('/onboarding.autonomia')) data={id:1,valor:JSON.stringify({done:true,skipped:false})};
   else if(p.includes('/configuraciones-usuarios/usuario/')) data={valor:'{}'};
   await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
  });
  const button=name=>page.getByRole('button',{name,exact:true});
  const choose=async(category,option)=>{await button(category).click();await page.getByRole('radio',{name:option,exact:true}).check();};
  const restored=async choices=>{for(const [category,option] of choices){await button(category).click();await expect(page.getByRole('radio',{name:option,exact:true})).toBeChecked();}};
  const save=async()=>{await button('Guardar mi avatar').click();await expect(page.getByText('Avatar guardado.',{exact:true})).toBeVisible();};
  await page.goto(baseUrl);
  await expect(page.getByRole('radio',{name:'Buzo lila'})).toBeChecked({timeout:20000});
  await expect(page.getByRole('navigation',{name:'Tienda y avatar'}).getByRole('button')).toHaveCount(2);
  await expect(button('Crear personaje')).toHaveCount(0);await expect(button('Inventario')).toHaveCount(0);
  await choose('Base','Base masculina');await choose('Piel','Piel morena');await choose('Peinado','Corto clásico');
  await choose('Arriba','Remera celeste');await choose('Pantalón','Jogger gris');await choose('Calzado','Zapatillas blancas');await save();
  const masculine=JSON.parse(accounts.get(9001).avatar.avatar_json).config;
  await page.reload();await expect(page.locator('.avatar-character')).toHaveAttribute('data-base','masculine');
  await restored([['Base','Base masculina'],['Piel','Piel morena'],['Peinado','Corto clásico'],['Arriba','Remera celeste'],['Pantalón','Jogger gris'],['Calzado','Zapatillas blancas']]);
  expect(JSON.parse(accounts.get(9001).avatar.avatar_json).config).toEqual(masculine);
  await choose('Base','Base femenina');await choose('Peinado','Pelo largo simple');await choose('Arriba','Remera celeste');
  await choose('Pantalón','Jean azul');await choose('Calzado','Zapatillas violetas');await choose('Accesorios','Anteojos comunes');await choose('Accesorios','Sin accesorio');await save();
  await page.reload();await expect(page.locator('.avatar-character')).toHaveAttribute('data-base','feminine');
  await restored([['Base','Base femenina'],['Peinado','Pelo largo simple'],['Arriba','Remera celeste'],['Pantalón','Jean azul'],['Calzado','Zapatillas violetas'],['Accesorios','Sin accesorio']]);
  await choose('Accesorios','Sin accesorio');await expect(page.locator('.avatar-character [data-layer="accessory"]')).toHaveCount(0);
  const header=button('Abrir opciones de cuenta');await expect(header.locator('svg[data-base="feminine"]')).toBeVisible();await expect(header.locator('img')).toHaveCount(0);
  await header.click();await button('Mi perfil').click();await expect(button('Abrir Tienda y avatar')).toBeVisible();
  await expect(header.locator('svg[data-base="feminine"]')).toBeVisible();
  await button('Abrir Tienda y avatar').click();await expect(page.locator('.avatar-character')).toHaveAttribute('data-base','feminine');
  // A draft survives both primary tab changes and a purchase refresh.
  await choose('Ojos','Verdes');await button('Tienda').click();await expect(page.getByText('Tu selección sigue disponible en Mi avatar. Recordá guardarla.')).toBeVisible();
  await button('Arriba').click();await button('Comprar Remera negra').click();await expect(button('Adquirido: Remera negra')).toBeDisabled();
  expect(accounts.get(9001).balance).toBe(430);expect(accounts.get(9001).receipts).toHaveLength(1);
  await button('Mi avatar').click();await button('Arriba').click();await page.getByRole('radio',{name:'Remera negra',exact:true}).check();
  await expect(page.getByText('Sin guardar',{exact:true})).toBeVisible();await save();
  await page.reload();await expect(page.getByRole('radio',{name:'Remera negra',exact:true})).toBeChecked();
  expect(JSON.parse(accounts.get(9001).avatar.avatar_json).config.eyeColor).toBe('green');
  await button('Peinado').click();await button('Conseguí más en la tienda').click();await expect(button('Peinados')).toHaveAttribute('aria-pressed','true');
  await button('Comprar Rodete').click();await expect(button('Adquirido: Rodete')).toBeDisabled();expect(accounts.get(9001).balance).toBe(330);
  await button('Mi avatar').click();await page.getByRole('radio',{name:'Rodete',exact:true}).check();await save();
  await page.reload();await button('Peinado').click();await expect(page.getByRole('radio',{name:'Rodete',exact:true})).toBeChecked();
  await expect(page.locator('.avatar-character [data-hairstyle="bun"]')).toHaveCount(1);
  await page.screenshot({path:path.join(output,'editor-desktop.png')});
  // Authoritative rejection with a seemingly sufficient cached UI balance.
  await button('Tienda').click();await button('Arriba').click();rejectNext=true;
  await button('Comprar Remera verde').click();await expect(page.getByText('Saldo insuficiente.',{exact:true})).toBeVisible();
  expect(accounts.get(9001).balance).toBe(330);expect(accounts.get(9001).receipts).toHaveLength(2);
  await expect(button('Adquirido: Remera negra')).toBeDisabled();
  // Known insufficient balance disables purchase and exposes the reason.
  accounts.get(9001).balance=0;await page.reload();await button('Tienda').click();await button('Arriba').click();
  await expect(button('Monedas insuficientes: Remera verde')).toBeDisabled();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(output,'shop-mobile.png')});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(await page.locator('main').evaluate(element=>element.scrollWidth<=element.clientWidth)).toBe(true);
  await button('Mi avatar').click();await button('Peinado').click();
  await button('Guardar mi avatar').scrollIntoViewIfNeeded();
  const stage=await page.locator('.avatar-stage').boundingBox();expect(stage.y).toBeGreaterThanOrEqual(0);expect(stage.y+stage.height).toBeLessThan(844);
  await page.screenshot({path:path.join(output,'editor-mobile.png')});
  await button('Base').click();await page.getByRole('radio',{name:'Base femenina'}).focus();await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio',{name:'Base masculina'})).toBeChecked();await page.getByRole('radio',{name:'Base femenina'}).check();await save();
  expect(await page.locator('.avatar-save').evaluate(element=>getComputedStyle(element).transitionDuration)).toBe('0s');
  // New account in the same browser cannot inherit the purchases or avatar.
  currentUser=9002;await page.evaluate(()=>sessionStorage.clear());await page.reload();
  await expect(page.locator('.avatar-character')).toHaveAttribute('data-base','masculine');await button('Peinado').click();await expect(page.getByRole('radio',{name:'Rodete'})).toHaveCount(0);
  currentUser=9001;await page.evaluate(()=>sessionStorage.clear());await page.reload();await button('Peinado').click();await expect(page.getByRole('radio',{name:'Rodete'})).toBeChecked();
  // Logout/login UI exercises account cache clearing while fixture data remains.
  await button('Abrir opciones de cuenta').click();await page.getByRole('menuitem',{name:/Cerrar sesi/}).click();
  await page.goto(baseUrl+'/login');await page.getByLabel('Usuario o email',{exact:true}).fill('avatar-review');await page.getByLabel('Contraseña',{exact:true}).fill('synthetic-only');
  await button('Iniciar sesión').click();await page.waitForFunction(()=>localStorage.getItem('tandem_active_tab')==='home');
  await page.evaluate(()=>localStorage.setItem('tandem_active_tab','shop'));await page.reload();
  await button('Peinado').click();await expect(page.getByRole('radio',{name:'Rodete'})).toBeChecked();expect(accounts.get(9001).receipts).toHaveLength(2);
  await atlas(page,output);
  expect(errors).toEqual([]);
  console.log(JSON.stringify({result:'PASS',mode:'browser with controlled API fixtures',checks:['two sections','A masculine save/reload','B feminine and removable accessories','C garment purchase/equip/reload','D hairstyle purchase/equip/reload','E rejection without debit','F broken photo fallback','draft retention','account isolation','logout/login','mobile keyboard/reduced motion','G all visual combinations'],screenshots:output}));
 }finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

async function atlas(page,output){
 await page.route('**/avatar-atlas',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><body><div id="root"></div><script type="module">
 import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(t)=>t;window.__vite_plugin_react_preamble_installed__=true;
 const React=(await import('/node_modules/.vite/deps/react.js')).default;
 const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
 const {default:A}=await import('/src/features/avatar/AvatarRenderer.tsx');
 const {avatarCatalog:c,defaultAvatar:d}=await import('/src/features/avatar/avatarCatalog.ts');
 const root=createRoot(document.getElementById('root'));
 window.draw=(kind,base,start)=>{
 const configs=kind==='tops'?c.top.map(top=>({...d,base,top:top.id})):kind==='bottoms'?c.bottom.flatMap(bottom=>c.shoes.map(shoes=>({...d,base,bottom:bottom.id,shoes:shoes.id}))):c.hairstyle.flatMap(hair=>['none','cap','flower','glasses'].map(accessory=>({...d,base,hairstyle:hair.id,accessory})));
 root.render(React.createElement('main',{style:{display:'grid',gridTemplateColumns:'repeat(6, 180px)',gap:12}},configs.slice(start,start+12).map((config,i)=>React.createElement('div',{key:start+i,style:{background:'#f4eff9',borderRadius:16,padding:8,textAlign:'center',fontFamily:'Arial',fontSize:11}},React.createElement(A,{config,decorative:true,className:'avatar'}),React.createElement('p',null,kind==='tops'?config.top:kind==='bottoms'?config.bottom+' / '+config.shoes:config.hairstyle+' / '+config.accessory)))));
 return configs.length;};
 window.detail=()=>root.render(React.createElement('main',{style:{display:'flex',gap:10}},['masculine','feminine'].flatMap(base=>['tee','hoodie','jacket'].map(top=>React.createElement(A,{key:base+top,config:{...d,base,top},decorative:true,className:'avatar-detail'})))));
 document.head.insertAdjacentHTML('beforeend','<style>.avatar{height:360px;width:180px}.avatar-detail{height:800px;width:400px;flex-shrink:0}body{margin:12px}</style>');window.draw('tops','masculine',0);
 </script></body></html>`}));
 await page.setViewportSize({width:1250,height:1000});await page.goto(baseUrl+'/avatar-atlas');await page.locator('main svg').first().waitFor();
 for(const base of ['masculine','feminine'])for(const kind of ['tops','bottoms','hair']){
  const count=await page.evaluate(args=>window.draw(...args),[kind,base,0]);
  for(let start=0;start<count;start+=12){
   await page.evaluate(args=>window.draw(...args),[kind,base,start]);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   if(kind==='tops'){
    const exposed=await page.locator('main svg').evaluateAll(svgs=>svgs.flatMap(svg=>{
     const arms=svg.querySelector('[data-layer="body"] > path:nth-of-type(2)');
     const clothes=[...svg.querySelectorAll('[data-layer="top"] path')].filter(p=>getComputedStyle(p).fill!=='none');
     const item=svg.querySelector('[data-layer="top"]').parentElement.dataset.item;
     const points=[];
     for(let y=220;y<=(item.startsWith('tee')?250:330);y+=2)for(let x=64;x<=236;x+=2){const point=new DOMPoint(x,y);if(arms.isPointInFill(point)&&!clothes.some(p=>p.isPointInFill(point)))points.push({x,y});}
     return points.length?[{item,points:points.slice(0,5),total:points.length}]:[];
    }));
    expect(exposed,`sleeves cover upper-arm anatomy on ${base}`).toEqual([]);
   }
   if(kind==='bottoms'){
    const exposed=await page.locator('main svg').evaluateAll(svgs=>svgs.flatMap(svg=>{
     const body=svg.querySelector('[data-layer="body"] > path');
     const bottom=[...svg.querySelectorAll('[data-layer="bottom"] path')].filter(p=>getComputedStyle(p).fill!=='none');
     const shoes=[...svg.querySelectorAll('[data-layer="shoes"] path')].filter(p=>getComputedStyle(p).fill!=='none').map(p=>({path:p,inverse:p.getCTM().inverse()}));
     const matrix=svg.getCTM(),points=[];
     for(let y=360;y<=554;y+=2)for(let x=90;x<=208;x+=2){
      const point=new DOMPoint(x,y);if(!body.isPointInFill(point))continue;
      const covered=y<=528?bottom.some(p=>p.isPointInFill(point)):y>=540?shoes.some(p=>p.path.isPointInFill(point.matrixTransform(matrix).matrixTransform(p.inverse))):true;
      if(!covered)points.push({x,y});
     }
     return points.length?[{bottom:svg.querySelector('[data-layer="bottom"]').parentElement.dataset.item,points:points.slice(0,5),total:points.length}]:[];
    }));
    expect(exposed,`trousers and shoes cover leg and foot anatomy on ${base}`).toEqual([]);
   }
   await page.locator('main').screenshot({path:path.join(output,`${kind}-${base}-${start}.png`)});
  }
 }
 await page.evaluate(()=>window.detail());await page.locator('.avatar-detail').first().waitFor();
 for(let i=0;i<6;i++)await page.locator('.avatar-detail').nth(i).screenshot({path:path.join(output,`detail-${i}.png`)});
}
