export type Voice='mouse'|'grab'|'throw'|'grumble'|'lose';
// Small synthesized voices, deliberately unintelligible; no recordings or speech service.
export function playVoice(ctx:AudioContext,output:AudioNode,kind:Voice) {
 const mouse=kind==='mouse'||kind==='grab'||kind==='throw';
 const count=kind==='lose'?8:kind==='grumble'?5:kind==='throw'?3:2;
 for(let i=0;i<count;i++){
  const t=ctx.currentTime+i*(mouse?.07:.12),duration=mouse?.14:.14+Math.random()*.06;
  const osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();
  osc.type=mouse?'sine':'sawtooth';const base=mouse?(kind==='throw'?1700:kind==='grab'?2200:1200):75+Math.random()*55;
  osc.frequency.setValueAtTime(base*(1+Math.random()*.2),t);osc.frequency.exponentialRampToValueAtTime(mouse?base*.55:base*1.4,t+duration);
  filter.type='lowpass';filter.frequency.value=mouse?4200:480;
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(mouse?.025:.035,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  osc.connect(filter).connect(gain).connect(output);osc.start(t);osc.stop(t+duration+.01);
  osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();};
 }
}
