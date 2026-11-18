import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {readState,normalizeUrl,searchTarget,moveLink,DEFAULTS,ICONS} from '../extension/model.js';
test('URLs accept ordinary websites and reject executable/privileged schemes',()=>{
 assert.equal(normalizeUrl('example.com/path'),'https://example.com/path');
 for(const value of ['javascript:alert(1)','data:text/html,test','file:///C:/','chrome://extensions','https://user:secret@example.com'])assert.throws(()=>normalizeUrl(value));
 assert.equal(searchTarget('кот с ноутбуком'),'https://www.google.com/search?q=%D0%BA%D0%BE%D1%82%20%D1%81%20%D0%BD%D0%BE%D1%83%D1%82%D0%B1%D1%83%D0%BA%D0%BE%D0%BC');
 assert.equal(searchTarget('example.com'),'https://example.com/');
 assert.match(searchTarget('javascript:alert(1)'),/^https:\/\/www.google.com\/search\?/);
});
test('stored state rejects unsafe links, invalid positions and duplicate IDs',()=>{
 const state=readState({caption:'x'.repeat(100),dockSize:999,links:[{id:'a',name:'A',url:'https://example.com',icon:'missing',dock:true},{id:'a',name:'duplicate',url:'https://example.org'},{id:'bad',name:'bad',url:'javascript:alert(1)'}],positions:{'apps-window':{x:-30,y:20},'notes-window':{x:'bad',y:0}}});
 assert.equal(state.caption.length,60);assert.equal(state.dockSize,76);assert.equal(state.links.length,1);assert.equal(state.links[0].icon,'folder');assert.deepEqual(state.positions['apps-window'],{x:0,y:20});assert.equal(state.positions['notes-window'],undefined);
 assert.equal(readState({links:[]}).links.length,0);
 assert.equal(readState(null).links.length,12);
});
test('dock cap and reorder preserve valid links',()=>{
 const state=readState({links:DEFAULTS.links.map(item=>({...item,dock:true}))});
 assert.equal(state.links.filter(item=>item.dock).length,8);
 const source=DEFAULTS.links;const changed=moveLink(source,'chrome',1);
 assert.equal(changed[1].id,'chrome');assert.equal(source[0].id,'chrome');assert.deepEqual(moveLink(source,'chrome',-1),source);
});
test('manifest loads the new tab without host permissions or remote scripts',async()=>{
 const root=new URL('../extension/',import.meta.url);const manifest=JSON.parse(await fs.readFile(new URL('manifest.json',root),'utf8'));
 assert.equal(manifest.manifest_version,3);assert.equal(manifest.chrome_url_overrides.newtab,'newtab.html');assert.equal(manifest.permissions,undefined);assert.equal(manifest.host_permissions,undefined);
 for(const file of Object.values(manifest.icons))await fs.access(new URL(file,root));
 for(const [,file] of Object.values(ICONS))await fs.access(new URL(`assets/${file}`,root));
 const html=await fs.readFile(new URL('newtab.html',root),'utf8');assert.doesNotMatch(html,/<script[^>]+src=["']https?:/i);assert.doesNotMatch(html,/\son\w+\s*=/i);
});
