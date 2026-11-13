export type Strike='slap'|'punch';
export class Combat {
 time=0;lastHit=-100;combo=0;damage=0;fighting=false;ko=false;attackAt=Infinity;firstHit=0;
 reset(){this.time=0;this.lastHit=-100;this.combo=this.damage=0;this.fighting=this.ko=false;this.attackAt=Infinity;this.firstHit=0;}
 strike(kind:Strike,speed:number){
  if(this.ko||this.time-this.lastHit<.12)return false;
  if(this.time-this.lastHit>1.6){this.combo=0;this.damage=0;}
  this.combo++;this.lastHit=this.time;this.damage+=kind==='punch'?Math.min(6,1.5+speed*.9):Math.min(2,.5+speed*.3);
  if(!this.fighting){this.firstHit=this.time;this.attackAt=this.time+1.6;}
  this.fighting=true;this.attackAt=Math.min(this.firstHit+4,Math.max(this.attackAt,this.time+.65));
  // Slaps can stagger and build a combo, but only a punch can finish it.
  if(kind==='punch'&&(speed>=4.5||this.damage>=7)){this.ko=true;this.fighting=false;}
  return true;
 }
 get windingUp(){return this.fighting&&!this.ko&&this.attackAt-this.time<.45;}
 advance(dt:number,inReach:boolean){this.time+=dt;if(!this.fighting||this.ko)return false;if(!inReach){this.attackAt=Math.max(this.attackAt,this.time+.45);return false;}if(this.time>=this.attackAt){this.fighting=false;return true;}return false;}
}
