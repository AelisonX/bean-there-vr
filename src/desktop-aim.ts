import * as T from 'three';
export function desktopHandTarget(ray:T.Ray,head:T.Vector3,viewDirection:T.Vector3,encounter:boolean,holding:boolean,bossPoint?:T.Vector3,shoulder?:T.Vector3,sorting=false){
 if(encounter&&!holding&&!sorting){
  if(bossPoint&&bossPoint.y>head.y-.65)return bossPoint.clone().addScaledVector(ray.direction,-.06);
  if(shoulder){
   const normal=viewDirection.clone().normalize(),guard=head.clone();
   const p=ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(normal,guard),new T.Vector3());
   const side=shoulder.clone().sub(head);side.y=0;side.normalize();
   const toward=p?p.clone().sub(head).dot(side):0;
   const edge=p&&toward>.08&&toward<.4&&p.y>head.y-.52&&p.y<head.y+.22&&p.clone().sub(head).setY(0).length()<.43;
   const corridor=[.25,.5,.75].some(t=>ray.distanceToPoint(head.clone().lerp(shoulder,t))<.14);
   if(p&&(edge||corridor)){p.y=T.MathUtils.clamp(p.y,head.y-.52,head.y+.22);p.lerp(shoulder,.25);return p;}
  }
 }
 return ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-1.08),new T.Vector3());
}
