import {test} from 'node:test';import assert from 'node:assert/strict';import {createIceProvider} from '../server/ice.mjs';
test('Cloudflare TURN uses server-only API token and returns only temporary browser credentials',async()=>{
 let calls=0;const provider=createIceProvider({CLOUDFLARE_TURN_KEY_ID:'key-id',CLOUDFLARE_TURN_API_TOKEN:'server-secret'},async(url:any,options:any)=>{calls++;assert.match(url,/keys\/key-id\/credentials\/generate-ice-servers$/);assert.equal(options.headers.Authorization,'Bearer server-secret');assert.equal(JSON.parse(options.body).ttl,86400);return {ok:true,json:async()=>({iceServers:[{urls:['turns:relay.example:443'],username:'temporary-'+calls,credential:'temporary-password',extra:'not-forwarded'}]})};});
 const a=await provider(),b=await provider();assert.equal(calls,2);assert.notEqual(a[0].username,b[0].username);assert.ok(!JSON.stringify(a).includes('server-secret'));assert.equal(a[0].extra,undefined);
});
test('TURN failures do not silently pretend to provide a reliable relay',async()=>{
 await assert.rejects(createIceProvider({CLOUDFLARE_TURN_KEY_ID:'missing-token'})());
 await assert.rejects(createIceProvider({CLOUDFLARE_TURN_KEY_ID:'id',CLOUDFLARE_TURN_API_TOKEN:'secret'},async()=>({ok:false}))());
 await assert.rejects(createIceProvider({TURN_URLS:'turn:example.test'})());
 const direct=await createIceProvider({})();assert.match(direct[0].urls[0],/^stun:/);
});
