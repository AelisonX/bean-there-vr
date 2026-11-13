import * as T from 'three';
import {BIN} from './game';
export function sweptEllipsoid(a:T.Vector3,b:T.Vector3,center:T.Vector3,radii:T.Vector3){
 const start=a.clone().sub(center).divide(radii),end=b.clone().sub(center).divide(radii);
 return new T.Line3(start,end).closestPointToPoint(new T.Vector3(),true,new T.Vector3()).lengthSq()<=1;
}
export function assistBin(p:T.Vector3,v:T.Vector3,dt:number){
 // A small near-rim correction only: no lift, range grab or guaranteed score.
 if(v.y>=0||p.y<BIN.rim||p.y>BIN.rim+.4||Math.abs(p.x-BIN.x)>BIN.half+.1||Math.abs(p.z-BIN.z)>BIN.half+.1)return;
 const pull=new T.Vector3(BIN.x-p.x,0,BIN.z-p.z).multiplyScalar(.6).clampLength(0,.22);v.addScaledVector(pull,dt);
}
