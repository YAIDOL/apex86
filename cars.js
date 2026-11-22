import * as THREE from 'three';
import {RoundedBoxGeometry} from './vendor/addons/geometries/RoundedBoxGeometry.js';

export const CARS=[
 {id:'gt86',brand:'TOYOTA',name:'GT86',year:'ZN6 · 2015',tag:'ЛЕГКІСТЬ І БАЛАНС',engine:'2.0 BOXER',drive:'RWD',power:'200',weight:'1 240',maxSpeed:51,color:'#dd4a21',length:4.24,width:1.775,height:1.285,front:-1.25,rear:1.32,radius:.325,roof:1.30,roofFront:-.20,roofRear:.64,windFront:-.85,windRear:1.24,spokes:5},
 {id:'supra',brand:'TOYOTA',name:'Supra',year:'A80 · 1998',tag:'ЛЕГЕНДА ТУРБОЕРИ',engine:'3.0 TWIN TURBO',drive:'RWD',power:'330',weight:'1 570',maxSpeed:57,color:'#e4d9c4',length:4.52,width:1.81,height:1.275,front:-1.34,rear:1.21,radius:.334,roof:1.28,roofFront:-.06,roofRear:.48,windFront:-.96,windRear:1.39,spokes:5},
 {id:'gtr',brand:'NISSAN',name:'GT-R',year:'R35 · 2017',tag:'СИЛА ПОВНОГО ПРИВОДУ',engine:'3.8 V6 TWIN TURBO',drive:'AWD',power:'570',weight:'1 752',maxSpeed:62,color:'#969ea6',length:4.67,width:1.895,height:1.37,front:-1.43,rear:1.35,radius:.355,roof:1.39,roofFront:-.31,roofRear:.80,windFront:-1.01,windRear:1.32,spokes:6}
];
const mats={rubber:new THREE.MeshStandardMaterial({color:'#131519',roughness:.94}),dark:new THREE.MeshStandardMaterial({color:'#101419',roughness:.62,metalness:.15}),leather:new THREE.MeshStandardMaterial({color:'#202227',roughness:.9}),trim:new THREE.MeshStandardMaterial({color:'#34373c',roughness:.62,metalness:.35}),chrome:new THREE.MeshStandardMaterial({color:'#b0b7bf',roughness:.25,metalness:.9}),silver:new THREE.MeshStandardMaterial({color:'#777e87',roughness:.32,metalness:.8}),caliper:new THREE.MeshStandardMaterial({color:'#bf3121',roughness:.43,metalness:.35}),lamp:new THREE.MeshPhysicalMaterial({color:'#73848e',roughness:.18,metalness:.62}),white:new THREE.MeshStandardMaterial({color:'#e7f5ff',emissive:'#8facbf',emissiveIntensity:.7,roughness:.3}),tail:new THREE.MeshStandardMaterial({color:'#8e1013',emissive:'#d31519',emissiveIntensity:.45,roughness:.2}),amber:new THREE.MeshStandardMaterial({color:'#e99831',emissive:'#c56c00',emissiveIntensity:.25,roughness:.25}),glass:new THREE.MeshPhysicalMaterial({color:'#405864',roughness:.16,metalness:.30,transparent:true,opacity:.79,depthWrite:false,side:THREE.DoubleSide}),inner:new THREE.MeshStandardMaterial({color:'#15191d',roughness:.75}),carpet:new THREE.MeshStandardMaterial({color:'#111315',roughness:1})};
const vec=p=>new THREE.Vector3(...p);
function addMesh(parent,geo,mat,name){const m=new THREE.Mesh(geo,mat);m.name=name||'';m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,pos,size,mat,r=.02,name=''){const m=addMesh(parent,r?new RoundedBoxGeometry(...size,3,r):new THREE.BoxGeometry(...size),mat,name);m.position.set(...pos);return m;}
function tube(parent,points,r,mat,name=''){return addMesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(vec)),Math.max(12,points.length*5),r,8,false),mat,name);}
function bar(parent,a,b,width,depth,mat){const aa=vec(a),bb=vec(b),m=box(parent,aa.clone().add(bb).multiplyScalar(.5).toArray(),[width,depth,aa.distanceTo(bb)],mat,.005);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),bb.clone().sub(aa).normalize());return m;}
function surface(parent,fn,nu,nv,mat,name,keep=()=>true){const pos=[],uv=[],ind=[];for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){pos.push(...fn(i/nu,j/nv));uv.push(i/nu,j/nv);if(i<nu&&j<nv&&keep((i+.5)/nu,(j+.5)/nv)){const a=j*(nu+1)+i,b=a+nu+1;ind.push(a,a+1,b,b,a+1,b+1);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ind);g.computeVertexNormals();return addMesh(parent,g,mat,name);}
function panel(parent,points,mat,depth=.018){const shape=new THREE.Shape();points.forEach((p,i)=>i?shape.lineTo(...p):shape.moveTo(...p));shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:2,steps:1});return addMesh(parent,geo,mat);}
function roundLamp(parent,x,y,z,r,mat){const m=addMesh(parent,new THREE.CylinderGeometry(r,r,.025,32),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);return m;}
function quad(parent,corners,mat,name){return surface(parent,(u,v)=>{const a=vec(corners[0]).lerp(vec(corners[1]),u),b=vec(corners[3]).lerp(vec(corners[2]),u);return a.lerp(b,v).toArray();},12,8,mat,name);}
function decal(parent,text,pos,w,h,color='#cbd1d4',background='#14181b',size=64){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,512,128);}ctx.fillStyle=color;ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,67);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const m=addMesh(parent,new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,transparent:!background,roughness:.6}));m.position.set(...pos);return m;}
function wheel(c,side,z,lod){const group=new THREE.Group();group.name=`${z<0?'Front':'Rear'} ${side<0?'left':'right'} wheel`;group.position.set(side*(c.width/2-.055),c.radius,z);const seg=lod?24:48,r=c.radius;
let m=addMesh(group,new THREE.CylinderGeometry(r,r,.22,seg,1),mats.rubber,'Tire');m.rotation.z=Math.PI/2;
for(const sign of [-1,1]){m=addMesh(group,new THREE.TorusGeometry(r-.036,.036,8,seg),mats.rubber,'Sidewall');m.rotation.y=Math.PI/2;m.position.x=sign*.105;}
m=addMesh(group,new THREE.CylinderGeometry(r*.72,r*.72,.20,seg,1),mats.dark,'Wheel barrel');m.rotation.z=Math.PI/2;
const faceX=side*.12; m=addMesh(group,new THREE.TorusGeometry(r*.72,.014,8,seg),mats.chrome,'Rim lip');m.rotation.y=Math.PI/2;m.position.x=faceX;
m=addMesh(group,new THREE.CylinderGeometry(r*.61,r*.61,.018,seg),mats.silver,'Ventilated brake rotor');m.rotation.z=Math.PI/2;m.position.x=side*.075;
if(!lod)for(let k=0;k<28;k++){const a=k*Math.PI*2/28;const hole=addMesh(group,new THREE.CircleGeometry(.0065,6),mats.dark);hole.rotation.y=side*Math.PI/2;hole.position.set(side*.087,Math.cos(a)*r*.49,Math.sin(a)*r*.49);}
box(group,[side*.09,.025,-r*.47],[.07,.12,.09],mats.caliper,.02,'Brake caliper');
for(let k=0;k<c.spokes;k++){const a=k*Math.PI*2/c.spokes;for(const split of (c.id==='gt86'?[-1,1]:[0])){const aa=a+split*.055;bar(group,[faceX,Math.cos(a)*.04,Math.sin(a)*.04],[faceX,Math.cos(aa)*r*.69,Math.sin(aa)*r*.69],.032,c.id==='gtr'?.043:.029,mats.chrome);}}
m=addMesh(group,new THREE.CylinderGeometry(.056,.056,.027,20),mats.chrome,'Hub');m.rotation.z=Math.PI/2;m.position.x=faceX;
if(!lod)for(let k=0;k<5;k++){const a=k*Math.PI*2/5;m=addMesh(group,new THREE.SphereGeometry(.009,8,6),mats.dark);m.position.set(faceX+side*.019,Math.cos(a)*.036,Math.sin(a)*.036);}
return group;
}
function seat(parent,x,z,c){const seat=new THREE.Group();seat.name='Sport bucket seat';seat.position.set(x,.31,z);box(seat,[0,.10,0],[.43,.15,.47],mats.leather,.065,'Seat cushion');const back=box(seat,[0,.39,.18],[.42,.55,.14],mats.leather,.065,'Seat back');back.rotation.x=-.14;box(seat,[0,.75,.23],[.27,.22,.14],mats.leather,.045,'Headrest');for(const s of [-1,1]){box(seat,[s*.18,.34,.1],[.09,.46,.24],mats.inner,.035,'Side bolster');tube(seat,[[s*.13,.1,-.17],[s*.15,.12,.1],[s*.14,.56,.14]],.006,c.stitch,'Contrast stitching');}parent.add(seat);}
export function createCar(index=0,{color,lod=false}={}){
const c={...CARS[index]};c.stitch=new THREE.MeshStandardMaterial({color:color||c.color,roughness:.8});const car=new THREE.Group();car.name=`${c.brand} ${c.name} — original game model`;car.userData.config=CARS[index];
const paint=new THREE.MeshPhysicalMaterial({color:color||c.color,roughness:.36,metalness:.43,clearcoat:.4,clearcoatRoughness:.4,side:THREE.DoubleSide});car.userData.paint=paint;
const hw=c.width/2,L=c.length/2,shape=c.id;const seg=lod?32:80;
function profile(z,points){const f=THREE.MathUtils.clamp((z+L)/c.length,0,.999999)*(points.length-1),i=Math.floor(f),t=f-i,p0=points[Math.max(0,i-1)],p1=points[i],p2=points[Math.min(points.length-1,i+1)],p3=points[Math.min(points.length-1,i+2)];return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);}
const widthProfiles={gt86:[.86,.96,1.015,.985,.955,.97,1.02,1.025,.97,.86],supra:[.78,.91,.99,.96,.94,.97,1.045,1.07,.98,.84],gtr:[.91,1.0,1.02,.99,.97,.985,1.035,1.04,.99,.93]};
const deckProfiles={gt86:[.65,.755,.80,.84,.87,.86,.845,.83,.79,.71],supra:[.63,.72,.78,.82,.85,.84,.86,.88,.82,.72],gtr:[.77,.84,.88,.93,.96,.95,.94,.94,.89,.80]};
function width(z){return hw*profile(z,widthProfiles[shape]);}
function deck(z){return profile(z,deckProfiles[shape]);}
function arch(z){let h=.25;for(const zz of [c.front,c.rear]){const d=(z-zz)/(c.radius+.055);if(Math.abs(d)<1)h=Math.max(h,c.radius+Math.sqrt(1-d*d)*(c.radius+.055));}return h;}
function hoodHeight(x,z){return deck(z)+.06*(1-Math.pow(x/width(z),2));}
function flushHeadlight(side,points){const verts=points.map(p=>[p[0]*side,0,p[1]]);surface(car,(u,v)=>{const a=vec(verts[0]).lerp(vec(verts[1]),u),b=vec(verts[3]).lerp(vec(verts[2]),u),p=a.lerp(b,v);return [p.x,hoodHeight(p.x,p.z)+.014,p.z]},18,12,mats.lamp,'Contoured headlight lens');const outline=verts.map(p=>[p[0],hoodHeight(p[0],p[2])+.017,p[2]]);outline.push(outline[0]);tube(car,outline,.003,mats.dark,'Headlight weather seal');}
const shell=new THREE.Group();shell.name='Sculpted body panels';car.add(shell);
// Longitudinally curved fenders, open wheel arches and rolled lower sills.
for(const side of [-1,1]){
surface(shell,(u,v)=>{const z=-L+v*c.length,lo=arch(z),hi=deck(z)+.035;return [side*width(z)*(.94+.06*u+.012*Math.sin(u*Math.PI)),lo+(hi-lo)*u,z]},18,seg,paint,side<0?'Left quarter panel':'Right quarter panel',(u,v)=>{const z=-L+v*c.length,y=arch(z)+(deck(z)+.035-arch(z))*u;return !(z>c.windFront+.15&&z<c.windFront+1.40&&y>.31&&y<.795);});
for(const axle of [c.front,c.rear]){const pts=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;const z=axle+Math.cos(a)*(c.radius+.057);pts.push([side*(width(z)+.003),c.radius+Math.sin(a)*(c.radius+.057),z]);}tube(shell,pts,.006,paint,'Rolled wheel arch');}
box(shell,[side*(hw-.035),.225,.07],[.095,.11,1.75],mats.dark,.035,'Side skirt');
surface(shell,(u,v)=>{const z=c.windFront+v*(c.windRear-c.windFront),edge=width(z),inside=.65;return [side*(inside+(edge-inside)*u),deck(z)+.04*Math.sin(u*Math.PI),z]},8,seg,paint,'Shoulder contour');
}
surface(shell,(u,v)=>{let z=-L+v*(c.windFront+L);z+=(1-v)*(shape==='supra'?.24:.12)*Math.pow(Math.abs(u*2-1),3);const x=(u*2-1)*width(z);return [x,deck(z)+.06*(1-Math.pow(Math.abs(u*2-1),2)),z]},32,36,paint,'Sculpted hood');
surface(shell,(u,v)=>{const z=c.windRear+v*(L-c.windRear),x=(u*2-1)*width(z);return [x,deck(z)+.035*(1-Math.pow(Math.abs(u*2-1),2)),z]},24,16,paint,'Rear deck');
box(car,[0,.21,.05],[c.width*.86,.16,c.length*.88],mats.dark,.08,'Underbody');
// Nose and tail are separate sculpted panels with inset black air openings.
surface(shell,(u,v)=>{const t=u*2-1,x=t*hw*(.87+.08*Math.sin(v*Math.PI)),y=.25+v*.44;return [x,y,-L+.035+.18*Math.pow(Math.abs(t),3)+.04*Math.sin(v*Math.PI)]},40,18,paint,'Front bumper');
surface(shell,(u,v)=>{const x=(u*2-1)*hw*.93,y=.25+v*.45;return [x,y,L-.04-.09*Math.pow(Math.abs(u*2-1),2)]},32,12,paint,'Rear bumper');
if(shape!=='gtr')for(const side of [-1,1]){const corner=addMesh(car,new THREE.SphereGeometry(1,32,20),paint,'Rounded bumper corner');corner.position.set(side*hw*.77,.43,-L+.23);corner.scale.set(shape==='supra'?.19:.12,.19,shape==='supra'?.30:.23);}
box(car,[0,.215,-L+.05],[c.width*.94,.055,.24],mats.dark,.035,'Front splitter');box(car,[0,.25,L-.055],[c.width*.76,.14,.20],mats.dark,.035,'Rear diffuser');
for(let x=-.5;x<=.5;x+=.25)box(car,[x,.18,L-.015],[.018,.13,.22],mats.dark,.005,'Diffuser fin');
let grille;if(shape==='supra'){const opening=new THREE.Shape();opening.absellipse(0,.415,.55,.125,0,Math.PI*2,false,0);grille=addMesh(car,new THREE.ExtrudeGeometry(opening,{depth:.018,bevelEnabled:true,bevelThickness:.006,bevelSize:.008,bevelSegments:3,steps:1,curveSegments:40}),mats.dark);}else grille=panel(car,[[-.55,.29],[.55,.29],[shape==='gtr'?.58:.46,.56],[-(shape==='gtr'?.58:.46),.56]],mats.dark);grille.position.z=-L+.018;grille.rotation.y=Math.PI;
// Fine grille slats and tow eye add depth without texture placeholders.
for(let k=0;k<6;k++)box(car,[0,.32+k*.034,-L-.007],[1.0,.008,.018],mats.trim,.002,'Grille slat');
for(const side of [-1,1]){box(car,[side*.70,.40,-L+.05],[.19,.19,.028],mats.dark,.025,'Side intake');tube(car,[[side*.60,.29,-L+.012],[side*.73,.28,-L+.018],[side*.78,.45,-L+.008]],.012,mats.trim);}
// Cabin glazing, roof and slender pillars follow each model's own silhouette.
const roof=new THREE.Group();roof.name='Roof and glazing';car.add(roof);car.userData.roof=roof;
function roofY(z){const t=(z-c.roofFront)/(c.roofRear-c.roofFront);return c.roof+(shape==='supra'?.065:shape==='gtr'?.012:.035)*Math.sin(THREE.MathUtils.clamp(t,0,1)*Math.PI);}
surface(roof,(u,v)=>{const z=c.roofFront+v*(c.roofRear-c.roofFront);return [(u*2-1)*.625,roofY(z)-.045*Math.pow(u*2-1,2),z]},20,20,paint,'Crowned roof');
surface(roof,(u,v)=>{const z=c.windFront+(c.roofFront-c.windFront)*v,x=(u*2-1)*(.76-.135*v);return [x,deck(c.windFront)+(c.roof-.045-deck(c.windFront))*v+.018*Math.sin(u*Math.PI),z-.035*Math.sin(u*Math.PI)]},24,18,mats.glass,'Windshield');
surface(roof,(u,v)=>{const z=c.roofRear+(c.windRear-c.roofRear)*v;return [(u*2-1)*(.625+.13*v),c.roof-.045+(deck(c.windRear)-c.roof+.045)*v+.02*Math.sin(u*Math.PI),z]},24,18,mats.glass,'Rear windshield');
for(const side of [-1,1]){
const aPillar=new THREE.CatmullRomCurve3([[side*.765,deck(c.windFront),c.windFront],[side*.69,1.08,(c.windFront+c.roofFront)*.5],[side*.625,c.roof-.025,c.roofFront]].map(vec));surface(roof,(u,v)=>{const p=aPillar.getPoint(v);return [p.x+side*(u-.5)*.044,p.y+.014,p.z]},4,22,paint,'Flat A pillar');
const cPillar=new THREE.CatmullRomCurve3([[side*.64,c.roof-.025,c.roofRear],[side*.70,1.07,(c.windRear+c.roofRear)*.5],[side*.765,deck(c.windRear),c.windRear]].map(vec));surface(roof,(u,v)=>{const p=cPillar.getPoint(v);return [p.x+side*(u-.5)*(.075+v*.10),p.y+.014,p.z]},6,22,paint,'Sculpted C pillar');
bar(roof,[side*.638,.87,.55],[side*.638,c.roof-.02,.55],.022,.026,mats.dark);
// Door pivot carries frame and window, so opening reveals the modeled interior.
const door=new THREE.Group();door.name=side<0?'Driver door':'Passenger door';door.position.set(side*.79,.73,c.windFront+.12);car.add(door);
const doorLen=1.30,doorX=side*.065;
surface(door,(u,v)=>[doorX+side*.015*Math.sin(u*Math.PI),-.42+.48*u,v*doorLen],8,22,paint,'Door skin');
surface(door,(u,v)=>{const z=v*doorLen+u*((c.roofFront-c.windFront-.12)*(1-v)-.04*v),top=c.roof-.78-.025*Math.pow((v-.45)*2,2);return [side*(-.11*u+.065*(1-u)),.06+u*top,z]},12,22,mats.glass,'Side window');
tube(door,[[doorX,-.37,.025],[doorX,.04,.025],[doorX,.05,doorLen],[doorX,-.37,doorLen],[doorX,-.37,.025]],.002,mats.dark,'Door seam');
box(door,[side*.075,-.03,1.04],[.025,.025,.15],mats.chrome,.012,'Door handle');
box(door,[-side*.006,-.18,.63],[.035,.27,1.1],mats.inner,.025,'Interior door card');box(door,[-side*.045,-.12,.70],[.045,.04,.22],mats.trim,.014,'Interior door pull');
const mirror=box(door,[side*.19,.16,.13],[.21,.11,.22],paint,.045,'Wing mirror');box(door,[side*.19,.16,.245],[.16,.07,.01],mats.chrome,.012,'Mirror glass');bar(door,[0,.09,.12],[side*.15,.14,.13],.025,.025,mats.dark);
car.userData.doors??=[];car.userData.doors.push({group:door,side});
}
// Trim lines, hood seams, wipers, fuel cap and side fender vents.
for(const side of [-1,1]){
tube(car,[[side*.55,deck(-L+.16)+.04,-L+.16],[side*.57,deck(-1.45)+.055,-1.45],[side*.59,deck(c.windFront)+.055,c.windFront]],.002,mats.dark,'Hood panel gap');
if(shape==='supra'){box(car,[side*(width(.81)+.006),.59,.81],[.018,.13,.24],mats.dark,.028,'A80 rear side intake');}else{box(car,[side*(hw+.005),.76,shape==='gtr'?-.96:-.82],[.012,shape==='gtr'?.10:.045,shape==='gtr'?.16:.20],mats.dark,.012,'Fender vent');}
bar(car,[side*.07,.94,c.windFront-.01],[side*.55,.96,c.windFront+.04],.012,.012,mats.dark);
}
let cap=addMesh(car,new THREE.CircleGeometry(.082,32),paint,'Fuel cap');cap.rotation.y=-Math.PI/2;cap.position.set(-width(1.05)-.004,.76,1.05);
// Model-specific lamps and signature rear ends.
const brakeMaterials=[];
if(shape==='supra'){
for(const side of [-1,1]){surface(car,(u,v)=>{const angle=u*Math.PI*2,x=side*(.565+Math.cos(angle)*.255*v),z=-L+.255+Math.sin(angle)*.145*v;return [x,hoodHeight(x,z)+.02,z]},48,12,mats.lamp,'A80 elliptical headlight');const lensRim=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,x=side*(.565+Math.cos(a)*.255),z=-L+.255+Math.sin(a)*.145;lensRim.push([x,hoodHeight(x,z)+.023,z]);}tube(car,lensRim,.003,mats.dark,'A80 headlight seal');
for(let k=0;k<3;k++){const x=side*(.38+k*.14),z=-L+.19+k*.035,lens=addMesh(car,new THREE.SphereGeometry(.040-k*.005,20,12),mats.white);lens.scale.set(1,.38,.8);lens.position.set(x,hoodHeight(x,z)+.031,z);}
for(let k=0;k<2;k++){const tm=mats.tail.clone();brakeMaterials.push(tm);roundLamp(car,side*(.42+k*.23),.68,L-.005,k===0?.085:.071,tm);roundLamp(car,side*(.42+k*.23),.68,L+.012,k===0?.037:.03,mats.dark);}
}
for(const side of [-1,1]){tube(car,[[side*.68,.82,1.45],[side*.69,1.05,1.54],[side*.71,1.27,1.67]],.048,paint,'Curved A80 wing support');}
surface(car,(u,v)=>{const x=(u*2-1)*.84;return [x,1.28+.035*Math.pow(x/.84,2)+.015*Math.sin(v*Math.PI),1.56+v*.25]},30,8,paint,'A80 sculpted rear wing');
}else if(shape==='gtr'){
for(const side of [-1,1]){flushHeadlight(side,[[.47,-L+.035],[.82,-L+.17],[.76,-L+.55],[.62,-L+.38]]);
tube(car,[[side*.48,.72,-L+.045],[side*.69,.75,-L+.048],[side*.75,.90,-L+.065]],.012,mats.white,'LED signature');
for(let k=0;k<2;k++){const tm=mats.tail.clone();brakeMaterials.push(tm);roundLamp(car,side*(.40+k*.25),.73,L+.005,.092,tm);roundLamp(car,side*(.40+k*.25),.73,L+.023,.053,mats.dark);}
bar(car,[side*.57,.85,1.72],[side*.57,1.11,1.80],.06,.09,paint);}
box(car,[0,1.13,1.80],[1.64,.06,.24],paint,.025,'R35 rear wing');
}else{
for(const side of [-1,1]){flushHeadlight(side,[[.35,-L+.015],[.80,-L+.12],[.75,-L+.40],[.54,-L+.24]]);const x=side*.64,z=-L+.20,projector=addMesh(car,new THREE.SphereGeometry(.038,20,12),mats.white);projector.scale.set(1,.38,.8);projector.position.set(x,hoodHeight(x,z)+.031,z);const line=[[side*.38,-L+.047],[side*.58,-L+.075],[side*.76,-L+.16]].map(([xx,zz])=>[xx,hoodHeight(xx,zz)+.024,zz]);tube(car,line,.007,mats.white,'LED running light');
const tm=mats.tail.clone();brakeMaterials.push(tm);const tail=panel(car,[[side*.31,.61],[side*.80,.63],[side*.77,.83],[side*.36,.79]],mats.dark);tail.position.z=L-.01;roundLamp(car,side*.59,.715,L+.015,.068,tm);roundLamp(car,side*.59,.715,L+.032,.037,mats.dark);tube(car,[[side*.35,.64,L+.02],[side*.48,.64,L+.02],[side*.75,.67,L+.02]],.012,tm,'Rear LED line');
}
box(car,[0,.87,1.84],[1.40,.045,.14],paint,.025,'GT86 deck spoiler');
}
car.userData.brakeMaterials=brakeMaterials;
for(const side of [-1,1])for(let k=0;k<(shape==='gtr'?2:1);k++){const exhaust=addMesh(car,new THREE.CylinderGeometry(.055,.055,.15,24,1,true),mats.chrome,'Exhaust tip');exhaust.rotation.x=Math.PI/2;exhaust.position.set(side*(.66+k*.13),.28,L+.035);roundLamp(car,side*(.66+k*.13),.28,L+.113,.043,mats.dark);}
decal(car,shape==='gt86'?'86':shape==='gtr'?'GT-R':'SUPRA',[0,.55,L+.015],.42,.11,'#cdd0d4','#14171a',60);
const frontPlate=decal(car,'APEX  /  86',[0,.305,-L-.032],.38,.08,'#b7bcc1','#17191b',48);frontPlate.rotation.y=Math.PI;
const badge=decal(car,shape==='gtr'?'NISSAN':'TOYOTA',[0,.80,-L+.013],.13,.028,'#c5cace',null,45);badge.rotation.y=Math.PI;
// Interior: seats, center tunnel, instruments, controls, pedals and steering.
const interior=new THREE.Group();interior.name='Detailed cockpit';car.add(interior);car.userData.interior=interior;
box(interior,[0,.30,.15],[1.50,.06,1.95],mats.carpet,.015,'Cabin floor');
for(const side of [-1,1])seat(interior,side*.39,.33,c);
box(interior,[0,.48,.18],[.22,.30,1.38],mats.inner,.035,'Center tunnel');box(interior,[0,.66,.12],[.18,.04,.31],mats.trim,.014,'Shifter bezel');
bar(interior,[0,.67,.08],[0,.79,.05],.015,.015,mats.chrome);let knob=addMesh(interior,new THREE.SphereGeometry(.037,16,12),mats.leather,'Gear knob');knob.position.set(0,.80,.05);
box(interior,[.1,.65,.38],[.035,.035,.23],mats.dark,.012,'Handbrake');
box(interior,[0,.80,-.64],[1.45,.24,.35],mats.inner,.07,'Dashboard');box(interior,[0,.94,-.63],[1.40,.06,.26],mats.leather,.03,'Dash top');
const screen=decal(interior,'86  ·  DRIVE',[.13,.845,-.447],.25,.13,'#96c5c6','#0a1115',41);screen.rotation.x=-.15;
for(const x of [-.63,.62,.29,-.14]){box(interior,[x,.86,-.441],[.12,.07,.015],mats.dark,.02,'Air vent');for(let k=0;k<4;k++)box(interior,[x-.043+k*.028,.86,-.429],[.008,.05,.005],mats.trim,.002);}
for(let k=0;k<3;k++){const dial=addMesh(interior,new THREE.CylinderGeometry(.027,.027,.025,20),mats.silver,'Climate dial');dial.rotation.x=Math.PI/2;dial.position.set(-.04+k*.085,.735,-.432);}
const steering=new THREE.Group();steering.position.set(-.40,.82,-.29);steering.rotation.x=-.28;interior.add(steering);car.userData.steering=steering;
addMesh(steering,new THREE.TorusGeometry(.157,.021,10,48),mats.leather,'Leather steering wheel');box(steering,[0,0,0],[.15,.10,.05],mats.inner,.03,'Steering hub');for(const a of [0,Math.PI,Math.PI*1.5])bar(steering,[0,0,0],[Math.cos(a)*.145,Math.sin(a)*.145,0],.025,.025,mats.trim);
const gauges=decal(interior,'0   1   2   3   4   5   6   7',[ -.4,.906,-.44],.30,.10,'#e2e9e5','#0b0e10',31);gauges.rotation.x=-.2;
for(let k=0;k<3;k++){const dial=roundLamp(interior,-.53+k*.13,.906,-.431,k===1?.054:.038,mats.dark);tube(interior,[[-.53+k*.13,.906,-.411],[-.53+k*.13+.025,.925,-.411]],.003,mats.white);}
for(let k=0;k<3;k++){const pedal=box(interior,[-.54+k*.12,.37,-.69],[.065,.11,.025],mats.silver,.008,'Metal pedal');pedal.rotation.x=-.25;}
box(interior,[0,.49,1.00],[1.25,.17,.37],mats.leather,.055,'Rear seat cushion');box(interior,[0,.66,1.12],[1.25,.35,.12],mats.leather,.04,'Rear backrest');
const wheels=[];for(const side of [-1,1])for(const z of [c.front,c.rear]){const pivot=new THREE.Group();pivot.position.set(side*(c.width/2-.055),c.radius,z);const w=wheel(c,side,z,lod);w.position.set(0,0,0);pivot.add(w);car.add(pivot);wheels.push({pivot,wheel:w,front:z<0,side});}car.userData.wheels=wheels;
car.userData.driverEye=new THREE.Vector3(-.40,1.085,.23);car.userData.driverTarget=new THREE.Vector3(-.32,.96,-2.7);
return car;
}
export function animateCar(car,{wheel=0,steer=0,brake=false,doors=0,roof=true}={}){for(const w of car.userData.wheels){w.wheel.rotation.x=wheel;w.pivot.rotation.y=w.front?steer:0;}for(const d of car.userData.doors)d.group.rotation.y=d.side*doors;car.userData.roof.visible=roof;for(const m of car.userData.brakeMaterials)m.emissiveIntensity=brake?2.5:.45;car.userData.steering.rotation.z=-steer*2.7;}




