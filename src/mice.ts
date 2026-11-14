export const MOUSE_BOUNDS={minX:-1.29,maxX:1.29,minZ:-.96,maxZ:-.48};
// Match most belt drift with footwork; turn upstream before reaching the end.
// World-space scurrying stays catchable even when the conveyor is very fast.
export function beltMouseMotion(p:{x:number,z:number},target:{x:number,z:number}|undefined,phase:number,beltSpeed:number){
 const upstream=p.x>.75;
 const goal=upstream?{x:Math.min(target?.x??0,.45),z:target?.z??-.72}:target;
 const v=seekBean(p,goal,phase),boost=1+Math.min(.55,Math.max(0,beltSpeed-.1)*.6);
 const drift=upstream?0:Math.min(.05,beltSpeed*.15);
 return {x:v.x*boost-beltSpeed+drift,z:v.z*boost};
}
export function keepMouseOnBelt(p:{x:number,z:number}){
 p.x=Math.max(MOUSE_BOUNDS.minX,Math.min(MOUSE_BOUNDS.maxX,p.x));
 p.z=Math.max(MOUSE_BOUNDS.minZ,Math.min(MOUSE_BOUNDS.maxZ,p.z));
}
// Seek a real bean, then circle its edge so contact pushes it sideways as well.
export function seekBean(p:{x:number,z:number},target:{x:number,z:number}|undefined,phase:number){
 if(!target)return {x:0,z:0};
 const dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);
 if(d<.001)return {x:.12*Math.cos(phase),z:.12*Math.sin(phase)};
 const turn=d<.20?.55*Math.sin(phase):.12*Math.sin(phase),speed=.27;
 return {x:(dx/d-dz/d*turn)*speed,z:(dz/d+dx/d*turn)*speed};
}
