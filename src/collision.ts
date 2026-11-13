import * as T from 'three';
import {BIN} from './game';
export function sweptEllipsoid(a:T.Vector3,b:T.Vector3,center:T.Vector3,radii:T.Vector3){
 const start=a.clone().sub(center).divide(radii),end=b.clone().sub(center).divide(radii);
 return new T.Line3(start,end).closestPointToPoint(new T.Vector3(),true,new T.Vector3()).lengthSq()<=1;
}
export function assistBin(p:T.Vector3,v:T.Vector3,dt:number){
 // Noticeable near-bin guidance; no upward pull, teleport or automatic score.
 if(v.y>=0||p.y<BIN.rim-.08||p.y>BIN.rim+.6||Math.abs(p.x-BIN.x)>BIN.half+.2||Math.abs(p.z-BIN.z)>BIN.half+.2)return;
 const pull=new T.Vector3(BIN.x-p.x,0,BIN.z-p.z).multiplyScalar(5).clampLength(0,2);v.addScaledVector(pull,dt);
}
