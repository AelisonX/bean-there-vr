import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import * as T from 'three';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(process.env.TEST_URL || 'http://127.0.0.1:5174');await page.waitForFunction(()=>window.beanThere);
 await page.getByRole('button',{name:'Start shift',exact:true}).click();
 let state=await page.evaluate(()=>window.beanThere);assert.equal(state.beans.length,40);assert.equal(state.beans.filter(b=>b.bad).length,7);assert.equal(state.xr,true);
 await page.waitForTimeout(350);let next=await page.evaluate(()=>window.beanThere);assert.ok(next.beans[0].x>state.beans[0].x);
 await page.screenshot({path:'../prototype-desktop.png'});
 next=await page.evaluate(()=>window.beanThere); const bad=next.beans.find(b=>b.bad&&b.screen[0]>-.15&&b.screen[0]<.5);const [sx,sy]=bad.screen;await page.mouse.move((sx+1)*720,(1-sy)*500);await page.mouse.down();
 assert.ok((await page.evaluate(()=>window.beanThere)).beans.some(b=>b.state==='held'));
 // World-space bin center projected by the same camera, at holding height.
 const binScreen=(()=>{const cam=new T.PerspectiveCamera(52,1.44,.05,40);cam.position.set(0,1.9,1.65);cam.lookAt(0,.85,-.55);cam.updateMatrixWorld();return new T.Vector3(.95,1.08,.3).project(cam).toArray();})();
 await page.mouse.move((binScreen[0]+1)*720,(1-binScreen[1])*500);await page.waitForTimeout(200);await page.mouse.up();await page.waitForFunction(()=>window.beanThere.score===20,{},{timeout:10000});
 assert.equal((await page.evaluate(()=>window.beanThere)).score,20);
 await page.keyboard.press('p');state=await page.evaluate(()=>window.beanThere);await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>window.beanThere)).beans[0].x,state.beans[0].x);
 await page.keyboard.press('r');assert.equal((await page.evaluate(()=>window.beanThere)).score,0);assert.equal((await page.evaluate(()=>window.beanThere)).beans.length,40);
 await page.screenshot({path:'../prototype-desktop.png'});assert.deepEqual(errors,[]);console.log('PASS: rendering, 33/7 batch, movement, mouse grab/drop into bin, score, pause, restart, XR enabled; no page errors.');
}finally{await browser.close();}
