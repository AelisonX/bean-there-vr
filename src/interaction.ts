import * as T from 'three';
export class Motion {
  samples:{p:T.Vector3,t:number}[]=[];
  record(p:T.Vector3,t:number) {
    this.samples.push({p:p.clone(),t});
    while(this.samples.length>2 && this.samples[0].t<t-.09)this.samples.shift();
  }
  velocity() {
    const a=this.samples[0],b=this.samples.at(-1);
    if(!a||!b||b.t-a.t<.008)return new T.Vector3();
    const v=b.p.clone().sub(a.p).divideScalar(b.t-a.t);
    return v.clampLength(0,6);
  }
  clear(){this.samples.length=0;}
}
export function segmentDistance(p:T.Vector3,a:T.Vector3,b:T.Vector3) {
  return new T.Line3(a,b).closestPointToPoint(p,true,new T.Vector3()).distanceTo(p);
}
