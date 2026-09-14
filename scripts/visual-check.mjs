import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port','4173','--strictPort'],{stdio:'inherit'});
let browser;
try{
 for(let i=0;i<60;i++){try{const r=await fetch('http://127.0.0.1:4173/');if(r.ok)break}catch{}await new Promise(r=>setTimeout(r,500));if(i===59)throw Error('Le serveur ne démarre pas')}
 browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'load'});
 await page.waitForFunction(()=>window.__courseReview?.ready,{},{timeout:120000});
 const diagnostics=await page.evaluate(()=>window.__courseReview);assert(diagnostics.roadOnRight);
 await mkdir('artifacts',{recursive:true});
 for(const view of ['tee','approach','green','aerial']){await page.locator('[data-view="'+view+'"]').click();await page.waitForTimeout(2100);await page.screenshot({path:'artifacts/'+view+'.png'})}
 await page.locator('#progress').fill('170');await page.waitForTimeout(200);assert.equal(await page.locator('#travel').textContent(),'170 m');
 await page.locator('#info').click();assert(await page.locator('#about').isVisible());await page.locator('#close').click();
 await page.setViewportSize({width:390,height:844});await page.locator('[data-view="tee"]').click();await page.waitForTimeout(2100);await page.screenshot({path:'artifacts/mobile.png'});
 await writeFile('artifacts/checks.json',JSON.stringify({diagnostics,errors,warning:'Captures de rendu logiciel CI ; aucune mesure de performance Android.'},null,2));
 assert.deepEqual(errors,[],'Erreurs de rendu ou de chargement');
}finally{await browser?.close();server.kill('SIGTERM')}
