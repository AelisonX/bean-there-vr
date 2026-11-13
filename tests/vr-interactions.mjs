import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {await page.goto('http://127.0.0.1:5174');await page.getByRole('button',{name:'Endless shift',exact:true}).click();
 const result=await page.evaluate(async()=>{
  const m=await import(document.querySelector('script[src*="/src/main.ts"]').src);const T=await import('/node_modules/three/build/three.module.js');
  const {controllers,beans,station,updateHands,shift}=m;const hand=controllers[0],other=controllers[1];
  const place=(c,p)=>{c.position.set(0,0,0);c.updateMatrixWorld(true);const offset=c.userData.contact.getWorldPosition(new T.Vector3());c.position.copy(p).sub(offset);c.updateMatrixWorld(true);};
  const event=(c,type)=>c.userData.input.dispatchEvent({type});
  hand.matrixAutoUpdate=other.matrixAutoUpdate=true;hand.visible=other.visible=true;hand.userData.tracked=other.userData.tracked=true;
  hand.position.set(0,2,1);other.position.set(-1,2,1);updateHands(1);event(hand,'squeezestart');const distant=!hand.userData.bean;event(hand,'squeezeend');
  const bean=beans.find(b=>b.bad);bean.mesh.position.set(0,1.3,0);bean.mesh.updateMatrixWorld();const position=bean.mesh.localToWorld(new T.Vector3().fromBufferAttribute(bean.mesh.geometry.attributes.position,70));place(hand,position);event(hand,'squeezestart');const held=hand.userData.bean===bean;
  hand.userData.motion.clear();hand.userData.motion.record(position,2);hand.userData.motion.record(position.clone().add(new T.Vector3(0,.15,0)),2.05);event(hand,'squeezeend');const thrown=bean.state==='air'&&bean.velocity.y>2.9&&!hand.userData.bean;
  bean.mesh.updateMatrixWorld();const p=bean.mesh.localToWorld(new T.Vector3().fromBufferAttribute(bean.mesh.geometry.attributes.position,70));place(other,p);event(other,'selectstart');const caught=other.userData.bean===bean;event(other,'selectend');const released=bean.state==='air';
  const pushedBean=beans.find(b=>b.state==='belt');const center=pushedBean.mesh.getWorldPosition(new T.Vector3());hand.userData.valid=false;hand.userData.motion.clear();place(hand,center.clone().add(new T.Vector3(-.12,.01,0)));updateHands(3);hand.position.x+=.24;hand.updateMatrixWorld();updateHands(3.05);const pushed=pushedBean.state==='air'&&pushedBean.velocity.x>0;
  hand.userData.tracked=other.userData.tracked=false;
  return {distant,held,thrown,caught,released,pushed,mode:shift.mode};
 });assert.deepEqual(result,{distant:true,held:true,thrown:true,caught:true,released:true,pushed:true,mode:'endless'});assert.deepEqual(errors,[]);console.log('PASS: no remote grab; hold grab, velocity throw, opposite-hand catch/release, swept hand push, endless selection. Synthetic input only; physical Quest remains unverified.');
 await page.getByRole('button',{name:'Endless shift',exact:true}).click();
 const before=await page.evaluate(()=>window.beanThere.score);
 await page.evaluate(async()=>{const m=await import(document.querySelector('script[src*="/src/main.ts"]').src);const b=m.beans.find(b=>b.bad);b.state='air';b.mesh.position.set(.9,1.4,.2);b.velocity.set(0,-5,0);});
 await page.waitForFunction(()=>window.beanThere.score===20);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.beanThere.score),before+20);
 await page.getByRole('button',{name:'Endless shift',exact:true}).click();
 await page.evaluate(async()=>{const m=await import(document.querySelector('script[src*="/src/main.ts"]').src);m.shift.tick(1000);});
 assert.equal(await page.evaluate(()=>window.beanThere.phase),'running');
 console.log('PASS: fast throw crosses bin opening and scores once; endless survives 90 seconds in rendered simulation.');
} finally {await browser.close();}
