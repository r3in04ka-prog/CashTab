import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const target = new URL('../extension/assets/icons/', import.meta.url);
await fs.mkdir(target, {recursive:true});
for (const prefix of ['bi','logos']) {
  const data = JSON.parse(await fs.readFile(new URL(`../node_modules/@iconify-json/${prefix}/icons.json`,import.meta.url),'utf8'));
  const names = prefix === 'bi'
    ? ['search','gear','grid-3x3-gap-fill','heart-fill','shield-check','plus','x','check','arrow-clockwise','sort-alpha-down','wifi','volume-up','fullscreen','chevron-left','chevron-right','journal-text','trash3','battery-full','image','three-dots','arrow-up-right','folder','download','arrow-counterclockwise']
    : ['chrome','telegram','github-icon','visual-studio-code','google-drive','steam','youtube-icon','deepseek-icon','google-gmail','tumblr-icon'];
  for (const name of names) {
    const icon = data.icons[name];
    if (!icon) { console.warn('Missing',prefix,name); continue; }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${icon.width || data.width || 16} ${icon.height || data.height || 16}">${icon.body}</svg>`;
    await fs.writeFile(path.join(fileURLToPath(target),`${prefix}-${name}.svg`),svg);
  }
}
// These license files travel with the extension assets.
for (const prefix of ['bi','logos']) {
  await fs.copyFile(new URL(`../node_modules/@iconify-json/${prefix}/info.json`,import.meta.url),new URL(`../extension/assets/${prefix}-info.json`,import.meta.url));
}
