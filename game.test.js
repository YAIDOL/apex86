import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newRun,stepRun,changeLane,makeWave} from './game.js';
test('strong braking stops the car quickly and never reverses it',()=>{const r=newRun();r.speed=40;for(let i=0;i<90;i++)stepRun(r,1/60,{brake:true});assert.ok(r.speed<1);assert.ok(r.speed>=0);});
test('lane changes are bounded and movement is continuous',()=>{const r=newRun();changeLane(r,1);changeLane(r,1);assert.equal(r.lane,1);const before=r.x;stepRun(r,1/60,{});assert.ok(r.x>before&&r.x<1.85);changeLane(r,-1);changeLane(r,-1);assert.equal(r.lane,0);});
test('traffic waves leave a clear lane and enough separation',()=>{const r=newRun();for(let i=0;i<100;i++){const wave=makeWave(r,()=>.7);assert.equal(wave.length,1);assert.ok(wave[0].z<-160);assert.ok(wave[0].speed>0);}});
test('collision considers actual position, while pause freezes the run',()=>{const r=newRun();r.traffic=[{x:r.x,z:-1,speed:10,passed:false}];stepRun(r,1/60,{});assert.equal(r.crashed,true);const p=newRun();p.paused=true;const d=p.distance;stepRun(p,1,{});assert.equal(p.distance,d);});
test('braking and distance are consistent across frame rates',()=>{const a=newRun(),b=newRun();for(let i=0;i<120;i++)stepRun(a,1/60,{});for(let i=0;i<60;i++)stepRun(b,1/30,{});assert.ok(Math.abs(a.speed-b.speed)<.2);assert.ok(Math.abs(a.distance-b.distance)<1);});
