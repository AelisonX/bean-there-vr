import {randomBytes,createHmac} from 'node:crypto';
// Provider secrets stay on the room service. Only expiring ICE credentials reach clients.
export function createIceProvider(env=process.env,fetcher=fetch){
 return async()=>{
  if(env.CLOUDFLARE_TURN_KEY_ID||env.CLOUDFLARE_TURN_API_TOKEN){
   if(!env.CLOUDFLARE_TURN_KEY_ID||!env.CLOUDFLARE_TURN_API_TOKEN)throw Error('TURN configuration incomplete');
   const response=await fetcher(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(env.CLOUDFLARE_TURN_KEY_ID)}/credentials/generate-ice-servers`,{method:'POST',headers:{Authorization:`Bearer ${env.CLOUDFLARE_TURN_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({ttl:86400}),signal:AbortSignal.timeout(8000)});
   if(!response.ok)throw Error('TURN provider unavailable');
   const data=await response.json();
   if(!Array.isArray(data.iceServers)||!data.iceServers.some(s=>s.username&&s.credential))throw Error('Invalid TURN response');
   return data.iceServers.map(s=>({urls:s.urls,...(s.username?{username:s.username,credential:s.credential}:{})}));
  }
  const servers=[{urls:env.STUN_URLS?.split(',')??['stun:stun.l.google.com:19302']}];
  if(env.TURN_URLS){const username=env.TURN_SECRET?Math.floor(Date.now()/1000+86400)+':'+randomBytes(6).toString('hex'):env.TURN_USERNAME;const credential=env.TURN_SECRET?createHmac('sha1',env.TURN_SECRET).update(username).digest('base64'):env.TURN_CREDENTIAL;if(!username||!credential)throw Error('TURN configuration incomplete');servers.push({urls:env.TURN_URLS.split(','),username,credential});}
  return servers;
 };
}
