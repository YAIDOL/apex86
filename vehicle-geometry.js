import * as THREE from 'three';

const clamp=THREE.MathUtils.clamp;
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
const smoothMax=(a,b,k=.035)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.max(a,b)+h*h*k*.25;};

function sampleProfile(z,length,values){
  const f=clamp((z+length/2)/length,0,.999999)*(values.length-1);
  const i=Math.floor(f),t=f-i;
  const p0=values[Math.max(0,i-1)],p1=values[i],p2=values[Math.min(values.length-1,i+1)],p3=values[Math.min(values.length-1,i+2)];
  return .5*(2*p1+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
}

const profiles={
  gt86:{width:[.86,.96,1.005,.99,.96,.98,1.01,1.015,.965,.89],top:[.64,.74,.81,.855,.875,.87,.85,.83,.775,.71],exponent:4.4},
  supra:{width:[.84,.95,1.0,.98,.955,.98,1.045,1.055,.965,.87],top:[.63,.72,.79,.83,.85,.845,.865,.875,.81,.72],exponent:3.8},
  gtr:{width:[.95,.99,1.015,.995,.97,.99,1.035,1.04,.99,.95],top:[.74,.83,.89,.93,.955,.95,.94,.93,.87,.795],exponent:5.2}
};

/** One shared sampling model drives the shell, doors, glass and optics. */
export function vehicleShape(c){
  const p=profiles[c.id],L=c.length/2,n=p.exponent,bottom=.19;
  const width=z=>c.width/2*sampleProfile(z,c.length,p.width);
  const top=z=>sampleProfile(z,c.length,p.top);
  const cabin=z=>smooth(c.windFront+.025,c.windFront+.23,z)*(1-smooth(c.windRear-.22,c.windRear-.025,z));
  function sideHeight(z){
    const mid=(top(z)+bottom)/2;
    let result=mid;
    for(const axle of [c.front,c.rear]){
      const radius=c.radius+.045,d=z-axle;
      if(Math.abs(d)<radius)result=smoothMax(result,c.radius+Math.sqrt(radius*radius-d*d)+.025);
    }
    return Math.min(top(z)-.035,result);
  }
  function ring(z,theta){
    const co=Math.cos(theta),si=Math.sin(theta),w=width(z);
    const x=w*Math.sign(co)*Math.pow(Math.abs(co),2/n);
    const sy=sideHeight(z);
    let y=si>=0?sy+(top(z)-sy)*Math.pow(si,2/n):sy-(sy-bottom)*Math.pow(-si,2/n);
    if(si>0){
      const lateral=Math.abs(x)/w;
      const fender=.025*Math.exp(-Math.pow((lateral-.78)/.17,2))*Math.pow(si,.4);
      y+=fender;
      y-=cabin(z)*(top(z)-.335)*(1-smooth(.68,.84,lateral))*Math.pow(si,.5);
    }
    return [x,y,z];
  }
  function topAt(x,z){
    const edgeZ=clamp(z,-L+.18,L-.18);
    if(edgeZ!==z){const q=Math.sqrt(Math.max(.000001,1-Math.pow((z-edgeZ)/.18,2))),cy=(top(edgeZ)+bottom)/2;return cy+(topAt(x/q,edgeZ)-cy)*q;}
    const w=width(z),co=Math.pow(clamp(Math.abs(x)/w,0,1),n/2),theta=Math.acos(co);
    return ring(z,x<0?Math.PI-theta:theta)[1];
  }
  function sideAt(z,y,side=1){
    let lo=-Math.PI/2+.001,hi=1.0;
    for(let i=0;i<22;i++){const m=(lo+hi)/2;if(ring(z,m)[1]<y)lo=m;else hi=m;}
    const q=ring(z,(lo+hi)/2);return [side*q[0],q[1],z];
  }
  function faceAt(x,y,side=-1,offset=.003){
    const z=side*(L-.18),w=width(z),cy=(top(z)+bottom)/2,ry=(top(z)-bottom)/2;
    const target=Math.atan2(y-cy,Math.abs(x));let lo=-Math.PI/2,hi=Math.PI/2;
    for(let i=0;i<25;i++){const m=(lo+hi)/2,p=ring(z,m);if(Math.atan2(p[1]-cy,p[0])<target)lo=m;else hi=m;}
    const edge=ring(z,(lo+hi)/2),q=clamp(Math.hypot(x,y-cy)/Math.hypot(edge[0],edge[1]-cy),0,.999);
    return [x,y,side*(L-.18+.18*Math.sqrt(1-q*q)+offset)];
  }
  const roofWidth=z=>c.id==='gtr'?.635:c.id==='supra'?.61:.60;
  const roofAt=(u,z)=>[(u*2-1)*roofWidth(z),c.roof+(c.id==='supra'?.035:.022)*Math.sin(clamp((z-c.roofFront)/(c.roofRear-c.roofFront),0,1)*Math.PI)-.042*Math.pow(u*2-1,2),z];
  const windowBottom=(side,z)=>{const x=side*width(z)*.875;return [x,topAt(x,z)+.008,z];};
  const sideWindow=(side,u,v)=>{
    const bottomZ=THREE.MathUtils.lerp(c.windFront,c.windRear,v),topZ=THREE.MathUtils.lerp(c.roofFront,c.roofRear,v);
    const b=windowBottom(side,bottomZ),t=roofAt(side>0?1:0,topZ);
    return [THREE.MathUtils.lerp(b[0],t[0],u),THREE.MathUtils.lerp(b[1],t[1]-.009,u),THREE.MathUtils.lerp(b[2],t[2],u)];
  };
  return {width,top,ring,topAt,sideAt,faceAt,roofAt,roofWidth,windowBottom,sideWindow,L};
}

/** Closed indexed shell: caps share the exact same boundary vertices. */
export function bodyGeometry(c,shape,lod=false){
  const radial=lod?48:112,rows=lod?96:256,capRows=lod?8:18;
  const positions=[],indices=[],uv=[];
  const front=-shape.L+.18,rear=shape.L-.18;
  for(let row=0;row<=rows;row++){
    const z=THREE.MathUtils.lerp(front,rear,row/rows);
    for(let j=0;j<radial;j++){
      positions.push(...shape.ring(z,j/radial*Math.PI*2));uv.push(j/radial,row/rows);
      if(row<rows){const a=row*radial+j,next=row*radial+(j+1)%radial,b=a+radial,bn=next+radial;indices.push(a,next,b,next,bn,b);}
    }
  }
  for(const side of [-1,1]){
    const z=side<0?front:rear,cy=(shape.top(z)+.19)/2;
    let previous=Array.from({length:radial},(_,j)=>(side<0?0:rows*radial)+j);
    for(let r=1;r<capRows;r++){
      const q=1-r/capRows,current=[];
      for(let j=0;j<radial;j++){
        const outer=shape.ring(z,j/radial*Math.PI*2),id=positions.length/3;
        positions.push(outer[0]*q,cy+(outer[1]-cy)*q,z+side*.18*Math.sqrt(1-q*q));uv.push(j/radial,side<0?0:1);current.push(id);
      }
      for(let j=0;j<radial;j++){const k=(j+1)%radial,a=previous[j],an=previous[k],b=current[j],bn=current[k];if(side<0)indices.push(a,b,an,an,b,bn);else indices.push(a,an,b,an,bn,b);}
      previous=current;
    }
    const center=positions.length/3;positions.push(0,cy,side*shape.L);uv.push(.5,side<0?0:1);
    for(let j=0;j<radial;j++){const k=(j+1)%radial;if(side<0)indices.push(previous[j],center,previous[k]);else indices.push(previous[j],previous[k],center);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}

/** A genuinely solid curved roof, with a 25 mm return around every edge. */
export function roofGeometry(c,shape,lod=false){
  const nu=lod?18:40,nv=lod?16:40,positions=[],uv=[],indices=[],count=(nu+1)*(nv+1);
  for(let layer=0;layer<2;layer++)for(let j=0;j<=nv;j++)for(let i=0;i<=nu;i++){
    const p=shape.roofAt(i/nu,THREE.MathUtils.lerp(c.roofFront,c.roofRear,j/nv));p[1]-=layer*.025;positions.push(...p);uv.push(i/nu,j/nv);
    if(i<nu&&j<nv){const a=layer*count+j*(nu+1)+i,b=a+nu+1;if(layer===0)indices.push(a,b,a+1,a+1,b,b+1);else indices.push(a,a+1,b,a+1,b+1,b);}
  }
  const boundary=[];for(let i=0;i<=nu;i++)boundary.push(i);for(let j=1;j<=nv;j++)boundary.push(j*(nu+1)+nu);for(let i=nu-1;i>=0;i--)boundary.push(nv*(nu+1)+i);for(let j=nv-1;j>0;j--)boundary.push(j*(nu+1));
  for(let k=0;k<boundary.length;k++){const a=boundary[k],b=boundary[(k+1)%boundary.length];indices.push(a,b,a+count,b,b+count,a+count);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}

export function projectedShape(shape2D,project,segments=32){
  let geometry=new THREE.ShapeGeometry(shape2D,segments);
  // Curved decals need interior vertices; boundary-only triangles cut into the body.
  for(let pass=0;pass<3;pass++){
    const points=Array.from(geometry.attributes.position.array),idx=Array.from(geometry.index.array),next=[],cache=new Map();
    const mid=(a,b)=>{const key=a<b?a+':'+b:b+':'+a;if(cache.has(key))return cache.get(key);const id=points.length/3;for(let k=0;k<3;k++)points.push((points[a*3+k]+points[b*3+k])/2);cache.set(key,id);return id;};
    for(let i=0;i<idx.length;i+=3){const a=idx[i],b=idx[i+1],c=idx[i+2],ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);next.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}
    geometry.dispose();geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setIndex(next);
  }
  const p=geometry.attributes.position;
  const uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i),p.getY(i));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  for(let i=0;i<p.count;i++){const q=project(p.getX(i),p.getY(i));p.setXYZ(i,...q);}
  geometry.computeVertexNormals();return geometry;
}

export function closedOutline(points){
  const s=new THREE.Shape();s.moveTo(...points[0]);
  for(let i=0;i<points.length;i++){
    const previous=points[i],next=points[(i+1)%points.length],after=points[(i+2)%points.length];
    const a=[THREE.MathUtils.lerp(previous[0],next[0],.86),THREE.MathUtils.lerp(previous[1],next[1],.86)];
    const b=[THREE.MathUtils.lerp(next[0],after[0],.14),THREE.MathUtils.lerp(next[1],after[1],.14)];
    s.lineTo(...a);s.quadraticCurveTo(...next,...b);
  }
  s.closePath();return s;
}
