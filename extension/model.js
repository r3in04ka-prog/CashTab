export const STORAGE_KEY='plumtab.settings.v1';
export const NOTES_KEY='plumtab.notes.v1';
export const ICONS={
 chrome:['Google Chrome','icons/logos-chrome.svg'],telegram:['Telegram','icons/logos-telegram.svg'],github:['GitHub','icons/logos-github-icon.svg'],vscode:['Visual Studio Code','icons/logos-visual-studio-code.svg'],drive:['Google Drive','icons/logos-google-drive.svg'],chatgpt:['ChatGPT','chatgpt.png'],steam:['Steam','icons/logos-steam.svg'],youtube:['YouTube','icons/logos-youtube-icon.svg'],deepseek:['DeepSeek','icons/logos-deepseek-icon.svg'],gmail:['Gmail','icons/logos-google-gmail.svg'],icloud:['iCloud','icloud.png'],sheets:['Google Sheets','sheets.png'],tumblr:['Tumblr','tumblr.png'],folder:['Сайт','icons/bi-folder.svg']
};
export const DEFAULTS={version:1,caption:'“WALLPAPER”',showCaption:true,showApps:true,clock:'24',dockSize:64,favoritesOnly:false,positions:{},trash:[],links:[
 {id:'chrome',name:'Google Chrome',url:'https://www.google.com/',icon:'chrome',dock:true},
 {id:'telegram',name:'Telegram',url:'https://web.telegram.org/',icon:'telegram',dock:true},
 {id:'github',name:'GitHub',url:'https://github.com/',icon:'github',dock:false},
 {id:'vscode',name:'Visual Studio Code',url:'https://vscode.dev/',icon:'vscode',dock:false},
 {id:'drive',name:'Google Drive',url:'https://drive.google.com/',icon:'drive',dock:false},
 {id:'chatgpt',name:'ChatGPT',url:'https://chatgpt.com/',icon:'chatgpt',dock:true},
 {id:'steam',name:'Steam',url:'https://store.steampowered.com/',icon:'steam',dock:false},
 {id:'tumblr',name:'Tumblr',url:'https://www.tumblr.com/',icon:'tumblr',dock:true},
 {id:'deepseek',name:'DeepSeek',url:'https://chat.deepseek.com/',icon:'deepseek',dock:false},
 {id:'gmail',name:'Gmail',url:'https://mail.google.com/',icon:'gmail',dock:true},
 {id:'icloud',name:'iCloud',url:'https://www.icloud.com/',icon:'icloud',dock:true},
 {id:'sheets',name:'Google Sheets',url:'https://sheets.google.com/',icon:'sheets',dock:false}
]};
export function normalizeUrl(value){
 const raw=String(value).trim();
 if(!raw)throw new Error('Введите адрес сайта.');
 const url=new URL(/^[a-z][a-z\d+.-]*:/i.test(raw)?raw:`https://${raw}`);
 if(!['https:','http:'].includes(url.protocol)||!url.hostname||url.username||url.password)throw new Error('Нужен адрес http:// или https:// без логина и пароля.');
 return url.href;
}
export function sanitizeLink(item){
 if(!item||typeof item!=='object')return null;
 try{
  const name=String(item.name??'').trim().slice(0,32);
  if(!name)return null;
  return {id:String(item.id??'').slice(0,80),name,url:normalizeUrl(item.url),icon:Object.hasOwn(ICONS,item.icon)?item.icon:'folder',dock:item.dock===true};
 }catch{return null;}
}
export function readState(value){
 const state=structuredClone(DEFAULTS);
 if(!value||typeof value!=='object')return state;
 state.caption=typeof value.caption==='string'?value.caption.slice(0,60):state.caption;
 for(const key of ['showApps','showCaption','favoritesOnly'])if(typeof value[key]==='boolean')state[key]=value[key];
 if(['12','24'].includes(value.clock))state.clock=value.clock;
 if(Number.isFinite(value.dockSize))state.dockSize=Math.min(76,Math.max(44,value.dockSize));
 const ids=new Set();
 if(Array.isArray(value.links))state.links=value.links.slice(0,100).map(sanitizeLink).filter(item=>item&&item.id&&!ids.has(item.id)&&ids.add(item.id));
 let dockCount=0;for(const link of state.links){if(link.dock&&++dockCount>8)link.dock=false;}
 if(Array.isArray(value.trash))state.trash=value.trash.slice(0,100).map(sanitizeLink).filter(item=>item&&item.id&&!ids.has(item.id)&&ids.add(item.id));
 for(const key of ['apps-window','notes-window']){
  const p=value.positions?.[key];
  if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))state.positions[key]={x:Math.max(0,p.x),y:Math.max(0,p.y)};
 }
 return state;
}
export function searchTarget(value){
 const text=String(value).trim();
 if(!text)return null;
 if(!/\s/.test(text)&&(/^[a-z][a-z\d+.-]*:/i.test(text)||/^[\w.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(text))){
  try{return normalizeUrl(text);}catch{/* Unsafe schemes are searched as text. */}
 }
 return `https://www.google.com/search?q=${encodeURIComponent(text)}`;
}
export function moveLink(links,id,direction){
 const copy=[...links];const from=copy.findIndex(item=>item.id===id);const to=from+direction;
 if(from>=0&&to>=0&&to<copy.length)[copy[from],copy[to]]=[copy[to],copy[from]];
 return copy;
}
