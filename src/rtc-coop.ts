import {PeerLink,type PeerPacket} from './peer-link';
import {PeerWorld,validPose} from './peer-world';
import type {Pose} from './coop';
export class Coop {
 socket:WebSocket|undefined;slot=-1;name='';count=0;running=false;epoch=0;peer:Pose|undefined;state:any;
 peerReady=false;route='connecting';rttMs:number|null=null;link?:PeerLink;pair=-1;
 pending=new Map<number,{resolve:(x:any)=>void,reject:(x:Error)=>void}>();serial=0;
 onPacket:(m:any)=>void=()=>{};onRoom:()=>void=()=>{};onNotice:(s:string)=>void=()=>{};
 private iceServers:RTCIceServer[]=[];private statsTimer?:ReturnType<typeof setInterval>;private connectTimer?:ReturnType<typeof setTimeout>;
 private localPose?:Pose;private sent=new Map<string,number>();private received=new Map<string,number>();
 private world=new PeerWorld(p=>{this.deliver(p);this.link?.send({...p,epoch:this.epoch},p.type==='move');});
 get joined(){return this.slot>=0;}get host(){return this.slot===0;}get info(){return {joined:this.joined,host:this.host,count:this.count,ready:this.peerReady};}
 private wsSend(type:string,data:Record<string,unknown>={}){if(this.socket?.readyState===WebSocket.OPEN)this.socket.send(JSON.stringify({type,...data}));}
 private deliver(p:PeerPacket){if(p.type==='move'&&p.slot===this.slot)return;if(p.type==='pose'){this.peer=p.pose;}if(p.type==='snapshot')this.state=p.state;this.onPacket(p);}
 send(type:string,data:Record<string,unknown>={}){
  if(!this.peerReady)return;const key=type==='move'?`move:${data.id}`:type;const seq=(this.sent.get(key)??0)+1;this.sent.set(key,seq);const p={type,...data,...(type==='action'?{pose:this.localPose}:{}),epoch:this.epoch,seq};
  if(type==='pose'){if(!validPose(data.pose))return;this.localPose=data.pose;if(this.host)this.world.pose(0,data.pose);this.link!.send(p,true);return;}
  if(type==='snapshot'){if(this.host){const state=this.world.snapshot(data.state);if(state)this.link!.send({...p,state},true);}return;}
  if(['move','release','action'].includes(type)){if(this.host){if(type==='action')this.world.action(0,p);else this.world.motion(0,p);}else this.link!.send(p,type==='move');return;}
  if(type==='control'&&['pause','resume'].includes(String(data.action))){this.deliver({...p,slot:this.slot});this.link!.send(p);}
 }
 async connect(url:string){const parsed=new URL(url);if(!['ws:','wss:'].includes(parsed.protocol)||location.protocol==='https:'&&parsed.protocol!=='wss:')throw Error('Use a secure wss:// room service for an HTTPS game.');if(this.socket?.readyState===WebSocket.OPEN){if(this.socket.url===parsed.href)return;if(this.joined)throw Error('Leave this room before changing room services.');this.socket.onclose=null;this.socket.close();}
  await new Promise<void>((resolve,reject)=>{const ws=new WebSocket(url);this.socket=ws;const timer=setTimeout(()=>{ws.onclose=null;ws.close();reject(Error('Room service is waking up or unavailable. Wait a minute and retry.'));},20000);
   ws.onopen=()=>{clearTimeout(timer);resolve();};ws.onerror=()=>{clearTimeout(timer);reject(Error('Could not reach the room service.'));};
   ws.onclose=()=>{clearTimeout(timer);if(this.socket!==ws)return;this.socket=undefined;reject(Error('Room service disconnected.'));if(this.peerReady){this.onNotice('Room service disconnected. Your existing browser connection can continue.');return;}this.reset();this.onRoom();};
   ws.onmessage=e=>{let m:any;try{m=JSON.parse(e.data);}catch{return;}if(m.type==='reply'){this.reply(m);return;}if(m.type==='roster'){if(this.peerReady&&m.count<2){this.onNotice('Room service unavailable; existing match continues.');return;}this.count=m.count;this.name=m.name;if(this.slot>=0&&m.count===2&&m.pair!==this.pair)this.openPeer(m.pair);this.onRoom();return;}if(m.type==='signal'&&m.pair===this.pair){void this.link?.accept(m.data).catch(()=>this.onNotice('Could not connect the players. Rejoin the room to retry.'));return;}if(m.type==='ended'){if(this.peerReady){this.onNotice('Room service disconnected. Your existing match continues.');return;}this.reset();this.onNotice(m.message);this.onRoom();}};
  });
 }
 private reply(m:any){const p=this.pending.get(m.rid);if(p){this.pending.delete(m.rid);m.error?p.reject(Error(m.error)):p.resolve(m.data);}}
 private rpc(type:string,data:Record<string,unknown>={},peer=false){const rid=++this.serial;return new Promise<any>((resolve,reject)=>{const timer=setTimeout(()=>{if(this.pending.delete(rid))reject(Error(peer?'Your partner did not confirm the action.':'Room service timed out.'));},peer?10000:20000);this.pending.set(rid,{resolve:x=>{clearTimeout(timer);resolve(x);},reject:e=>{clearTimeout(timer);reject(e);}});if(peer)this.link!.send({type:'rpc',action:type,...data,rid,epoch:this.epoch});else this.wsSend(type,{...data,rid});});}
 async request(type:string,data:Record<string,unknown>={}){
  if(type==='start'){if(!this.host||!this.peerReady)throw Error('Wait for both players to connect before starting.');this.epoch++;this.world.reset();this.received.clear();this.sent.clear();this.running=true;this.link!.send({type:'start',epoch:this.epoch});this.onPacket({type:'start',epoch:this.epoch});this.wsSend('playing',{pair:this.pair});return {};}
  if(type==='claim'){if(!this.running||!this.peerReady)throw Error('The browser connection is not ready.');const claim={...data,pose:this.localPose};if(this.host){if(validPose(claim.pose))this.world.pose(0,claim.pose);return this.world.claim(0,claim);}return this.rpc('claim',claim,true);}
  return this.rpc(type,data);
 }
 async enter(type:'host'|'join',name:string,password:string){const result=await this.rpc(type,{name,password,transport:'rtc'});if(result.transport!=='rtc')throw Error('This room service needs the WebRTC update.');this.slot=result.slot;this.name=result.name;this.count=type==='host'?1:2;this.iceServers=result.iceServers??[];if(result.pair!==undefined&&this.count===2&&this.pair!==result.pair)this.openPeer(result.pair);this.onRoom();}
 private openPeer(pair:number){this.closePeer();this.pair=pair;this.peerReady=false;this.route='connecting';const link=new PeerLink(this.host,this.iceServers,data=>this.wsSend('signal',{pair,data}));this.link=link;
  link.onPacket=p=>{if(this.link===link)this.receive(p);};link.onReady=()=>{if(this.link!==link)return;clearTimeout(this.connectTimer);this.peerReady=true;this.onRoom();this.statsTimer=setInterval(()=>void link.route().then(r=>{if(this.link===link){this.route=r.kind;this.rttMs=r.rttMs;}}),1500);};
  link.onLost=()=>{if(this.link!==link)return;this.peerReady=false;this.count=1;clearInterval(this.statsTimer);if(this.running)this.onPacket({type:'control',action:'pause'});this.onNotice('Player connection lost. Leave and rejoin the room to reconnect.');this.onRoom();};
  this.connectTimer=setTimeout(()=>{if(this.link===link&&!this.peerReady)this.onNotice('Players could not connect directly. This network may need a TURN relay. Leave and rejoin to retry.');},25000);
  if(this.host)void link.offer().catch(()=>this.onNotice('Could not create the browser connection.'));
 }
 private receive(p:PeerPacket){const slot=1-this.slot;if(p.type==='start'){if(this.host||!Number.isInteger(p.epoch)||p.epoch<=this.epoch)return;this.epoch=p.epoch;this.running=true;this.received.clear();this.sent.clear();this.onPacket(p);return;}if(p.type==='bye'){this.peerReady=false;this.count=1;if(this.running)this.onPacket({type:'control',action:'pause'});this.closePeer();this.onRoom();return;}if(p.epoch!==this.epoch)return;
  if(p.type==='rpcReply'){this.reply(p);return;}if(p.type==='rpc'&&this.host){try{if(p.action!=='claim'||!this.running)throw Error('Action unavailable.');if(validPose(p.pose)){this.world.pose(1,p.pose);this.peer=p.pose;}const data=this.world.claim(1,p);this.link!.send({type:'rpcReply',rid:p.rid,data,epoch:this.epoch});}catch(e){this.link!.send({type:'rpcReply',rid:p.rid,error:(e as Error).message,epoch:this.epoch});}return;}
  if(['pose','snapshot','move'].includes(p.type)){const key=p.type==='move'?`move:${p.id}:${p.revision??'input'}`:p.type;if(!Number.isInteger(p.seq)||p.seq<=(this.received.get(key)??-1))return;this.received.set(key,p.seq);}
  if(p.type==='pose'){if(!validPose(p.pose))return;if(this.host)this.world.pose(1,p.pose);this.deliver({...p,slot});return;}
  if(this.host){if(p.type==='move'||p.type==='release')this.world.motion(1,p);else if(p.type==='action'&&this.running){if(validPose(p.pose)){this.world.pose(1,p.pose);this.peer=p.pose;}this.world.action(1,p);}else if(p.type==='control'&&['pause','resume'].includes(p.action))this.deliver({...p,slot});return;}
  if(p.type==='snapshot'){if(!Array.isArray(p.state?.beans)||p.state.beans.length>128)return;this.deliver(p);return;}
  if(['claim','move','release','action','highfive'].includes(p.type))this.deliver(p);else if(p.type==='control'&&['pause','resume'].includes(p.action))this.deliver({...p,slot});
 }
 private closePeer(){clearTimeout(this.connectTimer);clearInterval(this.statsTimer);this.link?.close();this.link=undefined;this.peerReady=false;this.route='connecting';this.rttMs=null;}
 async leave(){this.link?.send({type:'bye',epoch:this.epoch});if(this.socket?.readyState===WebSocket.OPEN)await this.rpc('leave').catch(()=>{});this.reset();this.onRoom();}
 reset(){this.closePeer();for(const p of this.pending.values())p.reject(Error('Co-op closed.'));this.pending.clear();this.slot=-1;this.name='';this.count=0;this.running=false;this.epoch=0;this.pair=-1;this.peer=undefined;this.state=undefined;this.world.reset();this.localPose=undefined;this.sent.clear();this.received.clear();}
}
