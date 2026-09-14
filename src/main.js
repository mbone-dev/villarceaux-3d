import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {prepareCourse} from './course.js';
import {loadMaterials,buildGround,buildRoad} from './ground.js';
import {buildVegetation,buildDetails} from './vegetation.js';
const $=s=>document.querySelector(s);
function fail(error){$('#loading').hidden=true;$('#error').hidden=false;$('#error').textContent='La visite n’a pas démarré : '+error.message;console.error(error)}
window.addEventListener('unhandledrejection',e=>fail(e.reason));window.addEventListener('error',e=>fail(e.error||Error(e.message)));
start().catch(fail);
async function start(){
 const read=name=>fetch('/assets/'+name+'.json').then(r=>{if(!r.ok)throw Error('Données manquantes : lancer npm run assets.');return r.json()});
 const [grid,layout,{textures,data}]=await Promise.all([read('terrain-grid'),read('course-layout'),loadMaterials()]);
 const course=prepareCourse(grid,layout),height=course.height,scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0xc9d9df,.0012);
 const renderer=new THREE.WebGLRenderer({canvas:$('#world'),antialias:true,powerPreference:'high-performance'});let high=innerWidth>=700;renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.5:1));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.15,1600),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.498;controls.minDistance=2;controls.maxDistance=620;
 scene.add(new THREE.HemisphereLight(0xcce0ff,0x6b6946,1.2));
 const sun=new THREE.DirectionalLight(0xffefcd,3.2);sun.position.set(160,170,230);sun.target.position.set(0,0,110);sun.castShadow=true;sun.shadow.mapSize.set(high?4096:2048,high?4096:2048);Object.assign(sun.shadow.camera,{left:-110,right:110,top:110,bottom:-110,near:1,far:650});sun.shadow.normalBias=.05;sun.shadow.bias=-.00005;scene.add(sun,sun.target);
 const sky=new Sky();sky.scale.setScalar(1500);sky.material.uniforms.turbidity.value=2.5;sky.material.uniforms.rayleigh.value=1.7;sky.material.uniforms.sunPosition.value.copy(new THREE.Vector3(160,170,120).normalize());scene.add(sky);
 const terrain=buildGround(scene,course,textures),road=buildRoad(scene,course,textures);$('#loading').textContent='Création des arbres…';await new Promise(r=>setTimeout(r,0));const vegetation=buildVegetation(scene,course);buildDetails(scene,height);
 let progress=0,touring=false,transition=null,lastShadow=new THREE.Vector3(9999,9999,9999);
 const views={tee:[1,-7,1.75,10,105,1.5],fairway:[12,155,1.8,-3,300,1.5],approach:[-4,277,1.8,2,349,.8],green:[18,331,1.9,-3,362,.7],aerial:[125,120,155,-15,200,0]};
 const names={tee:'Depuis le départ',fairway:'Le fairway',approach:'L’approche',green:'Le green et ses arbres',aerial:'La D142 à droite du trou'};
 function stopTour(){touring=false;$('#tour').textContent='▶ Visiter'}
 function go(name,instant=false){stopTour();const [x,z,y,tx,tz,ty]=views[name],p=new THREE.Vector3(x,height(x,z)+y,z),target=new THREE.Vector3(tx,height(tx,tz)+ty,tz);if(instant){camera.position.copy(p);controls.target.copy(target)}else transition={from:camera.position.clone(),fromTarget:controls.target.clone(),p,target,t:0};progress=THREE.MathUtils.clamp(z/348*353,0,353);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));$('#caption').textContent=names[name];updateMap()}
 function along(){const z=progress/353*348,x=12*Math.sin(Math.PI*z/348);camera.position.set(x,height(x,z)+1.75,z);controls.target.set(x,height(x,z+40)+1.75,z+40);updateMap()}
 const ctx=$('#map').getContext('2d');
 function updateMap(){ctx.clearRect(0,0,160,340);function draw(p,color){ctx.beginPath();p.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo'](67-x*1.15,315-z*.78));ctx.closePath();ctx.fillStyle=color;ctx.fill()}draw(course.polygons.fairway,'#8ca669');draw(course.polygons.green,'#d0df9b');draw(course.polygons.bunker_left,'#e8d6b1');draw(course.polygons.bunker_right,'#e8d6b1');ctx.beginPath();course.polygons.road.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo'](67-x*1.15,315-z*.78));ctx.strokeStyle='#b9bbaf';ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(67-camera.position.x*1.15,315-camera.position.z*.78,4,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();$('#progress').value=progress;$('#travel').textContent=Math.round(progress)+' m';$('#distance').textContent=Math.round(353-progress)+' m'}
 document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>go(b.dataset.view));$('#tour').onclick=()=>{touring=!touring;transition=null;if(progress>351)progress=0;$('#tour').textContent=touring?'Ⅱ Pause':'▶ Visiter'};$('#progress').oninput=e=>{stopTour();transition=null;progress=+e.target.value;along()};
 $('#info').onclick=()=>$('#about').showModal();$('#close').onclick=()=>$('#about').close();$('#materials-credit').textContent='Textures : Poly Haven, CC0. '+Object.values(data.materials).map(m=>m.id).join(', ')+'. Végétation : EZ-Tree (MIT).';
 $('#quality').onclick=()=>{high=!high;renderer.setPixelRatio(Math.min(devicePixelRatio,high?1.5:1));$('#quality').textContent=high?'Qualité élevée':'Qualité mobile'};
 $('#export').onclick=async()=>{const {GLTFExporter}=await import('three/addons/exporters/GLTFExporter.js');const mesh=new THREE.Mesh(terrain.geometry.clone(),new THREE.MeshStandardMaterial({color:0x718749}));mesh.name='Villarceaux_IGN_metres';const result=await new GLTFExporter().parseAsync(mesh,{binary:true}),url=URL.createObjectURL(new Blob([result],{type:'model/gltf-binary'})),a=document.createElement('a');a.href=url;a.download='Villarceaux-terrain.glb';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
 go('tee',true);controls.update();vegetation.update(camera,high);renderer.render(scene,camera);$('#loading').hidden=true;
 const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(transition){transition.t+=dt/1.6;const t=THREE.MathUtils.smoothstep(transition.t,0,1);camera.position.lerpVectors(transition.from,transition.p,t);controls.target.lerpVectors(transition.fromTarget,transition.target,t);if(transition.t>=1)transition=null}else if(touring){progress=Math.min(353,progress+dt*8);along();if(progress>=353)stopTour()}controls.update();vegetation.update(camera,high);
 if(camera.position.distanceTo(lastShadow)>12){lastShadow.copy(camera.position);const aerial=camera.position.y>height(camera.position.x,camera.position.z)+40,extent=aerial?280:95;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent});sun.shadow.camera.updateProjectionMatrix();sun.target.position.set(camera.position.x,height(camera.position.x,camera.position.z),camera.position.z+35);sun.position.copy(sun.target.position).add(new THREE.Vector3(160,170,120))}renderer.render(scene,camera)});
 window.__courseReview={ready:true,roadOnRight:course.roadX(100)<0,treeCount:course.trees.length,terrainVertices:terrain.geometry.attributes.position.count};
}