export type Phase = 'ready' | 'running' | 'paused' | 'failed' | 'complete';
export class Shift {
  phase: Phase = 'ready'; score = 0; mistakes = 0; rejected = 0; collected = 0; elapsed = 0;
  mode: 'timed' | 'endless' = 'timed';
  start(mode: 'timed' | 'endless' = this.mode) { this.mode = mode; this.phase = 'running'; this.score = this.mistakes = this.rejected = this.collected = this.elapsed = 0; }
  toggle() { if (this.phase === 'running') this.phase = 'paused'; else if (this.phase === 'paused') this.phase = 'running'; }
  tick(dt: number) { if (this.phase === 'running') { this.elapsed += dt; if(this.mode === 'timed' && this.elapsed >= 90) this.phase = 'complete'; } }
  resolve(bad: boolean, bin: boolean) {
    if (this.phase !== 'running') return;
    if (bad && bin) { this.score += 20; this.rejected++; }
    else if (!bad && !bin) { this.score += 2; this.collected++; }
    else { this.score = Math.max(0, this.score - (bad ? 10 : 18)); this.mistakes++; }
    if (this.mistakes >= 5) this.phase = 'failed';
  }
  get speed() { return .065 + Math.min(this.rejected * .0015, .075); }
}
export function initialBatch() { return Array.from({length:25}, (_,i) => i % 5 === 2); }
export const BIN = {x:.9,z:.2,half:.31,rim:.68};
export function insideBin(x:number,z:number) { return Math.abs(x-BIN.x)<BIN.half && Math.abs(z-BIN.z)<BIN.half; }
