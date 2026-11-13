export const MOUSE_BOUNDS={minX:-1.29,maxX:1.29,minZ:-.96,maxZ:-.48};
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
