import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5174');await page.getByRole('button',{name:'Endless shift',exact:true}).click();
 const result=await page.evaluate(async()=>{
  const m=await import(document.querySelector('script[src*="/src/main.ts"]').src),T=await import('/node_modules/three/build/three.module.js');
  const random=Math.random;Math.random=()=>0;try{m.spawn(true,0,-.7,true);}finally{Math.random=random;}
  const mouse=m.beans.find(b=>b.critter),oldZ=mouse.mesh.position.z;mouse.mesh.userData.nextVoice=0;m.shift.tick(.1);m.updateCritters(.1);
  const moving=mouse.mesh.position.z!==oldZ,kicking=mouse.mesh.userData.legs.some(leg=>Math.abs(leg.rotation.x)>.01);
  mouse.mesh.position.set(0,1.25,0);mouse.mesh.updateMatrixWorld();const c=m.controllers[0];c.matrixAutoUpdate=true;c.visible=true;c.userData.tracked=true;
  const at=mouse.mesh.getWorldPosition(new T.Vector3());c.position.set(0,0,0);c.updateMatrixWorld(true);const offset=c.userData.contact.getWorldPosition(new T.Vector3());c.position.copy(at).sub(offset);c.updateMatrixWorld(true);
  c.userData.input.dispatchEvent({type:'squeezestart'});const held=c.userData.bean===mouse;
  c.userData.motion.clear();c.userData.motion.record(at,1);c.userData.motion.record(at.clone().add(new T.Vector3(0,.2,0)),1.05);c.userData.input.dispatchEvent({type:'squeezeend'});
  const thrown=mouse.state==='air'&&mouse.velocity.y>3;
  const {playVoice}=await import('/src/voices.ts');const audible=[];
  for(const kind of ['mouse','grab','throw','grumble','lose']){const ctx=new OfflineAudioContext(1,96000,48000);playVoice(ctx,ctx.destination,kind);const buffer=await ctx.startRendering();audible.push(buffer.getChannelData(0).some(v=>Math.abs(v)>.001));}
  m.supervisor.update(.1,'failed',m.shift.elapsed,5);c.userData.tracked=false;
  return {moving,kicking,held,thrown,voices:window.beanThere.voices,audible,supervisor:m.supervisor.mode,blue:c.userData.glove.children.find(o=>o.isMesh).material.color.getHexString()};
 });
 for(const name of ['moving','kicking','held','thrown'])assert.ok(result[name],name);
 for(const kind of ['mouse','grab','throw','lose'])assert.ok(result.voices[kind]>0,kind);
 assert.ok(result.audible.every(Boolean));assert.equal(result.supervisor,'lose');assert.equal(result.blue,'247ed1');assert.deepEqual(errors,[]);
 await page.screenshot({path:'../prototype-v03.png'});
 console.log('PASS: mice scurry/kick, emit ambient/grab/throw squeaks; all five voices render non-silent audio; blue gloves; supervisor loss response.');
}finally{await browser.close();}
