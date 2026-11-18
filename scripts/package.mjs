import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs/promises';
const source=fileURLToPath(new URL('../extension/',import.meta.url));
const destination=fileURLToPath(new URL('../CashTab-v1.zip',import.meta.url));
execFileSync('powershell.exe',['-NoProfile','-File',fileURLToPath(new URL('pack.ps1',import.meta.url)),'-Source',source,'-Destination',destination],{stdio:'inherit'});
console.log(destination, (await fs.stat(destination)).size, 'bytes');
