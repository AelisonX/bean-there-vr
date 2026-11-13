import * as T from 'three';
import type {Phase} from './game';
import {sweptEllipsoid} from './collision';
const cube=new T.BoxGeometry(1,1,1),sphere=new T.SphereGeometry(1,12,8);
const material=(color:T.ColorRepresentation)=>new T.MeshStandardMaterial({color,roughness:.85});
function part(parent:T.Object3D,geo:T.BufferGeometry,m:T.Material,p:number[],scale:number[]){const mesh=new T.Mesh(geo,m);mesh.position.fromArray(p);mesh.scale.fromArray(scale);parent.add(mesh);return mesh;}
function block(parent:T.Object3D,m:T.Material,p:number[],scale:number[]){return part(parent,cube,m,p,scale);}
export const PARTNER_BAY={minX:-.7,maxX:.7,minZ:-2.25,maxZ:-1.25};
export function buildFactory(scene:T.Scene){
 const group=new T.Group();group.name='factory-dressing';scene.add(group);
 const teal=material('#3e6d65'),silver=material('#b3c4bd'),cream=material('#d7dbbc'),amber=material('#e8b64f'),blue=material('#719fa8');
 block(group,teal,[0,.6,-4.92],[14,1.2,.04]);
 for(let x=-6;x<=6;x+=1.2){block(group,silver,[x,2,-4.88],[.025,3.8,.02]);}
 for(let x=-4.8;x<=4.8;x+=2.4){block(group,teal,[x,2.55,-4.84],[1.85,1.08,.07]);block(group,blue,[x,2.55,-4.78],[1.65,.9,.03]);block(group,cream,[x,2.55,-4.74],[.045,.9,.04]);}
 for(let z=-4;z<=4;z+=2){block(group,silver,[-4,2.1,z],[.12,4.2,.12]);block(group,teal,[-4,3.3,z],[.22,.22,2]);}
 for(const x of [-3.2,3.2]){block(group,silver,[x,3.1,-2],[.1,.1,6]);block(group,amber,[x,2.94,-2],[.04,.04,6]);}
 // Dressing stays clear of both working bays; opposite bay is reserved for co-op later.
 for(const x of [-.65,.65])for(let z=-2.2;z< -1.25;z+=.22)block(group,amber,[x,.008,z],[.025,.012,.13]);
 for(const z of [-2.25,-1.25])block(group,amber,[0,.008,z],[1.3,.012,.025]);
 for(const x of [-.65,.65])for(let z=.15;z<.8;z+=.22)block(group,cream,[x,.008,z],[.025,.012,.13]);
 // Simple storage shelves and produce crates, well outside arm reach.
 for(const x of [-3,3]){for(const h of [.25,1.05,1.85]){
  block(group,silver,[x,h,-3.7],[1.4,.06,.65]);
  for(const dx of [-.37,.37]){block(group,teal,[x+dx,h+.2,-3.7],[.59,.34,.48]);for(let r=0;r<3;r++)block(group,cream,[x+dx,h+.14+r*.065,-3.45],[.46,.018,.015]);}
 }for(const dx of [-.7,.7])block(group,silver,[x+dx,1.1,-3.7],[.06,2.2,.65]);}
 const c=document.createElement('canvas');c.width=768;c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle='#193f38';ctx.fillRect(0,0,768,256);ctx.fillStyle='#dae7b3';ctx.font='bold 40px sans-serif';ctx.textAlign='center';ctx.fillText('STATION 02 / CO-OP',384,110);ctx.font='28px sans-serif';ctx.fillText('TWO SIDES. SAME VERY NORMAL JOB.',384,168);
 const sign=new T.Mesh(new T.PlaneGeometry(1.8,.6),new T.MeshBasicMaterial({map:new T.CanvasTexture(c)}));sign.position.set(0,1.2,-4.7);group.add(sign);
 // Static repeated boxes share a handful of instanced draws on Quest.
 const batches=new Map<T.Material,T.Mesh[]>();
 for(const child of [...group.children])if(child instanceof T.Mesh&&child.geometry===cube){const m=child.material as T.Material;const list=batches.get(m)??[];list.push(child);batches.set(m,list);}
 for(const [m,meshes] of batches){const batch=new T.InstancedMesh(cube,m,meshes.length);meshes.forEach((mesh,i)=>{mesh.updateMatrix();batch.setMatrixAt(i,mesh.matrix);group.remove(mesh);});batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();group.add(batch);}
 const opposite=group.clone(true);opposite.rotation.y=Math.PI;opposite.position.z=-1.44;opposite.name='factory-opposite';scene.add(opposite);return group;
}
export class Supervisor {
 root=new T.Group();left=new T.Group();right=new T.Group();head=new T.Group();jaw:T.Mesh;
 reaction:'object'|'slap'|'punch'|null=null;reactionTime=0;
 knockedOut=false;koAge=0;koPosition=new T.Vector3();
 focusSeat=0;
 counterTarget:T.Vector3|undefined;counterAge=1;previousMatrix=new T.Matrix4();previousZones:T.Sphere[]=[];
 mode:'idle'|'approach'|'angry'|'retreat'|'lose'|'ko'='idle'; age=0; timer=0;lastVisit=0;lastMistakes=0;lastPhase:Phase='ready'; voiceTimer=0;
 constructor(scene:T.Scene,private speak:(lose:boolean)=>void){
  this.root.name='supervisor';scene.add(this.root);this.root.position.set(-1.95,0,-.72);
  const skin=material('#dab38c'),vest=material('#e9902e'),shirt=material('#e5d9b5'),pants=material('#344c4b'),dark=material('#263a36'),white=material('#f0efda');
  part(this.root,sphere,vest,[0,.96,0],[.36,.44,.25]);block(this.root,shirt,[0,1.05,.235],[.12,.5,.04]);for(const x of [-.2,.2])block(this.root,white,[x,1.04,.23],[.035,.55,.025]);
  for(const x of [-.14,.14]){block(this.root,pants,[x,.4,0],[.2,.64,.2]);block(this.root,dark,[x,.1,.065],[.22,.16,.34]);}
  this.head.position.set(0,1.52,0);this.root.add(this.head);part(this.head,sphere,skin,[0,0,0],[.23,.26,.215]);
  part(this.head,sphere,skin,[0,-.04,.21],[.06,.07,.055]);
  for(const x of [-.075,.075]){block(this.head,dark,[x,.015,.206],[.035,.035,.025]);const brow=block(this.head,dark,[x,.077,.196],[.095,.025,.03]);brow.rotation.z=x>0?.28:-.28;part(this.head,sphere,skin,[Math.sign(x)*.23,-.015,0],[.04,.065,.04]);}
  this.jaw=part(this.head,sphere,dark,[0,-.11,.195],[.06,.015,.016]);
  for(const [arm,side] of [[this.left,-1],[this.right,1]] as const){arm.position.set(side*.35,1.24,0);this.root.add(arm);block(arm,shirt,[side*.04,-.15,0],[.15,.31,.16]);part(arm,sphere,skin,[side*.04,-.35,0],[.085,.1,.08]);}
  const clipboard=block(this.left,material('#815d3c'),[-.04,-.32,.14],[.26,.35,.035]);clipboard.rotation.x=-.2;block(clipboard,white,[0,0,.025],[.21,.28,.01]);block(clipboard,dark,[0,.16,.035],[.09,.03,.018]);for(let i=0;i<4;i++)block(clipboard,dark,[0,.07-i*.04,.035],[.14,.008,.005]);
 }
 private zones(){this.root.updateWorldMatrix(true,true);const result:T.Sphere[]=[];for(const arm of [this.left,this.right])for(const y of [-.08,-.22,-.35])result.push(new T.Sphere(arm.localToWorld(new T.Vector3(arm===this.left?-.04:.04,y,0)),.12));return result;}
 private capturePose(){this.root.updateWorldMatrix(true,true);this.previousMatrix.copy(this.root.matrixWorld);this.previousZones=this.zones();}
 hit(a:T.Vector3,b:T.Vector3,radius=.03){
  if(this.knockedOut)return false;const center=this.root.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,1,0));if(new T.Line3(a,b).closestPointToPoint(center,true,new T.Vector3()).distanceTo(center)>1.8+radius)return false;this.root.updateWorldMatrix(true,true);
  for(const matrix of [this.root.matrixWorld,this.previousMatrix]){const inverse=matrix.clone().invert(),start=a.clone().applyMatrix4(inverse),end=b.clone().applyMatrix4(inverse);
   if(sweptEllipsoid(start,end,new T.Vector3(0,1,0),new T.Vector3(.4+radius,.52+radius,.3+radius))||sweptEllipsoid(start,end,new T.Vector3(0,1.52,0),new T.Vector3(.26+radius,.29+radius,.25+radius)))return true;}
  const zones=this.zones();for(let i=0;i<zones.length;i++){const old=this.previousZones[i]?.center??zones[i].center;const start=a.clone().sub(old),end=b.clone().sub(zones[i].center);if(new T.Line3(start,end).closestPointToPoint(new T.Vector3(),true,new T.Vector3()).length()<zones[i].radius+radius)return true;}return false;
 }
 react(kind:'object'|'slap'|'punch'){if(this.knockedOut)return;this.reaction=kind;this.reactionTime=kind==='object'?1:.6;this.mode=kind==='object'?'approach':'angry';this.timer=0;}
 knockOut(){this.knockedOut=true;this.koAge=0;this.koPosition.copy(this.root.position);this.mode='ko';}
 counterAttack(target:T.Vector3){this.counterTarget=target.clone();this.counterAge=0;this.counterPose();}
 private counterPose(){if(!this.counterTarget||this.counterAge>.9){this.right.scale.y=1;return;}this.root.updateWorldMatrix(true,false);const local=this.root.worldToLocal(this.counterTarget.clone()).sub(this.right.position);this.right.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),local.clone().normalize());this.right.scale.y=1+Math.max(0,Math.min(3,local.length()/.35)-1)*Math.sin(Math.min(1,this.counterAge/.9)*Math.PI);}
 reset(){this.counterTarget=undefined;this.counterAge=1;this.right.scale.y=1;this.knockedOut=false;this.koAge=0;this.reaction=null;this.reactionTime=0;this.mode='idle';this.age=this.timer=this.lastVisit=this.lastMistakes=this.voiceTimer=0;this.lastPhase='ready';this.root.position.set(-1.95,0,-.72);this.root.rotation.set(0,0,0);this.head.rotation.set(0,0,0);this.left.rotation.set(0,0,0);this.right.rotation.set(0,0,0);this.jaw.scale.y=.015;this.capturePose();}
 update(dt:number,phase:Phase,elapsed:number,mistakes:number){
  if(phase==='paused'||phase==='ready'||phase==='complete')return;this.capturePose();
  if(this.knockedOut){this.koAge+=dt;const fall=T.MathUtils.smoothstep(this.koAge,0,.85);this.root.position.copy(this.koPosition);this.root.position.y=.23*fall;this.root.rotation.z=-Math.PI/2*fall;this.root.rotation.x=0;this.left.rotation.x=this.right.rotation.x=-1;return;}
  this.counterAge+=dt;this.reactionTime=Math.max(0,this.reactionTime-dt);this.age+=dt;this.timer+=dt;this.voiceTimer-=dt;
  if(phase==='failed'&&this.lastPhase!=='failed'){this.mode='lose';this.timer=0;this.speak(true);this.voiceTimer=4;}
  if(phase==='running'&&this.mode==='idle'&&(elapsed-this.lastVisit>35||mistakes>this.lastMistakes||elapsed>12&&this.lastVisit===0)){this.mode='approach';this.timer=0;this.lastVisit=elapsed;}
  this.lastMistakes=mistakes;this.lastPhase=phase;
  const visiting=this.mode==='approach'||this.mode==='angry'||this.mode==='lose';
  const roundEnd=(this.mode==='approach'&&this.timer<1.4)||(this.mode==='retreat'&&this.timer<1.4);
  const targetX=visiting?(roundEnd?-1.85:-.9):-1.95,targetZ=visiting?(this.focusSeat===1?-1.56:.12):roundEnd?(this.focusSeat===1?-1.56:.12):-.72;
  this.root.position.x=T.MathUtils.damp(this.root.position.x,targetX,2,dt);this.root.position.z=T.MathUtils.damp(this.root.position.z,targetZ,2,dt);
  if(this.mode==='approach'&&this.timer>3){this.mode='angry';this.timer=0;}
  if(this.mode==='angry'&&this.timer>5){this.mode='retreat';this.timer=0;}
  if(this.mode==='retreat'&&this.timer>3){this.mode='idle';this.timer=0;}
  const angry=this.mode==='angry'||this.mode==='lose';const wave=angry?Math.sin(this.age*10):0;
  this.root.position.y=angry?Math.abs(Math.sin(this.age*6))*.025:visiting?Math.abs(Math.sin(this.age*8))*.015:0;
  this.root.rotation.y=Math.atan2(-this.root.position.x,(this.focusSeat===1?-1.44:0)-this.root.position.z);this.root.rotation.x=0;this.head.rotation.z=angry?wave*.08:0;
  this.right.rotation.z=angry?-.95+wave*.5:-.1;this.right.rotation.x=angry?-.7+Math.cos(this.age*9)*.5:0;
  this.left.rotation.x=angry?-.8+wave*.2:-.4;this.left.rotation.z=angry?.35+wave*.12:.12;
  this.jaw.scale.y=angry?.025+Math.abs(wave)*.04:.015;
  if(this.reactionTime>0){const amount=Math.min(this.reactionTime,1);if(this.reaction==='slap'){this.head.rotation.z=.55*amount;this.right.rotation.x=-1.8;}else if(this.reaction==='punch'){this.root.rotation.x=-.22*amount;this.head.rotation.x=-.3*amount;this.left.rotation.x=this.right.rotation.x=-1.5;}else{this.root.rotation.x=-.16*amount;this.head.rotation.x=-.35*amount;this.head.rotation.z=.22*amount;this.right.rotation.z=-1.4;this.left.rotation.x=-1.1;}}else this.head.rotation.x=0;
  if(angry&&this.voiceTimer<=0){this.speak(this.mode==='lose');this.voiceTimer=this.mode==='lose'?5:3;}
  this.counterPose();
 }
}
