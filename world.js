import * as THREE from 'three';
const roadCenter=(d,z)=>Math.sin((d-z)*.0032)*9-Math.sin(d*.0032)*9;
function mesh(parent,g,m,p){const a=new THREE.Mesh(g,m);if(p)a.position.set(...p);a.receiveShadow=true;parent.add(a);return a;}
export function createWorld(){
 const world=new THREE.Group();world.name='Coastal highway';
 const asphalt=document.createElement('canvas');asphalt.width=asphalt.height=256;const ctx=asphalt.getContext('2d'),im=ctx.createImageData(256,256);let seed=68;for(let i=0;i<im.data.length;i+=4){seed=(1664525*seed+1013904223)>>>0;const v=39+(seed>>>28);im.data[i]=v;im.data[i+1]=v+1;im.data[i+2]=v+3;im.data[i+3]=255;}ctx.putImageData(im,0,0);const tex=new THREE.CanvasTexture(asphalt);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.repeat.set(2,160);tex.colorSpace=THREE.SRGBColorSpace;
 const roadMat=new THREE.MeshStandardMaterial({map:tex,roughness:.95,color:'#c5c2c3'}),edgeMat=new THREE.MeshStandardMaterial({color:'#545c57',roughness:.9}),lineMat=new THREE.MeshStandardMaterial({color:'#d9dbd3',roughness:.8}),grass=new THREE.MeshStandardMaterial({color:'#263c2c',roughness:1});
 const surfaces=[];function strip(x1,x2,mat,y){const n=220,p=[],ind=[],uv=[];for(let i=0;i<=n;i++){const z=30-i*4.5;p.push(x1,y,z,x2,y,z);uv.push(0,i/n,1,i/n);if(i<n){const a=i*2;ind.push(a,a+1,a+2,a+1,a+3,a+2);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();mesh(world,geo,mat);surfaces.push({geo,x1,x2,n});}
 strip(-4.9,4.9,edgeMat,-.013);strip(-3.95,3.95,roadMat,.003);strip(-3.70,-3.61,lineMat,.012);strip(3.61,3.70,lineMat,.012);strip(-45,-4.9,grass,-.08);strip(4.9,100,grass,-.08);
 const dash=new THREE.InstancedMesh(new THREE.PlaneGeometry(.11,3.5),lineMat,95);dash.rotation.x=-Math.PI/2;world.add(dash);
 const railMat=new THREE.MeshStandardMaterial({color:'#747e80',roughness:.45,metalness:.55}),rails=new THREE.InstancedMesh(new THREE.BoxGeometry(.085,.18,5),railMat,360),posts=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.65,.1),railMat,360);world.add(rails,posts);
 const reflectorMat=new THREE.MeshStandardMaterial({color:'#f0a64f',emissive:'#ba5d1d',emissiveIntensity:.35});const reflectors=new THREE.InstancedMesh(new THREE.BoxGeometry(.11,.075,.06),reflectorMat,180);world.add(reflectors);
 const dummy=new THREE.Object3D();
 // Layered terrain silhouettes and a quiet coastal horizon.
 const ocean=mesh(world,new THREE.PlaneGeometry(1800,1800),new THREE.MeshStandardMaterial({color:'#385f6a',roughness:.42,metalness:.18}),[-950,-5,-500]);ocean.rotation.x=-Math.PI/2;
 const mountains=new THREE.Group();world.add(mountains);
 for(let layer=0;layer<3;layer++){const pts=[],indices=[];for(let i=0;i<=64;i++){const x=-700+i*24,y=12+Math.abs(Math.sin(i*.64+layer*2))*55+Math.sin(i*1.82)*12;pts.push(x,-8,-550-layer*160,x,y,-550-layer*160);if(i<64){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.setIndex(indices);g.computeVertexNormals();mesh(mountains,g,new THREE.MeshBasicMaterial({color:['#63767c','#73828a','#869298'][layer]}));}
 const trees=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,7),new THREE.MeshStandardMaterial({color:'#253a32',roughness:1}),420);trees.castShadow=true;world.add(trees);
 const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.15,.25,1,6),new THREE.MeshStandardMaterial({color:'#3b3630',roughness:1}),140);world.add(trunks);
 const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:'#4a5149',roughness:1}),100);rocks.castShadow=true;world.add(rocks);
 const terrainSeed=[];for(let i=0;i<140;i++)terrainSeed.push({side:i%4===0?-1:1,x:7+(Math.sin(i*93.3)*.5+.5)*36,z:-i*6.2+20,h:4+(Math.cos(i*23.1)*.5+.5)*7});
 const lampPoles=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.08,7,8),new THREE.MeshStandardMaterial({color:'#313d40',roughness:.6,metalness:.5}),28),lampHeads=new THREE.InstancedMesh(new THREE.BoxGeometry(.28,.07,.85),new THREE.MeshStandardMaterial({color:'#ffe5b4',emissive:'#ffd298',emissiveIntensity:1.5}),28);world.add(lampPoles,lampHeads);
 const sky=mesh(world,new THREE.SphereGeometry(1700,32,20),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{top:{value:new THREE.Color('#547b92')},bottom:{value:new THREE.Color('#ecd2b5')}},vertexShader:'varying vec3 vWorld; void main(){vWorld=(modelMatrix*vec4(position,1.0)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vWorld;uniform vec3 top;uniform vec3 bottom;void main(){float h=normalize(vWorld).y;gl_FragColor=vec4(mix(bottom,top,smoothstep(-.02,.62,h)),1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'}));
 mesh(world,new THREE.SphereGeometry(14,32,24),new THREE.MeshBasicMaterial({color:'#fff0cd',fog:false,toneMapped:false}),[-230,130,-850]);
 function update(distance){
  for(const s of surfaces){const a=s.geo.attributes.position;for(let i=0;i<=s.n;i++){const z=30-i*4.5,c=roadCenter(distance,z);a.setX(i*2,c+s.x1);a.setX(i*2+1,c+s.x2);}a.needsUpdate=true;s.geo.computeBoundingSphere();}
  tex.offset.y=-distance/990;
  for(let i=0;i<95;i++){const z=22-i*10+(distance%10);dummy.position.set(roadCenter(distance,z),-z,.019);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();dash.setMatrixAt(i,dummy.matrix);}dash.instanceMatrix.needsUpdate=true;
  for(let i=0;i<180;i++){const z=28-i*5+(distance%5);for(let side=0;side<2;side++){const idx=i*2+side,x=roadCenter(distance,z)+(side?4.55:-4.55);dummy.position.set(x,.62,z);dummy.rotation.set(0,Math.atan(Math.cos((distance-z)*.0032)*-.0288),0);dummy.scale.set(1,1,1);dummy.updateMatrix();rails.setMatrixAt(idx,dummy.matrix);dummy.position.y=.31;dummy.updateMatrix();posts.setMatrixAt(idx,dummy.matrix);}dummy.position.set(roadCenter(distance,z)+4.50,.66,z);dummy.rotation.set(0,0,0);dummy.updateMatrix();reflectors.setMatrixAt(i,dummy.matrix);}rails.instanceMatrix.needsUpdate=posts.instanceMatrix.needsUpdate=reflectors.instanceMatrix.needsUpdate=true;
  for(let i=0;i<140;i++){const a=terrainSeed[i],z=((a.z+distance+900)%900)-870,x=roadCenter(distance,z)+a.side*a.x;for(let k=0;k<3;k++){dummy.position.set(x,a.h*(.45+k*.2),z);dummy.scale.set(a.h*(.32-k*.06),a.h*.63,a.h*(.32-k*.06));dummy.rotation.set(0,i,0);dummy.updateMatrix();trees.setMatrixAt(i*3+k,dummy.matrix);}dummy.position.set(x,a.h*.25,z);dummy.scale.set(1,a.h*.5,1);dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);if(i<100){dummy.position.set(x+3,-.05,z+2);dummy.scale.set(1.5+a.h*.2,1+a.h*.15,2+a.h*.3);dummy.rotation.set(i*.4,i,i*.2);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}}
  trees.instanceMatrix.needsUpdate=trunks.instanceMatrix.needsUpdate=rocks.instanceMatrix.needsUpdate=true;
  for(let i=0;i<28;i++){const z=28-i*32+(distance%32),x=roadCenter(distance,z)+5.1;dummy.position.set(x,3.5,z);dummy.scale.set(1,1,1);dummy.rotation.set(0,0,0);dummy.updateMatrix();lampPoles.setMatrixAt(i,dummy.matrix);dummy.position.set(x-.2,7,z);dummy.updateMatrix();lampHeads.setMatrixAt(i,dummy.matrix);}lampPoles.instanceMatrix.needsUpdate=lampHeads.instanceMatrix.needsUpdate=true;
 }
 update(0);return {group:world,update,center:roadCenter};
}


