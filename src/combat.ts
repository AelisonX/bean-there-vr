export type Strike='slap'|'punch';
export class Combat {
 hits=0;time=0;lastHit=-100;combo=0;damage=0;fighting=false;ko=false;attackAt=Infinity;firstHit=0;attackFlying=false;impactAt=Infinity;
 reset(){this.hits=0;this.time=0;this.lastHit=-100;this.combo=this.damage=0;this.fighting=this.ko=false;this.attackAt=Infinity;this.firstHit=0;this.attackFlying=false;this.impactAt=Infinity;}
 strike(kind:Strike,speed:number){
  if(this.ko||this.time-this.lastHit<.12)return false;
  if(this.time-this.lastHit>1.6){this.combo=0;this.damage=0;}
  this.combo++;this.lastHit=this.time;this.damage+=kind==='punch'?Math.min(6,1.5+speed*.9):Math.min(2,.5+speed*.3);
  this.hits++;
  if(this.hits===2){this.firstHit=this.time;this.attackAt=this.time+1.1;this.fighting=true;}
  // Slaps can stagger and build a combo, but only a punch can finish it.
  if(kind==='punch'&&(speed>=4.5||this.damage>=7)){this.ko=true;this.fighting=false;this.attackFlying=false;}
  return true;
 }
 get windingUp(){return this.fighting&&!this.ko&&!this.attackFlying&&this.attackAt-this.time<.8;}
 get atImpact(){return this.attackFlying&&!this.ko&&this.time>=this.impactAt;}
 resolveCounter(hit:boolean){this.attackFlying=false;this.impactAt=Infinity;if(hit)this.fighting=false;else{this.firstHit=this.time;this.attackAt=this.time+2;}}
 advance(dt:number,inReach:boolean){this.time+=dt;if(!this.fighting||this.ko||this.attackFlying)return false;if(!inReach){this.attackAt=Math.max(this.attackAt,this.time+.8);return false;}if(this.time>=this.attackAt){this.attackFlying=true;this.impactAt=this.time+.45;return true;}return false;}
}
