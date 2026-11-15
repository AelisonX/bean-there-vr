export type Voice='mouse'|'grab'|'throw'|'grumble'|'lose'|'slap'|'punch'|'object'|'playerhit';
// Small synthesized voices, deliberately unintelligible; no recordings or speech service.
export function playVoice(ctx:AudioContext,output:AudioNode,kind:Voice) {
 if(kind==='playerhit'){playVoice(ctx,output,'punch');const t=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(430,t);osc.frequency.exponentialRampToValueAtTime(180,t+.28);gain.gain.setValueAtTime(.045,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.3);osc.connect(gain).connect(output);osc.start(t);osc.stop(t+.31);osc.onended=()=>{osc.disconnect();gain.disconnect();};return;}
 if(kind==='slap'||kind==='punch'||kind==='object'){
  const t=ctx.currentTime,duration=kind==='slap'?.13:.22;
  if(kind==='punch'){const thud=ctx.createOscillator(),envelope=ctx.createGain();thud.type='triangle';thud.frequency.setValueAtTime(210,t);thud.frequency.exponentialRampToValueAtTime(65,t+.18);envelope.gain.setValueAtTime(.24,t);envelope.gain.exponentialRampToValueAtTime(.0001,t+.23);thud.connect(envelope).connect(output);thud.start(t);thud.stop(t+.24);thud.onended=()=>{thud.disconnect();envelope.disconnect();};}
  const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/data.length*7);
  const noise=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();noise.buffer=buffer;filter.type='lowpass';filter.frequency.value=kind==='slap'?3500:kind==='punch'?1400:700;gain.gain.value=kind==='object'?.08:kind==='punch'?.22:.15;noise.connect(filter).connect(gain).connect(output);noise.start(t);noise.onended=()=>{noise.disconnect();filter.disconnect();gain.disconnect();};return;
 }
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
