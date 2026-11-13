import * as T from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Shift, initialBatch, insideBin, BIN } from './game';
import './style.css';
import {gripOrientation,fingerCurl,BEAN_SCALE} from './gloves';
import {buildFactory,Supervisor} from './factory';
import {playVoice,type Voice} from './voices';
import { Motion, segmentDistance } from './interaction';

document.querySelector('#app')!.innerHTML = `<header><small>AELIS’ØN / FACTORY 01 · v0.3</small><h1>BEAN THERE <span style="color:#d8f58e">VR</span></h1><p>A very normal job. Now in three dimensions.</p></header><section class="panel"><div id="stats"></div><p id="message">Leave green beans. Reject brown, yellow and tightly curled beans.</p><button id="start">Start shift</button><button id="endless">Endless shift</button><button id="pause" class="secondary">Pause</button><button id="sound" class="secondary">Sound: on</button><div class="help">DESKTOP · Click a bean to grab. Move over the white bin, click to drop. R restarts · P pauses.<br>VR · Reach with your gloves. Hold trigger or grip to grab; release to throw. Touch beans to push. Panel: left = timed, right = endless. White bin is on your right.</div><label>Station height <input id="height" aria-label="Station height" type="range" min="-0.4" max="0.3" step="0.05" value="0"></label></section>`;
const scene = new T.Scene(); scene.background = new T.Color('#80958c'); scene.fog = new T.Fog('#80958c', 7, 19);
const camera = new T.PerspectiveCamera(52, innerWidth/innerHeight, .05, 40); camera.position.set(0,1.9,1.65); camera.lookAt(0,.85,-.55);
const renderer = new T.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.xr.enabled = true; renderer.xr.setReferenceSpaceType('local-floor'); document.body.append(renderer.domElement); document.body.append(VRButton.createButton(renderer));
scene.add(new T.HemisphereLight(0xe6ffe5,0x394740,2.5)); const light = new T.DirectionalLight(0xffefd2,2.5); light.position.set(2,6,3);scene.add(light);
const station = new T.Group();scene.add(station);
const mat = (color:T.ColorRepresentation) => new T.MeshStandardMaterial({color,roughness:.8});
const steel=mat('#a9bab4'), dark=mat('#1f3c37'), green=mat('#416f47'), white=mat('#f3f0dd'), yellow=mat('#e8b64f');
const cubeGeo = new T.BoxGeometry(1,1,1);
function box(x:number,y:number,z:number,w:number,h:number,d:number,m:T.Material,parent:T.Object3D=station) {const o=new T.Mesh(cubeGeo,m);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);return o;}
box(0,-.08,0,18,.15,18,mat('#647a70'),scene);
for(let x=-6;x<=6;x+=3){box(x,2,-5,.15,4,.15,dark,scene);box(x,3.4,-1,.08,.08,9,steel,scene);box(x,3.3,-1,.8,.04,2,white,scene);}
box(0,2,-5,14,4,.1,mat('#9aaaa0'),scene);buildFactory(scene);
box(0,.86,-.72,2.8,.13,.64,dark);for(const z of [-1.08,-.36])box(0,.92,z,2.9,.14,.055,steel);
for(const x of [-1.2,1.2])for(const z of [-.96,-.48])box(x,.43,z,.07,.86,.07,steel);
const slats:T.Mesh[]=[];for(let i=0;i<32;i++)slats.push(box(-1.4+i*2.8/32,.931,-.72,.018,.008,.61,mat('#456057')));
for(const x of [-1.4,1.4]){const roller=new T.Mesh(new T.CylinderGeometry(.09,.09,.66,12),steel);roller.rotation.x=Math.PI/2;roller.position.set(x,.85,-.72);station.add(roller);}
function bin(x:number,z:number,w:number,d:number,m:T.Material){box(x,.12,z,w,.12,d,m);box(x-w/2,.39,z,.05,.55,d,m);box(x+w/2,.39,z,.05,.55,d,m);box(x,.39,z-d/2,w,.55,.05,m);box(x,.39,z+d/2,w,.55,.05,m);}
bin(BIN.x,BIN.z,.67,.67,white); bin(1.73,-.72,.48,.78,green);
// Canvas signs remain readable inside the headset as well as on desktop.
function sign(text:string,x:number,y:number,z:number,w:number,color='#e7f4bf') {const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#173c35';ctx.fillRect(0,0,768,256);ctx.fillStyle=color;ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,144);const mesh=new T.Mesh(new T.PlaneGeometry(w,w/3),new T.MeshBasicMaterial({map:new T.CanvasTexture(c)}));mesh.position.set(x,y,z);station.add(mesh);return mesh;}
sign('REJECT ↓',BIN.x,.5,.56,.49);sign('KEEP →',1.72,.82,-1.15,.53);sign('QUALITY CONTROL / 01',0,3.1,-4.7,2.3);
const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=384;const hudCtx=hudCanvas.getContext('2d')!;const hudTexture=new T.CanvasTexture(hudCanvas);const hud=new T.Mesh(new T.PlaneGeometry(1.35,.506),new T.MeshBasicMaterial({map:hudTexture}));hud.position.set(0,2.12,-2.5);station.add(hud);
type Bean = {mesh:T.Mesh,bad:boolean,critter:boolean,state:'belt'|'held'|'air'|'done',velocity:T.Vector3,spin:T.Vector3};
const beans:Bean[]=[];const materials=[mat('#4e9b38'),mat('#63aa40'),mat('#398342'),mat('#ad792d'),mat('#a5a23b'),mat('#685538')];
function geometry(curve:number,length:number) {const points=[];for(let i=0;i<=12;i++){const t=i/12;points.push(new T.Vector3((t-.5)*length,.006*Math.sin(t*9),Math.sin(t*Math.PI)*curve));}const path=new T.CatmullRomCurve3(points);const geo=new T.TubeGeometry(path,20,.014,6,false);const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const ring=Math.floor(i/7),t=ring/20;const center=path.getPointAt(t);const v=new T.Vector3().fromBufferAttribute(pos,i).sub(center).multiplyScalar(.15+.85*Math.pow(Math.sin(t*Math.PI),.3)).add(center);pos.setXYZ(i,v.x,v.y,v.z);}geo.computeVertexNormals();return geo;}
const geometries=Array.from({length:8},(_,i)=>geometry(i>5?.1:.012+i*.003,.19+(i%3)*.025));
const shift=new Shift();const supervisor=new Supervisor(scene,lose=>voice(lose?'lose':'grumble'));const voiceCounts:Record<string,number>={};let spawnTimer=0,spawnIndex=0,feedback='Ready for your voluntary factory shift?',muted=false,audio:AudioContext|undefined;
function tone(good:boolean){if(muted)return;audio??=new AudioContext();void audio.resume();const osc=audio.createOscillator(),gain=audio.createGain();osc.frequency.value=good?660:150;gain.gain.setValueAtTime(.045,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.15);osc.connect(gain).connect(audio.destination);osc.start();osc.stop(audio.currentTime+.15);}
const critterBody=new T.SphereGeometry(.045,10,6), critterEar=new T.SphereGeometry(.018,8,6);
const fur=mat('#8d8174'),pink=mat('#c9928d'),eye=mat('#161e1a');
function spawn(bad:boolean,x=-1.3,z=-.72,allowCritter=false){
 const variant=spawnIndex++%3,critter=allowCritter&&bad&&beans.filter(b=>b.critter&&b.state!=='done').length<2&&Math.random()<.12;
 const mesh=new T.Mesh(critter?critterBody:geometries[bad?5+variant:spawnIndex%5],critter?fur:materials[bad?3+variant:spawnIndex%3]);
 if(critter){mesh.userData.phase=Math.random()*Math.PI*2;mesh.userData.nextVoice=shift.elapsed+3+Math.random()*5;mesh.userData.legs=[];for(const side of [-1,1])for(const end of [-1,1]){const leg=box(end*.026,-.03,side*.037,.025,.016,.033,pink,mesh);mesh.userData.legs.push(leg);}mesh.scale.set(1.3,.8,.85);for(const side of [-1,1]){const ear=new T.Mesh(critterEar,pink);ear.position.set(-.025,.04,side*.028);mesh.add(ear);const e=new T.Mesh(new T.SphereGeometry(.006,6,4),eye);e.position.set(-.04,.016,side*.03);mesh.add(e);}const tail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.03,0,0),new T.Vector3(.08,.005,.03),new T.Vector3(.12,0,.01)]),8,.004,4,false),pink);mesh.add(tail);}
 else {mesh.scale.set(.75+Math.random()*.5,.8+Math.random()*.5,.8+Math.random()*.4);if(bad&&variant===0)mesh.scale.x*=.58;mesh.scale.multiplyScalar(BEAN_SCALE);}
 mesh.position.set(x,.96,z);mesh.rotation.y=Math.random()*Math.PI;station.add(mesh);beans.push({mesh,bad,critter,state:'belt',velocity:new T.Vector3(),spin:new T.Vector3()});
}
function removeItem(b:Bean){station.remove(b.mesh);for(const child of b.mesh.children){if(child instanceof T.Mesh && child.geometry!==critterEar&&child.geometry!==cubeGeo)child.geometry.dispose();}}
function releaseAll(){desktop=undefined;for(const c of controllers){const b=c.userData.bean as Bean|undefined;if(b)station.attach(b.mesh);c.userData.bean=undefined;c.userData.buttons.clear();c.userData.motion.clear();c.userData.valid=false;}}
function start(mode:'timed'|'endless'=shift.mode){releaseAll();for(const b of beans)removeItem(b);beans.length=0;shift.start(mode);supervisor.reset();ensureAudio();spawnIndex=0;spawnTimer=0;initialBatch().forEach((bad,i)=>spawn(bad,-1.22+(i%9)*.28,-.92+Math.floor(i/9)*.19));feedback='Shift started. Brown, yellow or tightly curled? Bin it.';tone(true);}
function finish(b:Bean,bin:boolean){if(b.state==='done')return;shift.resolve(b.bad,bin);b.state='done';b.mesh.visible=false;feedback=bin?(b.bad?'Reject removed. +20':'That was good produce. −18'):(b.bad?'Defect escaped. −10':'Good bean collected. +2');if(bin||b.bad)tone(b.bad===bin);}
const ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),-1.08),target=new T.Vector3();let desktop:Bean|undefined;
function castPointer(e:PointerEvent){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);}
function pick():Bean|undefined {const available=beans.filter(b=>b.state==='belt'||b.state==='air');const hits=ray.intersectObjects(available.map(b=>b.mesh));if(hits.length)return beans.find(b=>b.mesh===hits[0].object);let nearest:Bean|undefined,best=.065;for(const b of available){b.mesh.geometry.computeBoundingSphere();const center=b.mesh.geometry.boundingSphere!.center.clone();b.mesh.localToWorld(center);if(center.clone().sub(ray.ray.origin).dot(ray.ray.direction)<0)continue;const distance=ray.ray.distanceToPoint(center);if(distance<best){best=distance;nearest=b;}}return nearest;}
renderer.domElement.addEventListener('pointermove',e=>{castPointer(e);if(desktop&&shift.phase==='running'&&ray.ray.intersectPlane(plane,target)){desktop.mesh.position.copy(station.worldToLocal(target.clone()));}});
renderer.domElement.addEventListener('pointerdown',e=>{if(shift.phase!=='running'||renderer.xr.isPresenting)return;castPointer(e);if(desktop){desktop.state='air';desktop.velocity.set(0,0,0);desktop=undefined;}else{desktop=pick();if(desktop){desktop.state='held';desktop.mesh.position.y=1.08;if(desktop.critter)voice('grab');}}});
const controllers:T.XRGripSpace[]=[];const temp=new T.Vector3(),direction=new T.Vector3();
function drop(c:T.XRGripSpace,throwing=true){
 const b=c.userData.bean as Bean|undefined;if(!b)return;
 station.attach(b.mesh);b.state='air';b.velocity.copy(throwing?c.userData.motion.velocity():new T.Vector3());
 if(b.critter&&throwing&&b.velocity.length()>.4)voice('throw');
 b.spin.set(b.velocity.z*3, b.velocity.x*2, -b.velocity.y*2);c.userData.bean=undefined;c.userData.justReleased={bean:b,until:performance.now()+120};
}
function closestBean(point:T.Vector3){
 let result:Bean|undefined,best=.075;
 for(const b of beans){if(b.state!=='belt'&&b.state!=='air')continue;
 b.mesh.updateWorldMatrix(true,false);const vertices=b.mesh.geometry.attributes.position;
 for(let i=0;i<vertices.count;i+=3){const p=new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(b.mesh.matrixWorld);const dist=p.distanceTo(point);if(dist<best){best=dist;result=b;}}}
 return result;
}
for(let i=0;i<2;i++){
 const c=renderer.xr.getControllerGrip(i),input=renderer.xr.getController(i);scene.add(c,input);controllers.push(c);c.userData.input=input;
 c.userData.motion=new Motion();c.userData.buttons=new Set<string>();c.userData.previous=new T.Vector3();c.userData.valid=false;
 const glove=new T.Group();glove.quaternion.copy(gripOrientation(i?'right':'left'));c.add(glove);const contact=new T.Object3D();contact.position.set(0,-.018,-.02);glove.add(contact);c.userData.contact=contact;c.userData.glove=glove;
 const fabric=mat('#247ed1'),cuff=mat('#104681');
 box(0,0,0,.078,.034,.085,fabric,glove);box(0,0,.05,.085,.04,.025,cuff,glove);
 const fingers:T.Group[]=[];for(let f=0;f<4;f++){const finger=new T.Group();finger.position.set((f-1.5)*.019,0,-.034);box(0,0,-.026,.016,.025,.052,fabric,finger);glove.add(finger);fingers.push(finger);}
 const thumb=box(i?-.047:.047,-.008,-.01,.025,.03,.05,fabric,glove);c.userData.fingers=fingers;
 const press=(button:string)=>{c.userData.buttons.add(button);ensureAudio();if(shift.phase!=='running')return;
 c.updateWorldMatrix(true,false);const palm=(c.userData.contact as T.Object3D).getWorldPosition(new T.Vector3());const bean=closestBean(palm);
 if(bean&&!c.userData.bean){bean.state='held';c.attach(bean.mesh);c.userData.bean=bean;if(bean.critter)voice('grab');}};
 const release=(button:string)=>{c.userData.buttons.delete(button);if(c.userData.buttons.size===0)drop(c);};
 input.addEventListener('selectstart',()=>{
  input.getWorldPosition(temp);direction.set(0,0,-1).applyQuaternion(input.getWorldQuaternion(new T.Quaternion()));ray.set(temp,direction);
  const hit=ray.intersectObject(hud)[0];
  // Rays activate menu buttons only. Beans always require physical proximity.
  if(hit&& !closestBean((c.userData.contact as T.Object3D).getWorldPosition(new T.Vector3()))){
   if(shift.phase==='ready'||shift.phase==='failed'||shift.phase==='complete')start(hit.uv&&hit.uv.x>.5?'endless':'timed');else shift.toggle();return;}
  press('trigger');
 });
 input.addEventListener('selectend',()=>release('trigger'));input.addEventListener('squeezestart',()=>press('grip'));input.addEventListener('squeezeend',()=>release('grip'));
 c.addEventListener('connected',event=>{glove.quaternion.copy(gripOrientation(event.data.handedness==='right'?'right':'left'));thumb.position.x=event.data.handedness==='right'?-.047:.047;c.userData.tracked=true;c.userData.motion.clear();c.userData.valid=false;});
 c.addEventListener('disconnected',()=>{drop(c,false);c.userData.tracked=false;c.userData.valid=false;c.userData.buttons.clear();c.userData.motion.clear();});
}
function updateHands(time:number){for(const c of controllers){
 if(!c.userData.tracked||!c.visible){drop(c,false);c.userData.valid=false;c.userData.motion.clear();continue;}c.updateWorldMatrix(true,false);
 const palm=(c.userData.contact as T.Object3D).getWorldPosition(new T.Vector3()),motion=c.userData.motion as Motion;
 motion.record(palm,time);const previous=c.userData.previous as T.Vector3;
 for(const finger of c.userData.fingers)finger.rotation.x=fingerCurl(Boolean(c.userData.bean));
 if(shift.phase==='running'&&c.userData.valid&&!c.userData.bean){const velocity=motion.velocity();if(velocity.length()>.05){
 for(const b of beans){if(b.state!=='belt'&&b.state!=='air')continue;
 if(c.userData.justReleased?.bean===b&&performance.now()<c.userData.justReleased.until)continue;
 if(!b.mesh.geometry.boundingSphere)b.mesh.geometry.computeBoundingSphere();const center=b.mesh.localToWorld(b.mesh.geometry.boundingSphere!.center.clone());
 if(segmentDistance(center,previous,palm)<.065){b.velocity.copy(velocity).multiplyScalar(.8);b.state='air';b.mesh.position.addScaledVector(b.velocity,.015);b.mesh.position.y=Math.max(.97,b.mesh.position.y);b.spin.set(velocity.z,velocity.x,velocity.y);}
 }}}
 previous.copy(palm);c.userData.valid=true;
}}
document.querySelector('#endless')!.addEventListener('click',()=>start('endless'));
document.querySelector('#start')!.addEventListener('click',()=>start('timed'));document.querySelector('#pause')!.addEventListener('click',()=>shift.toggle());document.querySelector('#sound')!.addEventListener('click',e=>{muted=!muted;(e.target as HTMLElement).textContent=`Sound: ${muted?'off':'on'}`;});document.querySelector('#height')!.addEventListener('input',e=>{station.position.y=Number((e.target as HTMLInputElement).value);plane.constant=-(1.08+station.position.y);});
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.code==='KeyR')start();if(e.code==='KeyP'||e.code==='Escape')shift.toggle();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&shift.phase==='running')shift.toggle();});renderer.xr.addEventListener('sessionend',()=>{if(shift.phase==='running')shift.toggle();});
let machineGain:GainNode|undefined,characterGain:GainNode|undefined;
function voice(kind:Voice){if(muted||document.hidden||shift.phase==='paused'||!audio||!characterGain)return;voiceCounts[kind]=(voiceCounts[kind]??0)+1;playVoice(audio,characterGain,kind);}
function updateCritters(dt:number){if(shift.phase!=='running')return;for(const b of beans){if(!b.critter||b.state==='done')continue;const phase=shift.elapsed*12+b.mesh.userData.phase;
 for(const [i,leg] of b.mesh.userData.legs.entries())leg.rotation.x=Math.sin(phase+i*Math.PI)* (b.state==='held'?.9:.45);
 if(b.state==='belt'){b.mesh.position.x+=Math.sin(phase*.6)*.018*dt;b.mesh.position.z=T.MathUtils.clamp(b.mesh.position.z+Math.cos(phase*.25)*.025*dt,-1.0,-.44);}
 if(shift.elapsed>b.mesh.userData.nextVoice){voice('mouse');b.mesh.userData.nextVoice=shift.elapsed+(b.state==='held'?1.2:4+Math.random()*4);}
}}

function ensureAudio(){audio??=new AudioContext();void audio.resume();if(machineGain)return;characterGain=audio.createGain();characterGain.connect(audio.destination);machineGain=audio.createGain();machineGain.gain.value=0;machineGain.connect(audio.destination);
 const motor=audio.createOscillator();motor.type='triangle';motor.frequency.value=54;motor.connect(machineGain);motor.start();
 const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.2;
 const noise=audio.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=380;noise.connect(filter).connect(machineGain);noise.start();
}
let last=0,lastHud='';renderer.setAnimationLoop(time=>{const dt=Math.min((time-last)/1000,.04);last=time;shift.tick(dt);updateHands(time/1000);updateCritters(dt);supervisor.update(dt,shift.phase,shift.elapsed,shift.mistakes);if(characterGain&&audio)characterGain.gain.setTargetAtTime(!muted&&!document.hidden&&shift.phase!=='paused'?1:0,audio.currentTime,.025);if(machineGain&&audio)machineGain.gain.setTargetAtTime(!muted&&shift.phase==='running'?.018:0,audio.currentTime,.1);
 if(shift.phase==='running'){spawnTimer+=dt;if(spawnTimer>1.5-Math.min(shift.elapsed/120,.65)){spawnTimer=0;if(beans.filter(b=>b.state!=='done').length<60)spawn(Math.random()<.2+Math.min(shift.elapsed/300,.2),-1.3,-.92+Math.random()*.4,true);}
 for(const s of slats){s.position.x+=shift.speed*dt;if(s.position.x>1.4)s.position.x-=2.8;}
 const steps=Math.ceil(dt/.008);for(let step=0;step<steps;step++){const h=dt/steps;
 for(const b of beans){if(shift.phase!=='running')break;const p=b.mesh.position;
 if(b.state==='belt'){
 p.x+=(shift.speed+b.velocity.x)*h;p.z+=b.velocity.z*h;b.velocity.multiplyScalar(Math.exp(-5*h));
 if(p.x>1.48)finish(b,false);else if(p.x< -1.4||p.z< -1.04||p.z>-.4)b.state='air';
 }else if(b.state==='air'){
 const previous=p.clone();b.velocity.y-=9.8*h;p.addScaledVector(b.velocity,h);b.mesh.rotation.x+=b.spin.x*h;b.mesh.rotation.z+=b.spin.z*h;
 if(previous.y>=BIN.rim&&p.y<BIN.rim){const fraction=(previous.y-BIN.rim)/(previous.y-p.y);const crossing=previous.clone().lerp(p,fraction);if(insideBin(crossing.x,crossing.z)){finish(b,true);continue;}}
 if(previous.y>=.96&&p.y<=.96&&p.x>-1.4&&p.x<1.4&&p.z> -1.04&&p.z<-.4){p.y=.96;b.velocity.y=0;b.state='belt';b.spin.set(0,0,0);}
 else if(p.y<.1){finish(b,!b.bad);}
 }
 }}
 for(let i=beans.length-1;i>=0;i--)if(beans[i].state==='done'){removeItem(beans[i]);beans.splice(i,1);}}
 const status=`${shift.phase.toUpperCase()} · ${shift.score} pts · ${shift.mistakes}/5 mistakes · ${shift.mode==='endless'?'ENDLESS '+Math.floor(shift.elapsed)+'s':Math.max(0,90-Math.floor(shift.elapsed))+'s'}`;const detail=shift.phase==='failed'?'Shift ended. Five mistakes. R / Start to retry.':shift.phase==='complete'?'Shift complete. You voluntarily survived factory work.':shift.phase==='paused'?'Paused. P / panel trigger to resume.':feedback;
 document.querySelector('#stats')!.textContent=status;document.querySelector('#message')!.textContent=detail;
 const stamp=status+detail;if(stamp!==lastHud){lastHud=stamp;hudCtx.fillStyle='#173c35';hudCtx.fillRect(0,0,1024,384);hudCtx.fillStyle='#d8f58e';hudCtx.font='bold 40px sans-serif';hudCtx.fillText('BEAN THERE / QUALITY CONTROL',35,65);hudCtx.font='30px sans-serif';hudCtx.fillText(status,35,140);hudCtx.fillStyle='#ffffff';hudCtx.font='25px sans-serif';hudCtx.fillText(detail,35,215);hudCtx.fillText(shift.phase==='ready'||shift.phase==='failed'||shift.phase==='complete'?'LEFT: TIMED  /  RIGHT: ENDLESS':'TRIGGER HERE TO PAUSE / RESUME',35,310);hudTexture.needsUpdate=true;}
 renderer.render(scene,camera);
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// Read-only diagnostics used by local browser smoke tests.
Object.defineProperty(window,'beanThere',{get:()=>({phase:shift.phase,score:shift.score,mistakes:shift.mistakes,beans:beans.map(b=>({bad:b.bad,state:b.state,x:b.mesh.position.x,y:b.mesh.position.y,z:b.mesh.position.z,screen:b.mesh.getWorldPosition(new T.Vector3()).project(camera).toArray()})),voices:{...voiceCounts},supervisor:supervisor.mode,mode:shift.mode,speed:shift.speed,xr:renderer.xr.enabled})});

export { controllers, beans, station, shift, spawn, updateHands, updateCritters, supervisor };

