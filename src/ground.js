import * as THREE from 'three';
export async function loadMaterials(){
 const data=await fetch('/assets/materials.json').then(r=>{if(!r.ok)throw Error('Exécuter npm run assets avant la visite');return r.json()});
 const loader=new THREE.TextureLoader(),textures={};
 await Promise.all(Object.entries(data.materials).flatMap(([kind,material])=>Object.entries(material.maps).map(async([key,item])=>{const t=await loader.loadAsync('/assets/'+item.file);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(key==='color')t.colorSpace=THREE.SRGBColorSpace;textures[kind+key]=t})));
 return{textures,data};
}
export function buildGround(scene,course,t){
 const maskCanvas=document.createElement('canvas');maskCanvas.width=1400;maskCanvas.height=2750;const ctx=maskCanvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,1400,2750);
 function paint(points,color){ctx.beginPath();points.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo']((x+140)*5,(z+70)*5));ctx.closePath();ctx.fillStyle=color;ctx.fill()}
 const p=course.polygons;paint(p.fairway,'#ff0000');paint([[-4.4,-10],[4.4,-10],[4.4,8],[-4.4,8]],'#ff0000');paint(p.green,'#00ff00');paint(p.bunker_left,'#0000ff');paint(p.bunker_right,'#0000ff');const mask=new THREE.CanvasTexture(maskCanvas);mask.flipY=false;
 const geometry=new THREE.PlaneGeometry(280,550,280,550);geometry.rotateX(-Math.PI/2);geometry.translate(0,0,205);const pos=geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,course.height(pos.getX(i),pos.getZ(i)));geometry.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({roughness:1,normalMap:t.grassnormal});
 mat.onBeforeCompile=s=>{
  Object.assign(s.uniforms,{courseMask:{value:mask},grassColor:{value:t.grasscolor},sandColor:{value:t.sandcolor},sandNormal:{value:t.sandnormal}});
  s.vertexShader='varying vec3 vGround;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGround=position;');
  s.fragmentShader='varying vec3 vGround;uniform sampler2D courseMask,grassColor,sandColor,sandNormal;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec3 surface=texture2D(courseMask,vec2((vGround.x+140.)/280.,(vGround.z+70.)/550.)).rgb;
   vec2 grassUV=vGround.xz*.8;vec3 a=texture2D(grassColor,grassUV).rgb,b=texture2D(grassColor,grassUV*.387+vec2(17.2,5.9)).rgb;
   vec3 detail=mix(a,b,.22);float lum=dot(detail,vec3(.2126,.7152,.0722));float stripe=.96+.04*sin(vGround.z*.54+vGround.x*.085);
   vec3 rough=detail*vec3(.92,1.03,.79),fairway=mix(detail,vec3(lum),.35)*vec3(.87,1.04,.64)*stripe;
   vec3 grass=mix(rough,fairway,surface.r);grass=mix(grass,vec3(.145,.23,.048)*(.9+.2*lum),surface.g);
   vec3 sand=texture2D(sandColor,vGround.xz*.47).rgb;diffuseColor.rgb=mix(grass,sand*vec3(1.12,1.08,.98),surface.b);
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`
   vec3 gn=texture2D(normalMap,grassUV).xyz*2.-1.,sn=texture2D(sandNormal,vGround.xz*.47).xyz*2.-1.;
   vec3 tn=mix(gn,sn,surface.b);tn.xy*=mix(.8,.24,surface.g)*mix(1.,.48,surface.b);
   normal=normalize(getTangentFrame(-vViewPosition,normal,vGround.xz)*tn);
  `);
 };
 const mesh=new THREE.Mesh(geometry,mat);mesh.name='Villarceaux_terrain_metres';mesh.receiveShadow=true;scene.add(mesh);
 const surroundings=new THREE.Mesh(new THREE.PlaneGeometry(2500,2500),new THREE.MeshStandardMaterial({color:0x6d824c,roughness:1}));surroundings.rotation.x=-Math.PI/2;surroundings.position.set(0,-24,200);scene.add(surroundings);
 return mesh;
}
export function buildRoad(scene,course,t){
 function strip(width,lift,material){const positions=[],uv=[],idx=[];let row=0;for(let z=-65;z<=465;z+=2){const x=course.roadX(z),slope=(course.roadX(z+1)-course.roadX(z-1))*.5,k=1/Math.sqrt(1+slope*slope);for(const side of[-1,1]){const xx=x+side*width*.5*k,zz=z-side*width*.5*slope*k;positions.push(xx,course.height(xx,zz)+lift,zz);uv.push((side+1)*width*.25,z*.35)}if(row){let a=(row-1)*2,b=row*2;idx.push(a,b,a+1,a+1,b,b+1)}row++}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();const mesh=new THREE.Mesh(g,material);mesh.receiveShadow=true;scene.add(mesh);return mesh}
 strip(7.2,.05,new THREE.MeshStandardMaterial({map:t.sandcolor,color:0x9a9681,side:THREE.DoubleSide,roughness:1}));
 const road=strip(5.4,.1,new THREE.MeshStandardMaterial({map:t.roadcolor,normalMap:t.roadnormal,normalScale:new THREE.Vector2(.45,.45),roughness:.95,side:THREE.DoubleSide}));road.name='D142_cote_droit';return road;
}