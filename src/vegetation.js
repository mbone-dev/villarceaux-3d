import * as THREE from 'three';
import {Tree} from '@dgreenheck/ez-tree';
export function buildVegetation(scene,course){
 const templates=new Map(),batches=new Map(),object=new THREE.Object3D();
 function template(kind,lod){
  const key=kind+lod;if(templates.has(key))return templates.get(key);
  const tree=new Tree();tree.loadPreset(kind==='screen'?'Pine Medium':kind==='column'?'Aspen Medium':kind==='ash'?'Ash Medium':'Oak Medium');tree.options.seed=kind.length*73+12;
  const o=tree.options;
  if(kind==='screen'){o.branch.children[0]=lod?22:40;o.branch.sections[0]=8;o.branch.sections[1]=4;o.branch.segments[1]=4;o.leaves.count=lod?8:14;o.leaves.size=2.7;o.branch.start[1]=.035}
  else{o.branch.children[0]=lod?3:6;o.branch.children[1]=lod?2:4;o.branch.children[2]=lod?2:3;o.leaves.count=lod?5:12}
  if(kind==='bare'){o.leaves.count=1;o.leaves.size=.04;o.branch.length[2]=9;o.branch.length[3]=5}
  tree.generate();const height=new THREE.Box3().setFromObject(tree).max.y;
  const parts=[{geometry:tree.branchesMesh.geometry,material:new THREE.MeshStandardMaterial({map:tree.branchesMesh.material.map,normalMap:tree.branchesMesh.material.normalMap,color:0xb6b09b,roughness:1})}];
  if(kind!=='bare')parts.push({geometry:tree.leavesMesh.geometry,material:new THREE.MeshStandardMaterial({map:tree.leavesMesh.material.map,color:kind==='screen'?0x84956c:0xbbc495,side:THREE.DoubleSide,alphaTest:.45,roughness:1})});
  const result={parts,height};templates.set(key,result);return result;
 }
 for(const tree of course.trees){const key=tree.kind+':'+Math.floor(tree.x/65)+':'+Math.floor(tree.z/65);if(!batches.has(key))batches.set(key,[]);batches.get(key).push(tree)}
 const chunks=[];for(const rows of batches.values()){const levels=[];for(let lod=0;lod<2;lod++){const source=template(rows[0].kind,lod),group=new THREE.Group();for(const part of source.parts){const mesh=new THREE.InstancedMesh(part.geometry,part.material,rows.length);rows.forEach((t,i)=>{object.position.set(t.x,course.height(t.x,t.z),t.z);object.rotation.set(0,t.x*t.z%6.28,0);const scale=t.h/source.height;object.scale.set(scale*(t.kind==='column'?.7:1),scale,scale*(t.kind==='column'?.7:1));object.updateMatrix();mesh.setMatrixAt(i,object.matrix)});mesh.computeBoundingSphere();mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh)}scene.add(group);levels.push(group)}chunks.push({levels,x:rows.reduce((s,t)=>s+t.x,0)/rows.length,z:rows.reduce((s,t)=>s+t.z,0)/rows.length})}
 return{update(camera,high=true){for(const c of chunks){const near=Math.hypot(c.x-camera.position.x,c.z-camera.position.z)<(high?115:65);c.levels[0].visible=near;c.levels[1].visible=!near}}};
}
export function buildDetails(scene,height){
 const wood=new THREE.MeshStandardMaterial({color:0xd0d0b9,roughness:.94});
 function beam(a,b,w=.12){const d=new THREE.Vector3().subVectors(b,a),mesh=new THREE.Mesh(new THREE.BoxGeometry(w,d.length(),w),wood);mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh)}
 // Right fence is longer; the supplied photo shows a short rail on the left.
 for(const [x,z0,z1]of[[-6,-10,14],[6,-3,3]]){for(let z=z0;z<=z1;z+=3){beam(new THREE.Vector3(x,height(x,z),z),new THREE.Vector3(x,height(x,z)+.8,z),.16);const cap=new THREE.Mesh(new THREE.ConeGeometry(.125,.14,4),wood);cap.rotation.y=Math.PI/4;cap.position.set(x,height(x,z)+.86,z);cap.castShadow=true;scene.add(cap)}beam(new THREE.Vector3(x,height(x,z0)+.6,z0),new THREE.Vector3(x,height(x,z1)+.6,z1),.11)}
 for(const x of [-3.4,3.4]){const marker=new THREE.Mesh(new THREE.BoxGeometry(.16,.16,.16),new THREE.MeshStandardMaterial({color:0xe4e6d6,roughness:.7}));marker.rotation.set(0,.3,Math.PI/4);marker.position.set(x,height(x,1)+.12,1);marker.castShadow=true;scene.add(marker)}
 const pin=new THREE.Group();pin.position.set(2,height(2,348),348);const pole=new THREE.Mesh(new THREE.CylinderGeometry(.015,.02,2.25,8),new THREE.MeshStandardMaterial({color:0xe1e1cd}));pole.position.y=1.125;pin.add(pole);
 const cloth=new THREE.PlaneGeometry(.6,.34,12,4);for(let i=0;i<cloth.attributes.position.count;i++)cloth.attributes.position.setZ(i,Math.sin(cloth.attributes.position.getX(i)*11)*.055);cloth.computeVertexNormals();const flag=new THREE.Mesh(cloth,new THREE.MeshStandardMaterial({color:0xbc2528,side:THREE.DoubleSide,roughness:.85}));flag.position.set(.3,2.06,0);pin.add(flag);scene.add(pin);
}