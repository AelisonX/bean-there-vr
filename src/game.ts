export type Phase = 'ready' | 'running' | 'paused' | 'failed' | 'complete';
export class Shift {
  endReason: 'mistakes'|'slap'|'punch'|null = null;
  phase: Phase = 'ready'; score = 0; mistakes = 0; rejected = 0; collected = 0; elapsed = 0;
  mode: 'timed' | 'endless' = 'timed';
  start(mode: 'timed' | 'endless' = this.mode) { this.endReason=null;this.mode = mode; this.phase = 'running'; this.score = this.mistakes = this.rejected = this.collected = this.elapsed = 0; }
  fire(kind:'slap'|'punch'){if(this.phase==='running'){this.endReason=kind;this.phase='failed';}}
  toggle() { if (this.phase === 'running') this.phase = 'paused'; else if (this.phase === 'paused') this.phase = 'running'; }
  tick(dt: number) { if (this.phase === 'running') { this.elapsed += dt; if(this.mode === 'timed' && this.elapsed >= 90) this.phase = 'complete'; } }
  resolve(bad: boolean, bin: boolean) {
    if (this.phase !== 'running') return;
    if (bad && bin) { this.score += 20; this.rejected++; }
    else if (!bad && !bin) { this.score += 2; this.collected++; }
    else { this.score = Math.max(0, this.score - (bad ? 10 : 18)); this.mistakes++; }
    if (this.mistakes >= MISTAKE_LIMIT) {this.phase = 'failed';this.endReason='mistakes';}
  }
  get speed() {
    if(this.mode === 'endless') {
      // Deliberate five-minute pressure curve; human survival time needs playtesting.
      const progress=Math.min(this.elapsed/300,1);
      return Math.min(.65,.065+.48*progress**1.35+Math.min(this.rejected*.0015,.06));
    }
    return .065 + Math.min(this.rejected * .0015, .075);
  }
}
export function initialBatch() { return Array.from({length:25}, (_,i) => i % 5 === 2); }
export const MISTAKE_LIMIT=10;
export function initialPosition(bad:boolean,index:number){
 if(bad){const order=Math.floor(index/5);return order<3?{x:-.24+order*.23,z:-.49}:{x:-1.28,z:-.62-(order-3)*.17};}
 return {x:-1.22+(index%9)*.28,z:-.92+Math.floor(index/9)*.19};
}
export const BIN = {x:.95,z:.3,half:.385,rim:.68};
export function insideBin(x:number,z:number) { return Math.abs(x-BIN.x)<BIN.half && Math.abs(z-BIN.z)<BIN.half; }
