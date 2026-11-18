import {STORAGE_KEY,NOTES_KEY,DEFAULTS,ICONS,readState,normalizeUrl,searchTarget,moveLink} from './model.js';
const $=id=>document.getElementById(id);
const asset=path=>`assets/${path}`;
let state=readState(null),menuName=null,toastTimer,wallpaperURL,db;
try{state=readState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{/* Recover from malformed storage. */}
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4000);}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{toast('Не удалось сохранить настройки: хранилище недоступно или заполнено.');return false;}}
function image(src,cls=''){const img=document.createElement('img');img.src=asset(src);img.alt='';img.className=cls;return img;}
function uiIcon(name){return image(`icons/bi-${name}.svg`,'ui-icon');}
function iconFor(link){return ICONS[link.icon]?.[1]||ICONS.folder[1];}
function button(label,action,className=''){const b=document.createElement('button');b.type='button';b.textContent=label;b.className=className;b.addEventListener('click',action);return b;}
function iconButton(label,icon,action){const b=button('',action,'icon-button');b.setAttribute('aria-label',label);b.title=label;b.append(uiIcon(icon));return b;}
function linkAnchor(link,dock=false){
 const a=document.createElement('a');a.href=link.url;a.target='_blank';a.rel='noopener noreferrer';a.className=dock?'dock-item':'app-link';a.title=link.name;
 const img=image(iconFor(link),dock?'dock-icon':'');
 if(link.icon==='folder')img.classList.add('ui-icon');
 if(dock){if(['chatgpt','icloud'].includes(link.icon))a.classList.add('brand-tile');if(link.icon==='chrome')a.classList.add('chrome-tile');const tip=document.createElement('span');tip.className='dock-tooltip';tip.textContent=link.name;a.append(tip,img);}
 else{const name=document.createElement('span');name.textContent=link.name;a.append(img,name);}
 a.setAttribute('aria-label',link.name);return a;
}
function dockAction(name,img,action,active=false){const b=button('',()=>actions[action](),'dock-item');b.setAttribute('aria-label',name);const tip=document.createElement('span');tip.className='dock-tooltip';tip.textContent=name;b.append(tip,image(img,'dock-icon'));if(active){const dot=document.createElement('span');dot.className='dock-dot';b.append(dot);}return b;}
function render(){
 $('wallpaper-caption').textContent=state.caption;$('wallpaper-caption').hidden=!state.showCaption||!state.caption;
 $('apps-window').hidden=!state.showApps;document.documentElement.style.setProperty('--dock-size',`${state.dockSize}px`);
 const favorite=document.querySelector('.favorite-toggle');favorite.setAttribute('aria-pressed',String(state.favoritesOnly));
 const links=state.links.filter(link=>!state.favoritesOnly||link.dock);$('app-grid').replaceChildren(...links.map(link=>linkAnchor(link)));$('apps-empty').hidden=links.length>0;
 const dock=$('dock-links');dock.replaceChildren(dockAction('Приложения','finder.png','apps',state.showApps),dockAction('Поиск','launchpad.png','search'),...state.links.filter(link=>link.dock).map(link=>linkAnchor(link,true)),dockAction('Заметки','notes.png','notes',!$('notes-window').hidden));
 $('trash-dot').hidden=state.trash.length===0;
 syncSettings();renderLinkEditor();renderTrash();updateClock();
}
function syncSettings(){
 $('caption-input').value=state.caption;$('clock-format').value=state.clock;$('dock-size').value=state.dockSize;$('show-apps').checked=state.showApps;$('show-caption').checked=state.showCaption;
}
function updateClock(){const now=new Date();const date=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(now).replace('.','');const time=new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit',hour12:state.clock==='12'}).format(now);$('menu-clock').textContent=`${date} ${time}`;$('menu-clock').dateTime=now.toISOString();}
function openDialog(id){closeMenu();const dialog=$(id);if(!dialog.open)dialog.showModal();}
function setSettingsTab(name){
 for(const tab of document.querySelectorAll('[data-settings-tab]')){const active=tab.dataset.settingsTab===name;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$(tab.getAttribute('aria-controls')).hidden=!active;}
}
function openSettings(tab='appearance'){setSettingsTab(tab);renderLinkEditor();openDialog('settings-dialog');}
function openLinkEditor(id){
 const link=state.links.find(item=>item.id===id);$('link-form').reset();$('link-id').value=link?.id||'';$('link-title').textContent=link?'Изменить приложение':'Добавить приложение';$('link-name').value=link?.name||'';$('link-url').value=link?.url||'';$('link-icon').value=link?.icon||'folder';$('link-dock').checked=link?.dock??true;$('link-error').textContent='';openDialog('link-dialog');$('link-name').focus();
}
function renderLinkEditor(){
 const rows=state.links.map((link,index)=>{
  const row=document.createElement('div');row.className='link-editor-row';row.append(image(iconFor(link)));
  const detail=document.createElement('div');detail.className='link-detail';const title=document.createElement('strong');title.textContent=link.name;const url=document.createElement('small');url.textContent=new URL(link.url).hostname;detail.append(title,url);row.append(detail);
  const dock=iconButton(link.dock?'Убрать из дока':'Добавить в док','heart-fill',()=>{if(!link.dock&&state.links.filter(item=>item.dock).length>=8){toast('В доке максимум 8 ссылок. Сначала уберите одну.');return;}link.dock=!link.dock;save();render();});dock.style.opacity=link.dock?'1':'.35';row.append(dock);
  const up=iconButton('Переместить выше','chevron-left',()=>{state.links=moveLink(state.links,link.id,-1);save();render();});up.disabled=index===0;row.append(up);
  const down=iconButton('Переместить ниже','chevron-right',()=>{state.links=moveLink(state.links,link.id,1);save();render();});down.disabled=index===state.links.length-1;row.append(down);
  row.append(iconButton(`Изменить ${link.name}`,'gear',()=>openLinkEditor(link.id)),iconButton(`Убрать ${link.name} в корзину`,'trash3',()=>{state.links=state.links.filter(item=>item.id!==link.id);state.trash.unshift(link);state.trash=state.trash.slice(0,100);save();render();toast('Ссылка перемещена в корзину. Её можно восстановить.');}));return row;
 });$('links-editor').replaceChildren(...rows);
}
function renderTrash(){
 if(state.trash.length===0){const p=document.createElement('p');p.className='empty';p.textContent='Корзина пуста';$('trash-list').replaceChildren(p);return;}
 $('trash-list').replaceChildren(...state.trash.map(link=>{const row=document.createElement('div');row.className='trash-row';const name=document.createElement('span');name.textContent=link.name;row.append(name,button('Восстановить',()=>{if(state.links.length>=100){toast('Максимум 100 ссылок.');return;}if(link.dock&&state.links.filter(item=>item.dock).length>=8)link.dock=false;state.trash=state.trash.filter(item=>item.id!==link.id);state.links.push(link);save();render();},'mac-button'));return row;}));
}
const actions={
 apps(){state.showApps=true;save();render();bringFront($('apps-window'));},
 'toggle-apps'(){state.showApps=!state.showApps;save();render();},
 settings(){openSettings();},edit(){openSettings('links');},'add-link'(){openLinkEditor();},
 search(){openDialog('search-dialog');$('search-input').focus();},
 notes(){const pane=$('notes-window');pane.hidden=!pane.hidden;bringFront(pane);render();if(!pane.hidden)$('notes').focus();},
 'close-notes'(){$('notes-window').hidden=true;render();},
 refresh(){render();toast('Рабочий стол обновлён.');},
 trash(){renderTrash();openDialog('trash-dialog');},
 'sort-name'(){state.links.sort((a,b)=>a.name.localeCompare(b.name,'ru'));save();render();toast('Приложения отсортированы по имени.');},
 'sort-default'(){state.links.sort((a,b)=>{const rank=id=>{const i=DEFAULTS.links.findIndex(item=>item.id===id);return i<0?999:i;};return rank(a.id)-rank(b.id);});save();render();},
 'reset-position'(){state.positions={};for(const id of ['apps-window','notes-window']){const el=$(id);el.style.left='';el.style.top='';el.style.right='';el.style.width='';el.style.height='';}save();toast('Расположение окон восстановлено.');},
 'toggle-caption'(){state.showCaption=!state.showCaption;save();render();},
 about(){openSettings('about');}
};
for(const el of document.querySelectorAll('[data-action]'))el.addEventListener('click',()=>actions[el.dataset.action]?.());
for(const el of document.querySelectorAll('[data-close]'))el.addEventListener('click',()=>$(el.dataset.close).close());
document.querySelector('.favorite-toggle').addEventListener('click',()=>{state.favoritesOnly=!state.favoritesOnly;save();render();});
const menus={desktop:[['О CashTab','about'],['Системные настройки…','settings'],null,['Вернуть окна на место','reset-position']],file:[['Добавить приложение…','add-link'],['Новая заметка','notes'],null,['Поиск…','search','Alt+Space']],view:[['Окно приложений','toggle-apps'],['Надпись на обоях','toggle-caption'],null,['Сменить обои…','settings']],sort:[['По имени','sort-name'],['Исходный порядок','sort-default']],windows:[['Приложения','apps'],['Заметки','notes'],['Корзина','trash'],null,['Вернуть окна на место','reset-position']]};
function closeMenu(){$('menu').hidden=true;menuName=null;for(const el of document.querySelectorAll('[data-menu]'))el.setAttribute('aria-expanded','false');}
for(const trigger of document.querySelectorAll('[data-menu]'))trigger.addEventListener('click',()=>{
 const name=trigger.dataset.menu;if(menuName===name){closeMenu();return;}closeMenu();menuName=name;trigger.setAttribute('aria-expanded','true');
 const elements=menus[name].map(item=>{if(!item){const line=document.createElement('div');line.className='menu-rule';line.setAttribute('role','separator');return line;}const b=button(item[0],()=>{closeMenu();actions[item[1]]();});b.setAttribute('role','menuitem');if(item[2]){const hint=document.createElement('kbd');hint.textContent=item[2];b.append(hint);}return b;});$('menu').replaceChildren(...elements);$('menu').hidden=false;$('menu').style.left=`${Math.min(trigger.getBoundingClientRect().left,innerWidth-230)}px`;
});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.dropdown,.menu-trigger'))closeMenu();});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape')closeMenu();
 if(event.altKey&&event.code==='Space'){event.preventDefault();actions.search();}
 if(!$('menu').hidden&&['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();const items=[...$('menu').querySelectorAll('button')];const index=items.indexOf(document.activeElement);items[(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();}
});
for(const tab of document.querySelectorAll('[data-settings-tab]')){tab.addEventListener('click',()=>setSettingsTab(tab.dataset.settingsTab));tab.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();const tabs=[...document.querySelectorAll('[data-settings-tab]')];const next=tabs[(tabs.indexOf(tab)+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];setSettingsTab(next.dataset.settingsTab);next.focus();}});}
for(const [key,[name]] of Object.entries(ICONS)){const option=document.createElement('option');option.value=key;option.textContent=name;$('link-icon').append(option);}
$('link-form').addEventListener('submit',event=>{
 event.preventDefault();try{
  const id=$('link-id').value;const name=$('link-name').value.trim();if(!name)throw new Error('Введите название.');
  const url=normalizeUrl($('link-url').value),dock=$('link-dock').checked;
  if(dock&&state.links.filter(link=>link.dock&&link.id!==id).length>=8)throw new Error('В доке максимум 8 ссылок. Снимите галочку или уберите другую ссылку.');
  if(!id&&state.links.length>=100)throw new Error('Максимум 100 ссылок.');
  const link={id:id||crypto.randomUUID(),name,url,icon:$('link-icon').value,dock};
  if(id)state.links=state.links.map(item=>item.id===id?link:item);else state.links.push(link);
  save();render();$('link-dialog').close();toast('Приложение сохранено.');
 }catch(error){$('link-error').textContent=error.message;}
});
$('search-form').addEventListener('submit',event=>{event.preventDefault();const target=searchTarget($('search-input').value);if(target)location.assign(target);});
for(const [id,key,event] of [['caption-input','caption','input'],['clock-format','clock','change'],['dock-size','dockSize','input'],['show-apps','showApps','change'],['show-caption','showCaption','change']]){
 $(id).addEventListener(event,()=>{const input=$(id);state[key]=input.type==='checkbox'?input.checked:input.type==='range'?Number(input.value):input.value;save();if(id==='caption-input'){$('wallpaper-caption').textContent=state.caption;$('wallpaper-caption').hidden=!state.showCaption||!state.caption;}else render();});
}
let noteTimer;try{$('notes').value=localStorage.getItem(NOTES_KEY)||'';}catch{}
$('notes').addEventListener('input',()=>{$('note-status').textContent='Сохранение…';clearTimeout(noteTimer);noteTimer=setTimeout(saveNote,250);});
function saveNote(){try{localStorage.setItem(NOTES_KEY,$('notes').value);$('note-status').textContent='Сохранено';}catch{$('note-status').textContent='Не сохранено';toast('Не удалось сохранить заметку. Скопируйте текст перед закрытием.');}}
window.addEventListener('pagehide',()=>{if(noteTimer){clearTimeout(noteTimer);saveNote();}});
function bringFront(el){for(const window of document.querySelectorAll('.desktop-window'))window.style.zIndex='1';el.style.zIndex='2';}
function clampWindow(el,x,y){return{x:Math.max(0,Math.min(x,innerWidth-Math.min(el.offsetWidth,innerWidth))),y:Math.max(0,Math.min(y,innerHeight-140))};}
function placeWindow(el,x,y){const pos=clampWindow(el,x,y);el.style.left=`${pos.x}px`;el.style.top=`${pos.y}px`;el.style.right='auto';return pos;}
for(const handle of document.querySelectorAll('[data-drag]')){
 let drag=null;const el=$(handle.dataset.drag);
 handle.addEventListener('pointerdown',event=>{if(event.button!==0||event.target.closest('button'))return;bringFront(el);const r=el.getBoundingClientRect();drag={x:event.clientX-r.left,y:event.clientY-r.top};handle.setPointerCapture(event.pointerId);});
 handle.addEventListener('pointermove',event=>{if(!drag)return;placeWindow(el,event.clientX-drag.x,event.clientY-drag.y-30);});
 const finish=()=>{if(!drag)return;drag=null;state.positions[el.id]={x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0};save();};handle.addEventListener('pointerup',finish);handle.addEventListener('lostpointercapture',finish);
 el.addEventListener('pointerdown',()=>bringFront(el));
}
window.addEventListener('resize',()=>{for(const id of ['apps-window','notes-window']){const el=$(id);if(state.positions[id])placeWindow(el,state.positions[id].x,state.positions[id].y);}});
for(const [id,pos] of Object.entries(state.positions))placeWindow($(id),pos.x,pos.y);
async function wallpaperDb(){if(db)return db;db=await new Promise((resolve,reject)=>{const request=indexedDB.open('plumtab.assets',1);request.onupgradeneeded=()=>request.result.createObjectStore('images');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return db;}
async function imageStore(mode,operation){const database=await wallpaperDb();return new Promise((resolve,reject)=>{const tx=database.transaction('images',mode);const result=operation(tx.objectStore('images'));tx.oncomplete=()=>resolve(result?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
function applyWallpaper(blob){if(wallpaperURL)URL.revokeObjectURL(wallpaperURL);wallpaperURL=blob?URL.createObjectURL(blob):null;const url=wallpaperURL||asset('wallpaper.png');$('wallpaper').style.backgroundImage=`url("${url}")`;$('wallpaper-preview').src=url;}
imageStore('readonly',store=>store.get('wallpaper')).then(blob=>{if(blob instanceof Blob)applyWallpaper(blob);}).catch(()=>{/* Default wallpaper remains available offline. */});
$('wallpaper-upload').addEventListener('change',async()=>{const file=$('wallpaper-upload').files[0];if(!file)return;try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>4*1024*1024)throw new Error('Выберите PNG, JPEG или WebP размером до 4 МБ.');const decoded=await createImageBitmap(file);decoded.close();await imageStore('readwrite',store=>store.put(file,'wallpaper'));applyWallpaper(file);toast('Обои сохранены.');}catch(error){toast(error.message||'Не удалось сохранить обои.');}finally{$('wallpaper-upload').value='';}});
$('reset-wallpaper').addEventListener('click',async()=>{try{await imageStore('readwrite',store=>store.delete('wallpaper'));applyWallpaper(null);toast('Исходные обои восстановлены.');}catch{toast('Не удалось восстановить обои.');}});
$('export-settings').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='plumtab-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY){try{state=readState(JSON.parse(event.newValue));render();}catch{}}if(event.key===NOTES_KEY&&document.activeElement!==$('notes'))$('notes').value=event.newValue||'';});
render();setInterval(updateClock,1000);
