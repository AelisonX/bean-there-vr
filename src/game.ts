export type Phase = 'ready' | 'running' | 'paused' | 'failed' | 'complete';
export class Shift {
  fired=false;
  endReason: 'mistakes'|'supervisor'|null = null;
  phase: Phase = 'ready'; score = 0; mistakes = 0; rejected = 0; collected = 0; elapsed = 0;
  mode: 'timed' | 'endless' = 'timed';
  start(mode: 'timed' | 'endless' = this.mode) { this.fired=false;this.endReason=null;this.mode = mode; this.phase = 'running'; this.score = this.mistakes = this.rejected = this.collected = this.elapsed = 0; }
  markFired(){if(this.phase==='running')this.fired=true;}
  knockDown(){if(this.phase==='running'){this.endReason='supervisor';this.phase='failed';}}
  toggle() { if (this.phase === 'running') this.phase = 'paused'; else if (this.phase === 'paused') this.phase = 'running'; }
  tick(dt: number) { if (this.phase === 'running') { this.elapsed += dt; if(!this.fired&&this.mode === 'timed' && this.elapsed >= 180) this.phase = 'complete'; } }
  resolve(bad: boolean, bin: boolean) {
    if (this.phase !== 'running') return;
    if (bad && bin) { if(!this.fired)this.score += 20; this.rejected++; }
    else if (!bad && !bin) { if(!this.fired)this.score += 2; this.collected++; }
    else { if(!this.fired)this.score = Math.max(0, this.score - (bad ? 10 : 18)); this.mistakes++; }
    if (!this.fired&&this.mistakes >= this.mistakeLimit) {this.phase = 'failed';this.endReason='mistakes';}
  }
  get mistakeLimit(){return this.mode==='endless'?40:20;}
  get speed() {
    if(this.mode === 'endless') {
      // Deliberate five-minute pressure curve; human survival time needs playtesting.
      const progress=this.elapsed/300;const overtime=Math.max(0,this.elapsed-360)/60;
      return Math.min(2.4,.065+.48*progress**1.6+.12*overtime**1.7+Math.min(this.rejected*.0025,.12));
    }
    return .065+.045*(Math.min(this.elapsed/180,1))**1.5+Math.min(this.rejected*.0025,.105);
  }
}
export function initialBatch() { return Array.from({length:64}, (_,i) => i<30&&(i % 5 === 2||i===29)); }
export const MISTAKE_LIMIT=20;
export function initialPosition(bad:boolean,index:number){
 if(bad){const order=index===29?6:Math.floor(index/5);return order<3?{x:-.24+order*.23,z:-.49}:{x:-1.28-(order%2)*.08,z:-.52-(order-3)*.12};}
 if(index>=30)return {x:-1.24+(index-30)%9*.29,z:-1.0+Math.floor((index-30)/9)*.145};
 return {x:-1.22+(index%10)*.25,z:-.92+Math.floor(index/10)*.14};
}
export const BIN = {x:.95,z:.3,half:.385,rim:.68};
export function insideBin(x:number,z:number) { return Math.abs(x-BIN.x)<BIN.half && Math.abs(z-BIN.z)<BIN.half; }

export function flow(elapsed:number,mode:'timed'|'endless',coop:boolean,speed:number){
 const late=mode==='endless'?Math.min(1,elapsed/360):Math.min(1,elapsed/180);const overtime=mode==='endless'?Math.min(1,Math.max(0,elapsed-360)/240):0;
 const team=coop?1.5:1;const mid=Math.min(1,Math.max(0,elapsed-45)/105);
 return {beltFactor:team*.935,interval:Math.max(.28,(mode==='endless'?.95-.45*late-.2*overtime:.95-.25*late)-.09*mid)/team,
 badChance:Math.min(.90,(coop?.42:.34)+(mode==='endless'?.38:.12)*late+.10*overtime+.07*mid),greenInterval:Math.max(.13,.42/(1+speed*3))/team};
}
