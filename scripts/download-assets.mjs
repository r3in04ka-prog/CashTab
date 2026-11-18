import fs from 'node:fs/promises';
const icons={tumblr:'https://img.icons8.com/color/144/tumblr.png',finder:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Finder_Icon_macOS_Big_Sur.png',trash:'https://img.icons8.com/color/144/empty-trash.png',launchpad:'https://img.icons8.com/color/144/launchpad.png',notes:'https://img.icons8.com/color/144/notepad.png',chatgpt:'https://img.icons8.com/ios-filled/144/FFFFFF/chatgpt.png',icloud:'https://img.icons8.com/color/144/icloud.png',sheets:'https://img.icons8.com/color/144/google-sheets.png'};
await Promise.all(Object.entries(icons).map(async([name,url])=>{
 const response=await fetch(url);
 if(!response.ok) throw new Error(`${name}: ${response.status}`);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.readUInt32BE(0)!==0x89504e47) throw new Error(`${name}: not a PNG`);
 await fs.writeFile(new URL(`../extension/assets/${name}.png`,import.meta.url),bytes);
 console.log(name,bytes.length);
}));
