import * as THREE from 'three';
import {mergeGeometries} from './vendor/addons/utils/BufferGeometryUtils.js';
import {createCar} from './cars.js';

export function createTrafficModel(index,color){
  const original=createCar(index,{color,lod:true});original.updateMatrixWorld(true);
  const groups=new Map(),opaqueGlass=new Map();
  original.traverse(part=>{
    if(!part.isMesh)return;
    let material=part.material;
    if(material.transparent){
      if(material.opacity<.5)return;
      if(!opaqueGlass.has(material.uuid)){const m=material.clone();m.transparent=false;m.opacity=1;m.depthWrite=true;opaqueGlass.set(material.uuid,m);}
      material=opaqueGlass.get(material.uuid);
    }
    if(!groups.has(material.uuid))groups.set(material.uuid,{material,geometries:[]});
    let geometry=part.geometry.clone().applyMatrix4(part.matrixWorld);
    if(geometry.index){const flat=geometry.toNonIndexed();geometry.dispose();geometry=flat;}
    // Untextured projected trim and standard primitives use the same attribute set.
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    for(const key of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(key))geometry.deleteAttribute(key);
    groups.get(material.uuid).geometries.push(geometry);
  });
  const result=new THREE.Group();result.name='Complete traffic car';
  for(const {material,geometries} of groups.values()){
    const combined=mergeGeometries(geometries,false);if(!combined)throw new Error('Traffic geometry could not be combined');
    const mesh=new THREE.Mesh(combined,material);mesh.castShadow=true;mesh.receiveShadow=true;result.add(mesh);geometries.forEach(g=>g.dispose());
  }
  return result;
}
