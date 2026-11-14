export type PeerPacket=Record<string,any>;
/** Reliable actions and a separate lossy channel for replaceable world/pose frames. */
export class PeerLink {
 pc:RTCPeerConnection;control?:RTCDataChannel;state?:RTCDataChannel;ready=false;closed=false;
 onPacket:(p:PeerPacket)=>void=()=>{};onReady:()=>void=()=>{};onLost:()=>void=()=>{};
 private candidates:RTCIceCandidateInit[]=[];private next=0;private frames=new Map<number,{parts:string[],count:number,at:number}>();
 constructor(host:boolean,iceServers:RTCIceServer[],private signal:(data:any)=>void){
  this.pc=new RTCPeerConnection({iceServers,iceTransportPolicy:new URLSearchParams(location.search).get('relay')==='1'?'relay':'all'});
  this.pc.onicecandidate=e=>{if(e.candidate&&!this.closed)this.signal({candidate:e.candidate.toJSON()});};
  this.pc.ondatachannel=e=>this.bind(e.channel);
  this.pc.onconnectionstatechange=()=>{if(['failed','closed'].includes(this.pc.connectionState)&&!this.closed)this.onLost();};
  if(host){this.bind(this.pc.createDataChannel('actions',{ordered:true}));this.bind(this.pc.createDataChannel('frames',{ordered:false,maxRetransmits:0}));}
 }
 private bind(channel:RTCDataChannel){if(!['actions','frames'].includes(channel.label)){channel.close();return;}if(channel.label==='actions')this.control=channel;else this.state=channel;
  channel.onopen=()=>{if(this.control?.readyState==='open'&&this.state?.readyState==='open'&&!this.ready){this.ready=true;this.onReady();}};
  channel.onclose=()=>{if(!this.closed){this.ready=false;this.onLost();}};
  channel.onmessage=e=>{if(typeof e.data!=='string'||e.data.length>65536)return;try{const p=JSON.parse(e.data);if(channel.label==='actions'){if(p.type!=='chunk')this.onPacket(p);return;}if(p.type!=='chunk')return;
   const {id,n,i,data}=p;if(!Number.isInteger(id)||!Number.isInteger(n)||n<1||n>12||!Number.isInteger(i)||i<0||i>=n||typeof data!=='string'||data.length>12000)return;
   const now=performance.now();for(const [key,f]of this.frames)if(now-f.at>1000)this.frames.delete(key);let f=this.frames.get(id);if(!f){if(this.frames.size>=8)this.frames.delete(this.frames.keys().next().value!);f={parts:[],count:n,at:now};this.frames.set(id,f);}if(f.count!==n)return;f.parts[i]=data;if(f.parts.filter(x=>typeof x==='string').length===n){this.frames.delete(id);this.onPacket(JSON.parse(f.parts.join('')));}
  }catch{/* Malformed or incomplete frames never affect game state. */}};
 }
 async offer(){await this.pc.setLocalDescription(await this.pc.createOffer());if(!this.closed)this.signal({description:this.pc.localDescription?.toJSON()});}
 async accept(data:any){if(this.closed)return;if(data.description){await this.pc.setRemoteDescription(data.description);for(const c of this.candidates)await this.pc.addIceCandidate(c);this.candidates=[];if(data.description.type==='offer'){await this.pc.setLocalDescription(await this.pc.createAnswer());if(!this.closed)this.signal({description:this.pc.localDescription?.toJSON()});}}else if(data.candidate){if(this.pc.remoteDescription)await this.pc.addIceCandidate(data.candidate);else this.candidates.push(data.candidate);}}
 send(packet:PeerPacket,replaceable=false){if(!this.ready)return false;const json=JSON.stringify(packet);if(json.length>120000)return false;
  try{if(!replaceable){if(this.control!.bufferedAmount>262144){this.onLost();return false;}this.control!.send(json);return true;}
   if(this.state!.bufferedAmount>49152)return false;const id=++this.next,n=Math.ceil(json.length/12000);for(let i=0;i<n;i++)this.state!.send(JSON.stringify({type:'chunk',id,n,i,data:json.slice(i*12000,(i+1)*12000)}));return true;
  }catch{this.onLost();return false;}
 }
 async route(){const stats=new Map<string,any>();(await this.pc.getStats()).forEach((s:any)=>stats.set(s.id,s));let pair:any;stats.forEach((s:any)=>{if(s.type==='transport'&&s.selectedCandidatePairId)pair=stats.get(s.selectedCandidatePairId);});if(!pair)stats.forEach((s:any)=>{if(s.type==='candidate-pair'&&s.state==='succeeded'&&s.nominated)pair=s;});if(!pair)return {kind:'connecting',rttMs:null};const local:any=stats.get(pair.localCandidateId),remote:any=stats.get(pair.remoteCandidateId);return {kind:local?.candidateType==='relay'||remote?.candidateType==='relay'?'relay':'direct',rttMs:typeof pair.currentRoundTripTime==='number'?Math.round(pair.currentRoundTripTime*1000):null};}
 close(){this.closed=true;this.ready=false;this.control?.close();this.state?.close();this.pc.close();this.frames.clear();}
}
