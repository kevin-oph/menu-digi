import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
const result = spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{
  stdio:'inherit', env:{...process.env,VITE_PUBLIC_DEMO:'true',DEMO_BASE:process.env.DEMO_BASE || '/menu-digi/'},
});
if(result.status !== 0)process.exit(result.status || 1);
// No instalar un service worker ni anunciar instalación desde esta demo.
const index=readFileSync('dist/index.html','utf8').replace(/\s*<link rel="manifest"[^>]*>/g,'');
writeFileSync('dist/index.html',index);
writeFileSync('dist/404.html',index);
writeFileSync('dist/.nojekyll','');
