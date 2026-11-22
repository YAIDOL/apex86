export const LANES=[-1.85,1.85];
export function newRun(){return {lane:0,x:LANES[0],speed:20,distance:0,passed:0,score:0,time:0,traffic:[],spawn:1.3,crashed:false,paused:false,braking:false,nearMiss:0};}
export function changeLane(r,delta){if(!r.crashed)r.lane=Math.max(0,Math.min(1,r.lane+delta));}
export function makeWave(r,random=Math.random){return [{x:LANES[random()<.5?0:1],z:-180-random()*35,speed:13+random()*7,model:Math.floor(random()*3),color:Math.floor(random()*5),passed:false,near:false}];}
export function stepRun(r,dt,input={}){
 if(r.paused||r.crashed)return;
 dt=Math.min(.05,Math.max(0,dt));r.time+=dt;r.braking=!!input.brake;
 const max=input.maxSpeed||51;
 r.speed=Math.max(0,Math.min(max,r.speed+(r.braking?-30:6.4*(1-r.speed/(max+8)))*dt));
 const oldX=r.x;r.x+=(LANES[r.lane]-r.x)*(1-Math.exp(-9*dt));r.lateral=(r.x-oldX)/Math.max(dt,.001);
 r.distance+=r.speed*dt;r.nearMiss=Math.max(0,r.nearMiss-dt);
 for(const c of r.traffic){const prev=c.z;c.z+=(r.speed-c.speed)*dt;
  if(Math.min(prev,c.z)<4.1&&Math.max(prev,c.z)>-4.1&&Math.abs(c.x-r.x)<1.55){r.crashed=true;r.speed=0;return;}
  if(!c.passed&&c.z>5){c.passed=true;r.passed++;if(Math.abs(c.x-r.x)<2.35){r.nearMiss=1.5;r.score+=100;}r.score+=50;}
 }
 r.traffic=r.traffic.filter(c=>c.z<35&&c.z>-330);r.spawn-=dt;
 if(r.spawn<=0){if(r.traffic.length<6)r.traffic.push(...makeWave(r));r.spawn=2.8+Math.random()*.9;}
 r.score=Math.max(r.score,Math.floor(r.distance*.45)+r.passed*50);
}
