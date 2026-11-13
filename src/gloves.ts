import * as T from 'three';
// Glove model: +Y is the back of the hand, +Z runs towards the wrist.
// WebXR grip: +/-X is the hand back, +Y runs towards the arm, -Z towards thumb.
export function gripOrientation(hand:'left'|'right') {
  const side=hand==='right'?1:-1;
  return new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(
    new T.Vector3(0,0,side),new T.Vector3(side,0,0),new T.Vector3(0,1,0)));
}
export function fingerCurl(held:boolean){return held?-1.15:0;}
export const BEAN_SCALE=.72;
