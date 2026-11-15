type Point={x:number,y:number,z:number};
// Low, invisible side rails. Conveyor ends and throws above the rail stay open.
export function collideBeltSides(p:Point,previous:Point,v:Point,radius=.018){
 for(const [edge,sign] of [[-1.04+radius,-1],[-.4-radius,1]]){
  if((p.z-edge)*sign<=0)continue;
  const penetration=(previous.z-edge)*sign;
  if(penetration>.14)continue;
  const t=penetration>0?0:(edge-previous.z)/(p.z-previous.z),x=previous.x+(p.x-previous.x)*t,y=previous.y+(p.y-previous.y)*t;
  if(Math.abs(x)>1.4||y<.91-radius||y>1.065+radius)continue;
  p.z=edge;if(v.z*sign>0)v.z*=-.18;
 }
}
