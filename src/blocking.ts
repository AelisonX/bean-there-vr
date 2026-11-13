import * as T from 'three';
export const HAND_HIT_COOLDOWN=.5;
export function gloveBlocksPunch(from:T.Vector3,to:T.Vector3,gloves:T.Vector3[]){
 return gloves.some(glove=>new T.Line3(from,to).closestPointToPoint(glove,true,new T.Vector3()).distanceTo(glove)<.115);
}
