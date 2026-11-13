import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {Shift} from '../src/game';
import {pointingGlovePosition,fingerCurl,BEAN_SCALE} from '../src/gloves';
import {Supervisor,PARTNER_BAY} from '../src/factory';
test('both straight index fingertips align with the menu pointing ray and curl toward palm',()=>{
 for(const hand of ['left','right'] as const){const index=hand==='right'?0:3;const tip=new T.Vector3((index-1.5)*.019,0,-.034-.052).add(pointingGlovePosition(hand));assert.ok(Math.abs(tip.x)<1e-6);assert.equal(tip.y,0);assert.ok(tip.z<0);const curled=new T.Vector3(0,0,-.05).applyAxisAngle(new T.Vector3(1,0,0),fingerCurl(true));assert.ok(curled.y<0);}assert.equal(BEAN_SCALE,.72);
});
test('endless reaches high pressure around five minutes without losing its success bonus',()=>{const s=new Shift();s.start('endless');const speeds=[s.speed];for(let i=0;i<5;i++){s.tick(60);speeds.push(s.speed);}assert.ok(speeds.every((x,i)=>i===0||x>speeds[i-1]));assert.ok(s.speed>=.54&&s.speed<.56);const base=s.speed;s.resolve(true,true);assert.ok(s.speed>base);for(let i=0;i<1000;i++)s.resolve(true,true);s.tick(10000);assert.ok(s.speed<=2.4);assert.equal(s.phase,'running');s.start();assert.equal(s.speed,.065);});
test('supervisor approaches, gestures and reacts to losing while leaving co-op bay empty',()=>{const sounds:boolean[]=[];const boss=new Supervisor(new T.Scene(),lose=>sounds.push(lose));boss.update(.1,'running',13,5);assert.equal(boss.mode,'approach');for(let i=0;i<40;i++)boss.update(.1,'running',14+i*.1,5);assert.equal(boss.mode,'angry');assert.ok(Math.abs(boss.right.rotation.z)>.2);assert.ok(sounds.includes(false));assert.ok(boss.root.position.z>PARTNER_BAY.maxZ+.4||boss.root.position.x<PARTNER_BAY.minX-.4);const age=boss.age;boss.update(2,'paused',20,0);assert.equal(boss.age,age);boss.update(.1,'failed',20,5);assert.equal(boss.mode,'lose');assert.ok(sounds.includes(true));boss.reset();assert.equal(boss.mode,'idle');assert.equal(boss.age,0);});
