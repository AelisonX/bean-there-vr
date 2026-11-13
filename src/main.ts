import * as T from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { Shift, initialBatch, insideBin, BIN, initialPosition, MISTAKE_LIMIT } from './game';
import './style.css';
import {HandLoad,type Button} from './holding';
import {assistBin} from './collision';
import {menuButtons,menuActionAt} from './menu';
import {pointingGlovePosition,fingerCurl,BEAN_SCALE} from './gloves';
import {buildFactory,Supervisor} from './factory';
import {playVoice,type Voice} from './voices';
import { Motion, segmentDistance } from './interaction';

document.querySelector('#app')!.innerHTML = `<header><small>AELIS’ØN / FACTORY 01 · v0.4</small><h1>BEAN THERE <span style="color:#d8f58e">VR</span></h1><p>A very normal job. Now in three dimensions.</p></header><section class="panel"><div id="stats"></div><p id="message"></p><div id="menu"><div id="modes"><button id="start">Start shift</button><button id="endless">Endless shift</button><button id="options-button" class="secondary">Options</button></div><div id="options" hidden><button id="sound">Sound: on</button><button id="assist">Bin assist: on</button><br><label>Station height <input id="height" aria-label="Station height" type="range" min="-0.4" max="0.3" step="0.05" value="0"></label><br><button id="back">Back to modes</button></div><button id="resume" hidden>Resume shift</button></div><button id="pause" class="secondary">Pause</button><button id="menu-button" class="secondary">Main menu</button><div class="help">VR · Reach to pick. Trigger: one bean. Grip: another bean. Both together: one mouse, release either to let go. A / X: pause menu.<br>Open hands push. Throw produce into the white bin. Hitting the supervisor with your hand gets you fired.<br>DESKTOP · Click to grab/drop · P pauses · R restarts.</div></section>`;
let menuPage:'main'|'options'='main',binAssist=true;
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
bin(BIN.x,BIN.z,BIN.half*2+.05,BIN.half*2+.05,white); bin(1.73,-.72,.48,.78,green);
// Canvas signs remain readable inside the headset as well as on desktop.
function sign(text:string,x:number,y:number,z:number,w:number,color='#e7f4bf') {const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#173c35';ctx.fillRect(0,0,768,256);ctx.fillStyle=color;ctx.font='bold 52px sans-serif';ctx.textAlign='center';ctx.fillText(text,384,144);const mesh=new T.Mesh(new T.PlaneGeometry(w,w/3),new T.MeshBasicMaterial({map:new T.CanvasTexture(c)}));mesh.position.set(x,y,z);station.add(mesh);return mesh;}
sign('REJECT ↓',BIN.x,.5,.74,.6);sign('KEEP →',1.72,.82,-1.15,.53);sign('QUALITY CONTROL / 01',0,3.1,-4.7,2.3);
const hudCanvas=document.createElement('canvas');hudCanvas.width=1024;hudCanvas.height=640;const hudCtx=hudCanvas.getContext('2d')!;const hudTexture=new T.CanvasTexture(hudCanvas);const hud=new T.Mesh(new T.PlaneGeometry(1.6,1),new T.MeshBasicMaterial({map:hudTexture}));hud.position.set(0,2.12,-2.5);station.add(hud);
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
 if(critter){mesh.userData.phase=Math.random()*Math.PI*2;mesh.userData.nextVoice=shift.elapsed+3+Math.random()*5;mesh.userData.legs=[];for(const side of [-1,1])for(const end of [-1,1]){const leg=new T.Group();leg.position.set(end*.026,-.02,side*.025);mesh.add(leg);box(0,-.01,side*.012,.018,.018,.025,pink,leg);mesh.userData.legs.push(leg);}mesh.scale.set(1.3,.8,.85);for(const side of [-1,1]){const ear=new T.Mesh(critterEar,pink);ear.position.set(-.025,.04,side*.028);mesh.add(ear);const e=new T.Mesh(new T.SphereGeometry(.006,6,4),eye);e.position.set(-.04,.016,side*.03);mesh.add(e);}const tail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([new T.Vector3(.03,0,0),new T.Vector3(.08,.005,.03),new T.Vector3(.12,0,.01)]),8,.004,4,false),pink);mesh.add(tail);}
 else {mesh.scale.set(.75+Math.random()*.5,.8+Math.random()*.5,.8+Math.random()*.4);if(bad&&variant===0)mesh.scale.x*=.58;mesh.scale.multiplyScalar(BEAN_SCALE);}
 mesh.position.set(x,.96,z);mesh.rotation.y=Math.random()*Math.PI;station.add(mesh);beans.push({mesh,bad,critter,state:'belt',velocity:new T.Vector3(),spin:new T.Vector3()});
}
function removeItem(b:Bean){station.remove(b.mesh);for(const child of b.mesh.children){if(child instanceof T.Mesh && child.geometry!==critterEar&&child.geometry!==cubeGeo)child.geometry.dispose();}}
function releaseAll(){desktop=undefined;for(const c of controllers){const load=c.userData.load as HandLoad<Bean>;for(const b of load.clear())station.attach(b.mesh);c.userData.justReleased.clear();c.userData.motion.clear();c.userData.valid=false;}}
function start(mode:'timed'|'endless'=shift.mode){releaseAll();for(const b of beans)removeItem(b);beans.length=0;shift.start(mode);supervisor.reset();ensureAudio();spawnIndex=0;spawnTimer=0;initialBatch().forEach((bad,i)=>{const p=initialPosition(bad,i);spawn(bad,p.x,p.z);});menuPage='main';feedback='Shift started. Brown, yellow or tightly curled? Bin it.';tone(true);}
function finish(b:Bean,bin:boolean){if(b.state==='done')return;shift.resolve(b.bad,bin);b.state='done';b.mesh.visible=false;feedback=bin?(b.bad?'Reject removed. +20':'That was good produce. −18'):(b.bad?'Defect escaped. −10':'Good bean collected. +2');if(bin||b.bad)tone(b.bad===bin);}
const ray=new T.Raycaster(),pointer=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),-1.08),target=new T.Vector3();let desktop:Bean|undefined;
function castPointer(e:PointerEvent){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);}
function pick():Bean|undefined {const available=beans.filter(b=>b.state==='belt'||b.state==='air');const hits=ray.intersectObjects(available.map(b=>b.mesh));if(hits.length)return beans.find(b=>b.mesh===hits[0].object);let nearest:Bean|undefined,best=.065;for(const b of available){b.mesh.geometry.computeBoundingSphere();const center=b.mesh.geometry.boundingSphere!.center.clone();b.mesh.localToWorld(center);if(center.clone().sub(ray.ray.origin).dot(ray.ray.direction)<0)continue;const distance=ray.ray.distanceToPoint(center);if(distance<best){best=distance;nearest=b;}}return nearest;}
renderer.domElement.addEventListener('pointermove',e=>{castPointer(e);if(desktop&&shift.phase==='running'&&ray.ray.intersectPlane(plane,target)){desktop.mesh.position.copy(station.worldToLocal(target.clone()));}});
renderer.domElement.addEventListener('pointerdown',e=>{if(shift.phase!=='running'||renderer.xr.isPresenting)return;castPointer(e);if(desktop){desktop.state='air';desktop.velocity.set(0,0,0);desktop=undefined;}else{desktop=pick();if(desktop){desktop.state='held';desktop.mesh.position.y=1.08;if(desktop.critter)voice('grab');}}});
const controllers:T.XRGripSpace[]=[];const temp=new T.Vector3(),direction=new T.Vector3();
function dropItem(c:T.XRGripSpace,b:Bean,throwing=true){
 station.attach(b.mesh);b.state='air';b.velocity.copy(throwing?c.userData.motion.velocity():new T.Vector3());
 if(b.critter&&throwing&&b.velocity.length()>.4)voice('throw');
 b.spin.set(b.velocity.z*3,b.velocity.x*2,-b.velocity.y*2);c.userData.justReleased.set(b,performance.now()+120);
}
function dropAll(c:T.XRGripSpace){const load=c.userData.load as HandLoad<Bean>;for(const b of load.clear())dropItem(c,b,false);}
function closestBean(point:T.Vector3,mouse?:boolean){
 let result:Bean|undefined,best=.075;
 for(const b of beans){if(b.state!=='belt'&&b.state!=='air'||mouse!==undefined&&b.critter!==mouse)continue;
 b.mesh.updateWorldMatrix(true,false);const vertices=b.mesh.geometry.attributes.position;
 for(let i=0;i<vertices.count;i+=3){const p=new T.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(b.mesh.matrixWorld);const dist=p.distanceTo(point);if(dist<best){best=dist;result=b;}}}
 return result;
}
for(let i=0;i<2;i++){
 const c=renderer.xr.getControllerGrip(i),input=renderer.xr.getController(i);scene.add(c,input);controllers.push(c);c.userData.input=input;
 c.userData.load=new HandLoad<Bean>();c.userData.motion=new Motion();c.userData.previous=new T.Vector3();c.userData.valid=false;c.userData.justReleased=new Map<Bean,number>();
 const glove=new T.Group();glove.position.copy(pointingGlovePosition(i?'right':'left'));input.add(glove);const contact=new T.Object3D();contact.position.set(0,-.018,-.02);glove.add(contact);c.userData.contact=contact;c.userData.glove=glove;
 const fabric=mat('#247ed1'),cuff=mat('#104681');box(0,0,0,.078,.034,.085,fabric,glove);box(0,0,.05,.085,.04,.025,cuff,glove);
 const fingers:T.Group[]=[];for(let f=0;f<4;f++){const finger=new T.Group();finger.position.set((f-1.5)*.019,0,-.034);box(0,0,-.026,.016,.025,.052,fabric,finger);glove.add(finger);fingers.push(finger);}
 const thumb=box(i?-.047:.047,-.008,-.01,.025,.03,.05,fabric,glove);c.userData.fingers=fingers;c.userData.index=i?0:3;
 const laser=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0,0,-.065),new T.Vector3(0,0,-4)]),new T.LineBasicMaterial({color:'#b5e9ff',transparent:true,opacity:.6}));input.add(laser);c.userData.laser=laser;
 const cursor=new T.Mesh(new T.SphereGeometry(.012,8,6),new T.MeshBasicMaterial({color:'#d8f58e'}));scene.add(cursor);c.userData.cursor=cursor;
 const press=(button:Button)=>{if(shift.phase!=='running')return;ensureAudio();const palm=contact.getWorldPosition(new T.Vector3());const load=c.userData.load as HandLoad<Bean>;
  const nearbyMouse=closestBean(palm,true);const bean=load.press(button,mouse=>mouse?nearbyMouse:nearbyMouse&&load.items.length===0?undefined:closestBean(palm,false));if(bean){bean.state='held';c.attach(bean.mesh);if(bean.critter)voice('grab');}
 };
 const release=(button:Button)=>{const b=(c.userData.load as HandLoad<Bean>).release(button);if(b)dropItem(c,b);};
 input.addEventListener('selectstart',()=>{if(shift.phase!=='running'){
  input.getWorldPosition(temp);direction.set(0,0,-1).applyQuaternion(input.getWorldQuaternion(new T.Quaternion()));ray.set(temp,direction);const hit=ray.intersectObject(hud)[0];if(hit?.uv)menuAction(menuActionAt(menuButtons(menuPage,shift.phase==='paused',!muted,binAssist),hit.uv.x,hit.uv.y));return;}
  press('trigger');});
 input.addEventListener('selectend',()=>release('trigger'));input.addEventListener('squeezestart',()=>press('grip'));input.addEventListener('squeezeend',()=>release('grip'));
 c.addEventListener('connected',event=>{const right=event.data.handedness==='right';glove.position.copy(pointingGlovePosition(right?'right':'left'));thumb.position.x=right?-.047:.047;c.userData.index=right?0:3;c.userData.source=event.data;c.userData.tracked=true;c.userData.motion.clear();c.userData.valid=false;});
 c.addEventListener('disconnected',()=>{dropAll(c);c.userData.tracked=false;c.userData.valid=false;c.userData.motion.clear();cursor.visible=laser.visible=false;});
}
function updateHands(time:number){for(const c of controllers){
 const load=c.userData.load as HandLoad<Bean>,input=c.userData.input as T.XRTargetRaySpace;
 c.userData.laser.visible=shift.phase!=='running'&&input.visible&&c.userData.tracked;c.userData.cursor.visible=false;
 if(!c.userData.tracked||!c.visible){dropAll(c);c.userData.valid=false;c.userData.motion.clear();continue;}c.updateWorldMatrix(true,false);input.updateWorldMatrix(true,false);
 const menuPressed=Boolean(c.userData.source?.gamepad?.buttons[4]?.pressed);if(menuPressed&&!c.userData.menuPressed){shift.toggle();menuPage='main';}c.userData.menuPressed=menuPressed;
 if(shift.phase!=='running'){input.getWorldPosition(temp);direction.set(0,0,-1).applyQuaternion(input.getWorldQuaternion(new T.Quaternion()));ray.set(temp,direction);const hit=ray.intersectObject(hud)[0];if(hit){c.userData.cursor.position.copy(hit.point);c.userData.cursor.visible=true;}}
 const palm=(c.userData.contact as T.Object3D).getWorldPosition(new T.Vector3()),motion=c.userData.motion as Motion;motion.record(palm,time);const previous=c.userData.previous as T.Vector3;
 c.userData.fingers.forEach((finger:T.Group,index:number)=>finger.rotation.x=fingerCurl(shift.phase==='running'&&load.buttons.has(index===c.userData.index?'trigger':'grip')));
 if(shift.phase==='running'&&c.userData.valid){const velocity=motion.velocity();
  if(velocity.length()>.8&&supervisor.hit(previous,palm,.045)){
   const kind=load.buttons.size?'punch':'slap';supervisor.react(kind);voice(kind);shift.fire(kind);feedback=kind==='punch'?'FIRED — you punched the supervisor.':'FIRED — you slapped the supervisor.';
  }else if(velocity.length()>.05&&load.items.length===0){for(const b of beans){if(b.state!=='belt'&&b.state!=='air')continue;
   if(performance.now()<(c.userData.justReleased.get(b)??0))continue;
   if(!b.mesh.geometry.boundingSphere)b.mesh.geometry.computeBoundingSphere();const center=b.mesh.localToWorld(b.mesh.geometry.boundingSphere!.center.clone());
   if(segmentDistance(center,previous,palm)<.065){b.velocity.copy(velocity).multiplyScalar(.8);b.state='air';b.mesh.position.addScaledVector(b.velocity,.015);b.mesh.position.y=Math.max(.97,b.mesh.position.y);b.spin.set(velocity.z,velocity.x,velocity.y);}
  }}
 }
 for(const [b,until] of c.userData.justReleased)if(until<performance.now())c.userData.justReleased.delete(b);
 previous.copy(palm);c.userData.valid=true;
}}
function setHeight(value:number){station.position.y=T.MathUtils.clamp(value,-.4,.3);plane.constant=-(1.08+station.position.y);(document.querySelector('#height') as HTMLInputElement).value=String(station.position.y);}
function menuAction(action:string|undefined){switch(action){case 'timed':start('timed');break;case 'endless':start('endless');break;case 'resume':if(shift.phase==='paused')shift.toggle();break;case 'options':menuPage='options';break;case 'back':menuPage='main';break;case 'sound':muted=!muted;break;case 'assist':binAssist=!binAssist;break;case 'lower':setHeight(station.position.y-.05);break;case 'raise':setHeight(station.position.y+.05);break;}}
document.querySelector('#endless')!.addEventListener('click',()=>start('endless'));
document.querySelector('#start')!.addEventListener('click',()=>start('timed'));document.querySelector('#pause')!.addEventListener('click',()=>shift.toggle());
for(const [id,action] of [['sound','sound'],['assist','assist'],['options-button','options'],['back','back'],['resume','resume']])document.querySelector('#'+id)!.addEventListener('click',()=>menuAction(action));
document.querySelector('#menu-button')!.addEventListener('click',()=>{if(shift.phase==='running')shift.toggle();menuPage='main';});document.querySelector('#height')!.addEventListener('input',e=>setHeight(Number((e.target as HTMLInputElement).value)));
window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if(e.code==='KeyR')start();if(e.code==='KeyP'||e.code==='Escape')shift.toggle();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&shift.phase==='running')shift.toggle();});renderer.xr.addEventListener('sessionend',()=>{if(shift.phase==='running')shift.toggle();});
let machineGain:GainNode|undefined,characterGain:GainNode|undefined;
function voice(kind:Voice){if(muted||document.hidden||shift.phase==='paused'||!audio||!characterGain)return;voiceCounts[kind]=(voiceCounts[kind]??0)+1;playVoice(audio,characterGain,kind);}
function updateCritters(dt:number){if(shift.phase!=='running')return;for(const b of beans){if(!b.critter||b.state==='done')continue;const phase=shift.elapsed*7+b.mesh.userData.phase;
 for(const [i,leg] of b.mesh.userData.legs.entries())leg.rotation.x=Math.sin(phase+i*Math.PI)* (b.state==='held'?.25:.13);
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
 const previous=p.clone();if(binAssist)assistBin(p,b.velocity,h);b.velocity.y-=9.8*h;p.addScaledVector(b.velocity,h);b.mesh.rotation.x+=b.spin.x*h;b.mesh.rotation.z+=b.spin.z*h;
 if(b.velocity.length()>.3&&supervisor.hit(station.localToWorld(previous.clone()),station.localToWorld(p.clone()),.025)){supervisor.react('object');voice('object');finish(b,!b.bad);feedback='Supervisor hit. One normal sorting mistake.';continue;}
 if(previous.y>=BIN.rim&&p.y<BIN.rim){const fraction=(previous.y-BIN.rim)/(previous.y-p.y);const crossing=previous.clone().lerp(p,fraction);if(insideBin(crossing.x,crossing.z)){finish(b,true);continue;}}
 if(previous.y>=.96&&p.y<=.96&&p.x>-1.4&&p.x<1.4&&p.z> -1.04&&p.z<-.4){p.y=.96;b.velocity.y=0;b.state='belt';b.spin.set(0,0,0);}
 else if(p.y<.1){finish(b,!b.bad);}
 }
 }}
 for(let i=beans.length-1;i>=0;i--)if(beans[i].state==='done'){removeItem(beans[i]);beans.splice(i,1);}}
 const status=`${shift.phase.toUpperCase()} · ${shift.score} pts · ${shift.mistakes}/${MISTAKE_LIMIT} mistakes · ${shift.mode==='endless'?'ENDLESS '+Math.floor(shift.elapsed)+'s':Math.max(0,90-Math.floor(shift.elapsed))+'s'}`;const detail=shift.phase==='failed'?(shift.endReason==='slap'?'FIRED — you slapped the supervisor.':shift.endReason==='punch'?'FIRED — you punched the supervisor.':'Shift ended. Ten mistakes. Choose a mode to retry.'):shift.phase==='complete'?'Shift complete. You voluntarily survived factory work.':shift.phase==='paused'?'Paused. Resume from menu, P, or A / X.':feedback;
 document.querySelector('#stats')!.textContent=status;document.querySelector('#message')!.textContent=detail;
 const active=shift.phase==='running';(document.querySelector('#menu') as HTMLElement).hidden=active;(document.querySelector('#modes') as HTMLElement).hidden=menuPage!=='main';(document.querySelector('#options') as HTMLElement).hidden=menuPage!=='options';(document.querySelector('#resume') as HTMLElement).hidden=shift.phase!=='paused';document.querySelector('#sound')!.textContent=muted?'Sound: off':'Sound: on';document.querySelector('#assist')!.textContent=binAssist?'Bin assist: on':'Bin assist: off';
 const stamp=status+detail+menuPage+muted+binAssist+station.position.y;if(stamp!==lastHud){lastHud=stamp;hudCtx.fillStyle='#173c35';hudCtx.fillRect(0,0,1024,640);hudCtx.fillStyle='#d8f58e';hudCtx.font='bold 40px sans-serif';hudCtx.fillText(active?'BEAN THERE / QUALITY CONTROL':menuPage==='options'?'OPTIONS':'BEAN THERE / MAIN MENU',32,65);hudCtx.font='28px sans-serif';hudCtx.fillText(status,32,125);hudCtx.fillStyle='#ffffff';hudCtx.font='24px sans-serif';hudCtx.fillText(detail,32,185);
 if(!active){for(const b of menuButtons(menuPage,shift.phase==='paused',!muted,binAssist)){hudCtx.fillStyle='#31574b';hudCtx.fillRect(b.x,b.y,b.w,b.h);hudCtx.fillStyle='#e1f7ad';hudCtx.font='bold 28px sans-serif';hudCtx.fillText(b.label,b.x+18,b.y+48);}hudCtx.font='24px sans-serif';hudCtx.fillStyle='#ffffff';hudCtx.fillText(menuPage==='options'?'Station height: '+station.position.y.toFixed(2)+' m':'Trigger: bean / Grip: bean / BOTH: one mouse',32,560);hudCtx.fillText('A / X button: pause menu. Ten mistakes ends a shift.',32,605);}else{hudCtx.fillText('Trigger: one bean. Grip: another. BOTH: one mouse.',32,300);hudCtx.fillText('A / X: pause menu. White bin on your right.',32,370);}hudTexture.needsUpdate=true;}
 renderer.render(scene,camera);
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
// Read-only diagnostics used by local browser smoke tests.
Object.defineProperty(window,'beanThere',{get:()=>({phase:shift.phase,score:shift.score,mistakes:shift.mistakes,beans:beans.map(b=>({bad:b.bad,state:b.state,x:b.mesh.position.x,y:b.mesh.position.y,z:b.mesh.position.z,screen:b.mesh.getWorldPosition(new T.Vector3()).project(camera).toArray()})),limit:MISTAKE_LIMIT,endReason:shift.endReason,menu:menuPage,assist:binAssist,voices:{...voiceCounts},supervisor:supervisor.mode,mode:shift.mode,speed:shift.speed,xr:renderer.xr.enabled})});

export { controllers, beans, station, shift, spawn, updateHands, updateCritters, supervisor, menuAction, hud };
