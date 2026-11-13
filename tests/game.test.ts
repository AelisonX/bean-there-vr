import { test } from 'node:test';
import assert from 'node:assert/strict';
import {Shift, initialBatch, insideBin, BIN} from '../src/game';
test('initial batch is twenty good and five defective beans',()=>{const batch=initialBatch();assert.equal(batch.filter(Boolean).length,5);assert.equal(batch.filter(x=>!x).length,20);});
test('correct sorting and careless rejection use distinct scores',()=>{const s=new Shift();s.start();s.resolve(true,true);s.resolve(false,false);assert.equal(s.score,22);s.resolve(false,true);assert.equal(s.score,4);assert.equal(s.mistakes,1);s.resolve(true,false);assert.equal(s.score,0);assert.equal(s.mistakes,2);});
test('fifth mistake fails once and restart clears all state',()=>{const s=new Shift();s.start();for(let i=0;i<5;i++)s.resolve(true,false);assert.equal(s.phase,'failed');s.resolve(true,true);assert.equal(s.score,0);s.start();assert.equal(s.phase,'running');assert.equal(s.mistakes,0);});
test('pause freezes scoring, time and pressure',()=>{const s=new Shift();s.start();s.tick(30);const speed=s.speed;s.toggle();s.tick(100);s.resolve(true,false);assert.equal(s.elapsed,30);assert.equal(s.mistakes,0);assert.equal(s.speed,speed);s.toggle();s.tick(30);assert.equal(s.speed,speed);s.resolve(true,true);assert.ok(s.speed>speed);});
test('bin opening rejects points outside its walls',()=>{assert.ok(insideBin(BIN.x,BIN.z));assert.ok(!insideBin(.4,BIN.z));assert.ok(!insideBin(BIN.x,-.4));});
