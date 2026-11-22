import * as THREE from 'three';
import {mats,vec,addMesh,box,tube,bar,surface,decal,wheel,seat} from './vehicle-parts.js';
import {vehicleShape,bodyGeometry,roofGeometry,projectedShape,closedOutline} from './vehicle-geometry.js';

export const CARS=[
  {id:'gt86',brand:'TOYOTA',name:'GT86',year:'ZN6 · 2015',tag:'ЛЕГКІСТЬ І БАЛАНС',engine:'2.0 BOXER',drive:'RWD',power:'200',weight:'1 240',maxSpeed:51,color:'#dd4a21',length:4.24,width:1.775,height:1.285,front:-1.25,rear:1.32,radius:.325,roof:1.285,roofFront:-.18,roofRear:.66,windFront:-.83,windRear:1.27,spokes:5},
  {id:'supra',brand:'TOYOTA',name:'Supra',year:'A80 · 1998',tag:'ЛЕГЕНДА ТУРБОЕРИ',engine:'3.0 TWIN TURBO',drive:'RWD',power:'330',weight:'1 570',maxSpeed:57,color:'#d8dee0',length:4.52,width:1.81,height:1.275,front:-1.34,rear:1.21,radius:.334,roof:1.275,roofFront:-.02,roofRear:.51,windFront:-.94,windRear:1.42,spokes:5},
  {id:'gtr',brand:'NISSAN',name:'GT-R',year:'R35 · 2017',tag:'СИЛА ПОВНОГО ПРИВОДУ',engine:'3.8 V6 TWIN TURBO',drive:'AWD',power:'570',weight:'1 752',maxSpeed:62,color:'#969ea6',length:4.67,width:1.895,height:1.37,front:-1.43,rear:1.35,radius:.355,roof:1.365,roofFront:-.33,roofRear:.80,windFront:-1.03,windRear:1.39,spokes:6}
];
const glass=new THREE.MeshPhysicalMaterial({color:'#1a2830',roughness:.10,metalness:.1,clearcoat:1,clearcoatRoughness:.14,transparent:true,opacity:.86,depthWrite:false,side:THREE.DoubleSide});
const black=new THREE.MeshStandardMaterial({color:'#0c1115',roughness:.53,metalness:.15,side:THREE.DoubleSide});
const graphite=new THREE.MeshStandardMaterial({color:'#293137',roughness:.36,metalness:.72,side:THREE.DoubleSide});
const clearLens=new THREE.MeshPhysicalMaterial({color:'#b8c9d0',roughness:.07,metalness:.04,clearcoat:1,transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide});
const lampChrome=new THREE.MeshStandardMaterial({color:'#7d8a91',roughness:.2,metalness:.85,side:THREE.DoubleSide});
const led=new THREE.MeshStandardMaterial({color:'#eff7f5',emissive:'#dceeff',emissiveIntensity:.8,roughness:.2});
const seal=new THREE.MeshStandardMaterial({color:'#22282c',roughness:.85,side:THREE.DoubleSide});
function visual(parent,geometry,material,name){const m=addMesh(parent,geometry,material,name);m.castShadow=false;m.receiveShadow=false;return m;}
function glassSurface(parent,fn,nu,nv,name){const m=surface(parent,fn,nu,nv,glass,name);m.castShadow=false;m.receiveShadow=false;m.renderOrder=3;return m;}
function bodyDoorClipping(material,c,uniform){
  material.onBeforeCompile=shader=>{
    shader.uniforms.apexDoorOpen=uniform;shader.uniforms.apexDoorBounds={value:new THREE.Vector2(c.windFront+.12,c.windFront+1.48)};
    shader.vertexShader='varying vec3 apexLocalPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\napexLocalPosition=position;');
    shader.fragmentShader='uniform float apexDoorOpen;uniform vec2 apexDoorBounds;varying vec3 apexLocalPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(apexDoorOpen>0.02 && abs(apexLocalPosition.x)>0.63 && apexLocalPosition.y>0.31 && apexLocalPosition.y<0.83 && apexLocalPosition.z>apexDoorBounds.x && apexLocalPosition.z<apexDoorBounds.y)discard;');
  };material.customProgramCacheKey=()=> 'apex-continuous-body-v2';
}

function buildCabin(car,c,s,paint,lod){
  const roof=new THREE.Group();roof.name='Roof and glazing';car.add(roof);
  addMesh(roof,roofGeometry(c,s,lod),paint,'Solid crowned roof');
  const strip=(points,width,name)=>{const a=vec(points[0]),b=vec(points.at(-1)),delta=b.clone().sub(a),m=box(roof,a.clone().add(b).multiplyScalar(.5).toArray(),[width,.032,delta.length()+.025],paint,Math.min(.012,width*.24),name);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),delta.normalize());return m;};
  for(const side of [-1,1]){
    const a=[],cp=[];
    for(let i=0;i<=20;i++){const t=i/20,b=s.windowBottom(side,c.windFront),r=s.roofAt(side>0?1:0,c.roofFront);a.push([THREE.MathUtils.lerp(b[0],r[0],t),THREE.MathUtils.lerp(b[1],r[1],t),THREE.MathUtils.lerp(b[2],r[2],t)]);const br=s.windowBottom(side,c.windRear),rr=s.roofAt(side>0?1:0,c.roofRear);cp.push([THREE.MathUtils.lerp(rr[0],br[0],t),THREE.MathUtils.lerp(rr[1],br[1],t),THREE.MathUtils.lerp(rr[2],br[2],t)]);}
    strip(a,.048,'Integrated A pillar');strip(cp,c.id==='supra'?.125:.105,'Integrated C pillar');
    glassSurface(roof,(u,v)=>s.sideWindow(side,u,.74+v*.26),16,14,'Rear quarter glass');
    bar(roof,s.sideWindow(side,0,.74),s.sideWindow(side,1,.74),.025,.018,seal);
  }
  glassSurface(roof,(u,v)=>{const x=(u*2-1)*s.width(c.windFront)*.875,b=[x,s.topAt(x,c.windFront)+.008,c.windFront],r=s.roofAt(u,c.roofFront);return[THREE.MathUtils.lerp(b[0],r[0],v),THREE.MathUtils.lerp(b[1],r[1]-.002,v),THREE.MathUtils.lerp(b[2],r[2],v)-.026*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)]},lod?20:40,lod?16:32,'Continuous windshield');
  glassSurface(roof,(u,v)=>{const r=s.roofAt(u,c.roofRear),x=(u*2-1)*s.width(c.windRear)*.875,b=[x,s.topAt(x,c.windRear)+.008,c.windRear];return[THREE.MathUtils.lerp(r[0],b[0],v),THREE.MathUtils.lerp(r[1]-.002,b[1],v),THREE.MathUtils.lerp(r[2],b[2],v)+.018*Math.sin(u*Math.PI)*Math.sin(v*Math.PI)]},lod?20:40,lod?16:32,'Continuous rear glass');
  for(const z of [c.roofFront,c.roofRear])surface(roof,(u,v)=>{const p=s.roofAt(u,z);return[p[0],p[1]-.002,p[2]+(v-.5)*.025]},32,2,paint,'Windshield header');
  return roof;
}

function buildDoors(car,c,s,paint,lod){
  const doors=[],start=c.windFront+.09,end=c.windFront+1.50;
  for(const side of [-1,1]){
    const pivot=new THREE.Group();pivot.position.set(side*s.width(start)*.94,.63,start);pivot.name=side<0?'Driver door':'Passenger door';car.add(pivot);
    const origin=pivot.position.clone(),local=p=>[p[0]-origin.x,p[1]-origin.y,p[2]-origin.z];
    surface(pivot,(u,v)=>{const z=THREE.MathUtils.lerp(start,end,v),y=THREE.MathUtils.lerp(.292,.84,u),p=s.sideAt(z,y,side);p[0]+=side*.0017;return local(p)},lod?12:28,lod?20:44,paint,'Fitted door panel');
    glassSurface(pivot,(u,v)=>local(s.sideWindow(side,u,v*.74)),lod?12:28,lod?18:32,'Frameless door glass');
    const seam=[];for(const [u,v] of [[0,0],[.5,0],[1,0],[1,.3],[1,.7],[1,1],[.5,1],[0,1],[0,.5],[0,0]]){const p=s.sideAt(THREE.MathUtils.lerp(start,end,v),THREE.MathUtils.lerp(.305,.835,u),side);p[0]+=side*.003;seam.push(local(p));}tube(pivot,seam,.0009,seal,'Recessed door shut line').castShadow=false;
    const handle=s.sideAt(end-.20,.77,side);handle[0]+=side*.011;box(pivot,local(handle),[.023,.022,.13],paint,.01,'Flush door handle');
    box(pivot,[-side*.042,-.10,(end-start)*.53],[.052,.32,(end-start)*.88],mats.inner,.025,'Sculpted interior door card');
    box(pivot,[-side*.067,-.01,(end-start)*.57],[.035,.035,.23],graphite,.012,'Door release');
    const mirrorPos=local([side*(s.width(start)+.115),.94,start+.15]);
    box(pivot,mirrorPos,[.20,.095,.25],paint,.042,'Aerodynamic side mirror');
    box(pivot,[mirrorPos[0],mirrorPos[1],mirrorPos[2]+.129],[.15,.058,.006],mats.chrome,.015,'Mirror reflector');
    bar(pivot,local([side*s.width(start)*.94,.87,start+.19]),mirrorPos,.022,.027,seal);doors.push({group:pivot,side});
  }return doors;
}

function buildFront(car,c,s,paint,lod){
  const L=c.length/2;
  const grilleShape=c.id==='supra'?new THREE.Shape().absellipse(0,.405,.53,.108,0,Math.PI*2,false,0):closedOutline(c.id==='gtr'?[[-.55,.29],[.55,.29],[.52,.64],[-.52,.64]]:[[-.53,.285],[.53,.285],[.44,.56],[-.44,.56]]);
  visual(car,projectedShape(grilleShape,(x,y)=>s.faceAt(x,y,-1,.005),40),black,'Recessed central grille');
  for(let j=0;j<(c.id==='supra'?5:7);j++){const pts=[];for(let k=0;k<=12;k++)pts.push(s.faceAt(-.46+k/12*.92,.32+j*.031,-1,.009));visual(car,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(vec)),20,.003,5,false),graphite,'Radiator grille slat');}
  for(const side of [-1,1]){const vent=closedOutline(c.id==='supra'?[[side*.60,.32],[side*.75,.33],[side*.73,.49],[side*.62,.49]]:[[side*.61,.29],[side*.76,.32],[side*.76,.49],[side*.65,.48]]);visual(car,projectedShape(vent,(x,y)=>s.faceAt(x,y,-1,.005)),black,'Integrated bumper intake');}
  const splitter=[];for(let i=0;i<=48;i++)splitter.push(s.faceAt(-c.width*.42+i/48*c.width*.84,.225,-1,.014));tube(car,splitter,.012,graphite,'Rounded lower splitter');
  for(const side of [-1,1]){
    let outline;if(c.id==='supra'){outline=new THREE.Shape();outline.absellipse(side*.565,-L+.32,.245,.105,0,Math.PI*2,false,0);}else outline=closedOutline(c.id==='gtr'?[[side*.46,-L+.15],[side*.79,-L+.24],[side*.76,-L+.67],[side*.62,-L+.56]]:[[side*.37,-L+.135],[side*.78,-L+.235],[side*.76,-L+.48],[side*.55,-L+.39]]);
    visual(car,projectedShape(outline,(x,z)=>[x,s.topAt(x,z)+.006,z],48),black,'Sealed headlight housing');
    const count=c.id==='supra'?3:c.id==='gtr'?2:1;
    for(let k=0;k<count;k++){const x=side*(c.id==='supra'?.39+k*.15:c.id==='gtr'?.61+k*.065:.62),z=-L+(c.id==='gtr'?.37+k*.14:.32),y=s.topAt(x,z)+.025;const socket=visual(car,new THREE.SphereGeometry(c.id==='supra'?.044:.052,lod?12:24,16),lampChrome,'Projector bowl');socket.position.set(x,y,z);socket.scale.set(1,.35,1);const optic=visual(car,new THREE.SphereGeometry(.026,lod?12:24,16),led,'Projector optic');optic.position.set(x,y+.012,z-.009);optic.scale.set(1,.40,1);}
    const line=[];for(const [x,z] of(c.id==='supra'?[[.36,-L+.37],[.58,-L+.41],[.77,-L+.34]]:[[.40,-L+.17],[.60,-L+.22],[.75,-L+.31]])){const xx=side*x;line.push([xx,s.topAt(xx,z)+.013,z]);}visual(car,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line.map(vec)),28,.0055,7,false),led,'Continuous LED light guide');
    visual(car,projectedShape(outline,(x,z)=>[x,s.topAt(x,z)+.032,z],48),clearLens,'Curved polycarbonate headlight cover').renderOrder=4;
  }
  const emblem=decal(car,c.id==='gtr'?'GT-R':'TOYOTA',[0,s.topAt(0,-L+.20)+.01,-L+.20],.11,.027,'#bac4c9',null,47);emblem.rotation.x=-Math.PI/2;emblem.castShadow=false;
  const plate=decal(car,'APEX  /  86',[0,.295,-L-.012],.34,.073,'#cad0d4','#10171c',50);plate.rotation.y=Math.PI;plate.castShadow=false;
}

function buildRear(car,c,s,paint){
  const L=c.length/2,brakeMaterials=[];
  for(const side of [-1,1]){
    if(c.id==='gt86'){const shape=closedOutline([[side*.29,.62],[side*.76,.625],[side*.75,.775],[side*.35,.76]]);visual(car,projectedShape(shape,(x,y)=>s.faceAt(x,y,1,.008)),lampChrome,'Flush clear taillamp housing');}
    for(let k=0;k<(c.id==='gt86'?1:2);k++){const x=side*(c.id==='gt86'?.57:.39+k*.25),y=c.id==='gtr'?.705:.675,p=s.faceAt(x,y,1,.018),mat=new THREE.MeshStandardMaterial({color:'#871419',emissive:'#c31922',emissiveIntensity:.42,roughness:.19});brakeMaterials.push(mat);const radius=c.id==='gtr'?.078:c.id==='supra'?.067:.061;const background=visual(car,new THREE.CylinderGeometry(radius+.008,radius+.008,.012,36),black,'Taillight recess');background.rotation.x=Math.PI/2;background.position.set(...p);const ring=visual(car,new THREE.TorusGeometry(radius*.77,radius*.16,10,48),mat,'Red LED taillight ring');ring.position.set(p[0],p[1],p[2]+.009);const center=visual(car,new THREE.CircleGeometry(radius*.38,24),mat,'Taillight center');center.position.set(p[0],p[1],p[2]+.011);}
  }
  box(car,[0,.235,L-.08],[c.width*.70,.105,.22],graphite,.04,'Blended rear diffuser');for(let k=-2;k<=2;k++)box(car,[k*.20,.19,L-.04],[.012,.085,.21],graphite,.005,'Diffuser vane');
  for(const side of [-1,1])for(let k=0;k<(c.id==='gtr'?2:1);k++){const x=side*(.64+k*.13),tip=visual(car,new THREE.CylinderGeometry(.048,.048,.12,32,1,true),mats.chrome,'Double-wall exhaust tip');tip.rotation.x=Math.PI/2;tip.position.set(x,.265,L-.005);const hole=visual(car,new THREE.CircleGeometry(.038,28),black,'Dark exhaust bore');hole.position.set(x,.265,L+.058);}
  if(c.id==='supra'){for(const side of [-1,1])tube(car,[[side*.69,.82,1.47],[side*.70,1.05,1.58],[side*.72,1.22,1.75]],.035,paint,'A80 curved spoiler pedestal');const wing=box(car,[0,1.23,1.765],[1.62,.035,.23],paint,.016,'Solid sculpted A80 rear wing'),p=wing.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)+.022*Math.pow(p.getX(i)/.81,2));wing.geometry.computeVertexNormals();}
  else if(c.id==='gtr'){for(const side of [-1,1])bar(car,[side*.59,.87,1.63],[side*.59,1.08,1.76],.045,.07,paint);box(car,[0,1.10,1.77],[1.61,.045,.24],paint,.02,'R35 rear wing');}
  else{const points=[];for(let i=0;i<=40;i++){const x=-.66+i/40*1.32,z=1.86;points.push([x,s.topAt(x,z)+.028,z]);}tube(car,points,.021,paint,'GT86 integrated ducktail lip');}
  const plate=decal(car,c.id==='gt86'?'GT86':c.id==='supra'?'SUPRA':'GT-R',[0,.48,L+.013],.34,.085,'#d1d5d7','#11171c',52);plate.castShadow=false;return brakeMaterials;
}

function buildInterior(car,c){
  const g=new THREE.Group();g.name='Detailed cockpit';car.add(g);
  box(g,[0,.34,.22],[1.32,.035,1.64],mats.carpet,.012,'Carpeted footwell');for(const side of [-1,1])seat(g,side*.37,.29,c);
  box(g,[0,.48,.22],[.20,.27,1.25],mats.inner,.035,'Upholstered center tunnel');box(g,[0,.63,.12],[.17,.035,.27],graphite,.012,'Brushed shifter bezel');bar(g,[0,.65,.07],[0,.77,.04],.014,.014,mats.chrome);
  const knob=visual(g,new THREE.SphereGeometry(.029,24,16),mats.leather,'Leather gear knob');knob.position.set(0,.78,.04);box(g,[.09,.66,.37],[.027,.028,.20],mats.inner,.01,'Handbrake');
  box(g,[0,.80,-.60],[1.40,.22,.33],mats.inner,.085,'Soft-touch dashboard');box(g,[0,.925,-.62],[1.40,.055,.30],mats.leather,.025,'Curved dash upper pad');
  const display=decal(g,c.id==='gt86'?'86  ·  DRIVE':c.id==='supra'?'SUPRA':'GT-R',[.17,.835,-.423],.23,.115,'#9abfc2','#080e12',42);display.rotation.x=-.12;display.castShadow=false;
  for(const x of[-.62,.62,.30,-.12]){box(g,[x,.865,-.418],[.115,.065,.018],black,.022,'Dashboard air vent');for(let k=0;k<5;k++)box(g,[x-.04+k*.02,.865,-.405],[.005,.044,.004],graphite,.001,'Vent vane');}
  box(g,[-.39,.91,-.48],[.35,.16,.22],mats.leather,.055,'Instrument binnacle');
  for(let k=0;k<3;k++){const x=-.51+k*.12,r=k===1?.052:.038,face=visual(g,new THREE.CircleGeometry(r,40),black,'Analog instrument dial');face.position.set(x,.907,-.357);const ring=visual(g,new THREE.TorusGeometry(r,.0025,6,40),mats.silver,'Instrument bezel');ring.position.copy(face.position);for(let j=0;j<14;j++){const a=Math.PI*.2+j/13*Math.PI*1.6;bar(g,[x+Math.cos(a)*r*.78,.907+Math.sin(a)*r*.78,-.350],[x+Math.cos(a)*r*.91,.907+Math.sin(a)*r*.91,-.350],.0015,.0015,led);}bar(g,[x,.907,-.344],[x-.018,.930,-.344],.002,.002,led);}
  const speed=decal(g,'000',[-.39,.889,-.341],.040,.013,'#dce8e7',null,67);speed.name='Digital instrument readout';speed.castShadow=false;
  const steering=new THREE.Group();steering.position.set(-.39,.805,-.23);steering.rotation.x=-.23;g.add(steering);addMesh(steering,new THREE.TorusGeometry(.151,.018,14,72),mats.leather,'Sculpted leather steering rim');box(steering,[0,-.005,0],[.125,.095,.052],mats.inner,.035,'Driver airbag module');for(const angle of[0,Math.PI,Math.PI*1.5])bar(steering,[0,0,0],[Math.cos(angle)*.14,Math.sin(angle)*.14,0],.022,.019,graphite);
  const badge=decal(steering,c.brand,[0,-.005,.028],.07,.016,'#bdc6ca',null,45);badge.castShadow=false;
  for(let k=0;k<3;k++)box(g,[-.53+k*.11,.40,-.67],[.052,.09,.018],mats.silver,.009,'Brushed aluminum pedal');box(g,[0,.49,1.00],[1.20,.16,.34],mats.leather,.06,'Rear bench');box(g,[0,.67,1.13],[1.20,.34,.11],mats.leather,.045,'Rear backrest');return{group:g,steering};
}

export function createCar(index=0,{color,lod=false}={}){
  const c={...CARS[index]},s=vehicleShape(c),car=new THREE.Group();car.name=`${c.brand} ${c.name} — continuous original model`;c.stitch=new THREE.MeshStandardMaterial({color:'#625a54',roughness:.9});
  const paint=new THREE.MeshPhysicalMaterial({color:color||c.color,metalness:.28,roughness:.35,clearcoat:.65,clearcoatRoughness:.25});
  const bodyPaint=paint.clone();bodyPaint.color=paint.color;const doorUniform={value:0};bodyDoorClipping(bodyPaint,c,doorUniform);
  const body=addMesh(car,bodyGeometry(c,s,lod),bodyPaint,'Continuous body shell');const roof=buildCabin(car,c,s,paint,lod),doors=buildDoors(car,c,s,paint,lod);buildFront(car,c,s,paint,lod);const brakeMaterials=buildRear(car,c,s,paint);
  for(const side of[-1,1]){const hood=[];for(let i=0;i<=42;i++){const z=THREE.MathUtils.lerp(-s.L+.30,c.windFront-.035,i/42),x=side*THREE.MathUtils.lerp(.51,.57,i/42);hood.push([x,s.topAt(x,z)+.0045,z]);}tube(car,hood,.0014,seal,'Fine hood shut line').castShadow=false;const wiper=[];for(let i=0;i<=12;i++){const x=side*(.08+i/12*.43),z=c.windFront+.015;wiper.push([x,s.topAt(x,c.windFront)+.02,z]);}tube(car,wiper,.004,seal,'Windshield wiper');box(car,[side*(c.width/2-.015),.215,.08],[.045,.07,1.63],graphite,.022,'Smooth rocker trim');}
  const cabin=buildInterior(car,c),wheels=[];
  for(const side of[-1,1])for(const axle of[c.front,c.rear]){const pivot=new THREE.Group();pivot.position.set(side*(c.width/2-.083),c.radius,axle);const w=wheel(c,side,axle,lod);w.position.set(0,0,0);const tire=w.getObjectByName('Tire');if(tire){const profile=new THREE.CatmullRomCurve3([[.235,-.113,0],[.29,-.113,0],[c.radius-.01,-.084,0],[c.radius,-.045,0],[c.radius,.045,0],[c.radius-.01,.084,0],[.29,.113,0],[.235,.113,0]].map(vec));tire.geometry=new THREE.LatheGeometry(profile.getPoints(40).map(p=>new THREE.Vector2(p.x,p.y)),lod?32:72);}pivot.add(w);car.add(pivot);wheels.push({pivot,wheel:w,front:axle<0,side});}
  Object.assign(car.userData,{config:CARS[index],paint,body,bodyOpen:doorUniform,roof,doors,interior:cabin.group,steering:cabin.steering,wheels,brakeMaterials,driverEye:new THREE.Vector3(-.39,1.075,.22),driverTarget:new THREE.Vector3(-.35,.94,-2.7)});return car;
}
export function animateCar(car,{wheel=0,steer=0,brake=false,doors=0,roof=true}={}){for(const w of car.userData.wheels){w.wheel.rotation.x=wheel;w.pivot.rotation.y=w.front?steer:0;}for(const door of car.userData.doors)door.group.rotation.y=door.side*doors;car.userData.bodyOpen.value=doors;car.userData.roof.visible=roof;for(const material of car.userData.brakeMaterials)material.emissiveIntensity=brake?2.8:.42;car.userData.steering.rotation.z=-steer*2.7;}
export function createExportModel(index,{color}={}){const car=createCar(index,{color});car.traverse(m=>{if(!m.isMesh)return;if(m.material.map){m.material=m.material.clone();m.material.map=null;m.material.color.set('#303a41');}const n=m.geometry.attributes.normal;for(let i=0;i<n.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<.5)n.setXYZ(i,0,1,0);});return car;}
