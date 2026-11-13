import * as T from 'three';
export function fingerCurl(held:boolean){return held?-1.15:0;}
export const BEAN_SCALE=.72;
// In v0.4 the visible hand follows target-ray space: the straight index lies on its -Z ray.
export function pointingGlovePosition(hand:'left'|'right') {return new T.Vector3(hand==='right'?.0285:-.0285,0,.04);}
export const GLOVE_TILT=-Math.PI/24;
export function configureGlove(glove:T.Object3D,hand:'left'|'right'){
 const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),GLOVE_TILT).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),hand==='right'?-Math.PI/2:Math.PI/2));
 glove.quaternion.copy(q);glove.position.copy(pointingGlovePosition(hand)).applyQuaternion(q);
}
export function menuDirection(input:T.Object3D){return new T.Vector3(0,0,-1).applyAxisAngle(new T.Vector3(1,0,0),GLOVE_TILT).applyQuaternion(input.getWorldQuaternion(new T.Quaternion()));}
