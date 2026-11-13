export type Strike='slap'|'punch';
export class Combat {
 hits=0;punches=0;pendingKo=false;time=0;lastHit=-100;combo=0;damage=0;fighting=false;ko=false;attackAt=Infinity;firstHit=0;attackFlying=false;impactAt=Infinity;
 reset(){this.hits=this.punches=0;this.pendingKo=false;this.time=0;this.lastHit=-100;this.combo=this.damage=0;this.fighting=this.ko=false;this.attackAt=Infinity;this.firstHit=0;this.attackFlying=false;this.impactAt=Infinity;}
 strike(kind:Strike,speed:number){
  if(this.ko||this.time-this.lastHit<.12)return false;
  if(this.time-this.lastHit>1.6)this.combo=0;
  this.combo++;this.lastHit=this.time;this.hits++;
  if(this.hits===1)return true;
  if(kind==='punch'){this.punches++;this.damage+=Math.min(5,1.5+Math.max(0,speed)*.75);}
  else this.damage+=Math.min(.7,Math.max(0,speed)*.15);
  if(this.hits===2){this.firstHit=this.time;this.attackAt=this.time+1.1;this.fighting=true;}
  if(kind==='punch'&&this.punches>=3&&this.damage>=12){if(this.fighting||this.attackFlying)this.pendingKo=true;else this.ko=true;}
  return true;
 }
 get windingUp(){return this.fighting&&!this.ko&&!this.attackFlying&&this.attackAt-this.time<.8;}
 get atImpact(){return this.attackFlying&&!this.ko&&this.time>=this.impactAt;}
 resolveCounter(hit:boolean){this.attackFlying=false;this.impactAt=Infinity;if(this.pendingKo){this.ko=true;this.pendingKo=false;this.fighting=false;return;}if(hit)this.fighting=false;else{this.firstHit=this.time;this.attackAt=this.time+2;}}
 advance(dt:number,inReach:boolean){this.time+=dt;if(!this.fighting||this.ko||this.attackFlying)return false;if(!inReach){this.attackAt=Math.max(this.attackAt,this.time+.8);return false;}if(this.time>=this.attackAt){this.attackFlying=true;this.impactAt=this.time+.45;return true;}return false;}
}
