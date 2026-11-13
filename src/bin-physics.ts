import * as T from 'three';import {BIN,insideBin} from './game';
const edge=BIN.half+.025,top=.665;
export const BIN_SOLIDS=[
 new T.Box3(new T.Vector3(BIN.x-edge-.025,.18,BIN.z-edge),new T.Vector3(BIN.x-edge+.025,.64,BIN.z+edge)),
 new T.Box3(new T.Vector3(BIN.x+edge-.025,.18,BIN.z-edge),new T.Vector3(BIN.x+edge+.025,.64,BIN.z+edge)),
 new T.Box3(new T.Vector3(BIN.x-edge,.18,BIN.z-edge-.025),new T.Vector3(BIN.x+edge,.64,BIN.z-edge+.025)),
 new T.Box3(new T.Vector3(BIN.x-edge,.18,BIN.z+edge-.025),new T.Vector3(BIN.x+edge,.64,BIN.z+edge+.025)),
 new T.Box3(new T.Vector3(BIN.x-edge,.06,BIN.z-edge),new T.Vector3(BIN.x+edge,.18,BIN.z+edge))
];
export const BIN_RIMS=[
 new T.Line3(new T.Vector3(BIN.x-edge,top,BIN.z-edge),new T.Vector3(BIN.x+edge,top,BIN.z-edge)),
 new T.Line3(new T.Vector3(BIN.x-edge,top,BIN.z+edge),new T.Vector3(BIN.x+edge,top,BIN.z+edge)),
 new T.Line3(new T.Vector3(BIN.x-edge,top,BIN.z-edge),new T.Vector3(BIN.x-edge,top,BIN.z+edge)),
 new T.Line3(new T.Vector3(BIN.x+edge,top,BIN.z-edge),new T.Vector3(BIN.x+edge,top,BIN.z+edge))
];
export function buildPhysicalBin(parent:T.Object3D,material:T.Material){
 for(const b of BIN_SOLIDS){const m=new T.Mesh(new T.BoxGeometry(...b.getSize(new T.Vector3()).toArray() as [number,number,number]),material);m.position.copy(b.getCenter(new T.Vector3()));parent.add(m);}
 const rimMaterial=new T.MeshStandardMaterial({color:'#d5e4d0',roughness:.5});
 for(const line of BIN_RIMS){const m=new T.Mesh(new T.CapsuleGeometry(.025,line.distance(),4,8),rimMaterial);m.position.copy(line.getCenter(new T.Vector3()));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),line.delta(new T.Vector3()).normalize());parent.add(m);}
 return rimMaterial;
}
function sphereBox(point:T.Vector3,radius:number,box:T.Box3){
 const nearest=box.clampPoint(point,new T.Vector3()),delta=point.clone().sub(nearest),distance=delta.length();if(distance>=radius)return;
 if(distance>.00001)return {normal:delta.divideScalar(distance),depth:radius-distance};
 let depth=Infinity,normal=new T.Vector3();for(const axis of ['x','y','z'] as const)for(const side of [-1,1]){const d=side<0?point[axis]-box.min[axis]:box.max[axis]-point[axis];if(d<depth){depth=d;normal.set(0,0,0);normal[axis]=side;}}return {normal,depth:radius+depth};
}
export function sweepSphereBox(a:T.Vector3,b:T.Vector3,radius:number,box:T.Box3){
 const expanded=box.clone().expandByScalar(radius),delta=b.clone().sub(a);if(expanded.containsPoint(a))return;
 let enter=0,exit=1,normal=new T.Vector3();for(const axis of ['x','y','z'] as const){if(Math.abs(delta[axis])<1e-10){if(a[axis]<expanded.min[axis]||a[axis]>expanded.max[axis])return;continue;}
 let near=(expanded.min[axis]-a[axis])/delta[axis],far=(expanded.max[axis]-a[axis])/delta[axis],side=-1;if(near>far){[near,far]=[far,near];side=1;}if(near>enter){enter=near;normal.set(0,0,0);normal[axis]=side;}exit=Math.min(exit,far);if(enter>exit)return;}
 if(enter>=0&&enter<=1&&normal.lengthSq()>0)return {point:a.clone().lerp(b,enter),normal};
}
export type BinBody={position:T.Vector3,previousPosition?:T.Vector3,quaternion:T.Quaternion,previousQuaternion?:T.Quaternion,scale:T.Vector3,velocity:T.Vector3,spin:T.Vector3,points:T.Vector3[],radius:number};
export function collideBin(body:BinBody,dt:number){
 const old=body.previousPosition??body.position;
 for(const [axis,min,max] of [['x',BIN.x-.75,BIN.x+.75],['y',-.2,1.0],['z',BIN.z-.75,BIN.z+.75]] as const)if(body.position[axis]<min&&old[axis]<min||body.position[axis]>max&&old[axis]>max)return 0;
 let impacts=0;for(let pass=0;pass<2;pass++)for(const local of body.points){let point=local.clone().multiply(body.scale).applyQuaternion(body.quaternion).add(body.position);
  const resolve=(normal:T.Vector3,depth:number,bounce:number)=>{body.position.addScaledVector(normal,depth+.0001);point.addScaledVector(normal,depth+.0001);const vn=body.velocity.dot(normal);if(vn<0){const impulse=normal.clone().multiplyScalar(-(1+bounce)*vn);body.velocity.add(impulse);const lever=point.clone().sub(body.position);body.spin.add(lever.cross(impulse).multiplyScalar(28)).clampLength(0,18);const tangent=body.velocity.clone().addScaledVector(normal,-body.velocity.dot(normal));body.velocity.addScaledVector(tangent,-Math.min(.22,dt*8));if(vn<-.2)impacts++;}};
  if(pass===0&&body.previousPosition){const old=local.clone().multiply(body.scale).applyQuaternion(body.previousQuaternion??body.quaternion).add(body.previousPosition);for(const box of BIN_SOLIDS){const swept=sweepSphereBox(old,point,body.radius,box);if(swept){const correction=swept.point.clone().sub(point);body.position.add(correction);point.copy(swept.point);resolve(swept.normal,.0001,.24);}}}
  for(const line of BIN_RIMS){const nearest=line.closestPointToPoint(point,true,new T.Vector3()),delta=point.clone().sub(nearest),distance=delta.length(),sum=body.radius+.025;if(distance<sum){resolve(distance>.00001?delta.divideScalar(distance):new T.Vector3(0,1,0),sum-distance,.46);}}
  for(const box of BIN_SOLIDS){const hit=sphereBox(point,body.radius,box);if(hit)resolve(hit.normal,hit.depth,.24);}
 }
 // Interior containment is a final guard after multi-point correction. Below the
 // rim a body cannot cross a closed side, even if rotation pushes a sample out.
 if(body.previousPosition&&insideBin(body.previousPosition.x,body.previousPosition.z)&&body.position.y>.18&&body.position.y<.63){for(const axis of ['x','z'] as const){const center=axis==='x'?BIN.x:BIN.z,bound=BIN.half-body.radius;if(Math.abs(body.position[axis]-center)>bound){const side=Math.sign(body.position[axis]-center);body.position[axis]=center+side*bound;if(body.velocity[axis]*side>0)body.velocity[axis]*=-.24;impacts++;}}}
 return impacts;
}
export function capturedInBin(p:T.Vector3,v=new T.Vector3()){return p.y<.32&&p.y>.16&&Math.abs(v.y)<1.3&&insideBin(p.x,p.z);}
