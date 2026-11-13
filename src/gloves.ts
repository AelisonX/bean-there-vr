import * as T from 'three';
export function fingerCurl(held:boolean){return held?-1.15:0;}
export const BEAN_SCALE=.72;
// In v0.4 the visible hand follows target-ray space: the straight index lies on its -Z ray.
export function pointingGlovePosition(hand:'left'|'right') {return new T.Vector3(hand==='right'?.0285:-.0285,0,.04);}
