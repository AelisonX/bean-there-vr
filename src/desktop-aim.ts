import * as T from 'three';
export function desktopHandTarget(ray:T.Ray,head:T.Vector3,viewDirection:T.Vector3,encounter:boolean,holding:boolean,bossPoint?:T.Vector3,shoulder?:T.Vector3){
 if(encounter&&!holding){
  if(bossPoint)return bossPoint.clone().addScaledVector(ray.direction,-.06);
  const torso=head.clone().add(new T.Vector3(0,-.35,0));
  if(ray.distanceToPoint(head)<.30||ray.distanceToPoint(torso)<.43){
   const normal=viewDirection.clone().normalize(),guard=head.clone();
   const p=ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(normal,guard),new T.Vector3());
   if(p){p.y=T.MathUtils.clamp(p.y,head.y-.52,head.y+.22);if(shoulder)p.lerp(shoulder,.25);return p;}
  }
 }
 return ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-1.08),new T.Vector3());
}
