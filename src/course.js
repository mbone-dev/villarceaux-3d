import * as THREE from 'three';
export function inside(x,z,p){let b=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],c=p[j];if((a[1]>z)!=(c[1]>z)&&x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0])b=!b}return b}
export function edge(x,z,p){let d=Infinity;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dz=b[1]-a[1],t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1);d=Math.min(d,Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz))}return d}
export function prepareCourse(grid,original){
 const polygons={};for(const [name,points]of Object.entries(original.polygons)){const reflected=points.map(([x,z])=>[-x,z]);polygons[name]=name==='road'?reflected:new THREE.CatmullRomCurve3(reflected.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal').getPoints(points.length*5).slice(0,-1).map(v=>[v.x,v.z])}
 const {nx,nz,step,elevations:e}=grid;
 function raw(x,z){let u=THREE.MathUtils.clamp((-x-grid.xmin)/step,0,nx-1.001),v=THREE.MathUtils.clamp((z-grid.zmin)/step,0,nz-1.001),i=Math.floor(u),j=Math.floor(v);u-=i;v-=j;return THREE.MathUtils.lerp(THREE.MathUtils.lerp(e[j*nx+i],e[j*nx+i+1],u),THREE.MathUtils.lerp(e[(j+1)*nx+i],e[(j+1)*nx+i+1],u),v)}
 const base=raw(0,0),bunkers=[polygons.bunker_left,polygons.bunker_right];
 const bounds=bunkers.map(p=>[Math.min(...p.map(a=>a[0]))-3,Math.max(...p.map(a=>a[0]))+3,Math.min(...p.map(a=>a[1]))-3,Math.max(...p.map(a=>a[1]))+3]);
 function height(x,z){let h=raw(x,z)-base;const tee=1-THREE.MathUtils.smoothstep(Math.max(Math.abs(x)/5.5,Math.abs(z+1)/11),.72,1.1);h=THREE.MathUtils.lerp(h,.013*z,tee);for(let i=0;i<2;i++){const b=bounds[i];if(x<b[0]||x>b[1]||z<b[2]||z>b[3])continue;const d=edge(x,z,bunkers[i]);h+=inside(x,z,bunkers[i])?-1.05*(1-Math.exp(-d*1.05)):.12*Math.exp(-d*d/.6)}return h}
 function roadX(z){const p=polygons.road;for(let i=0;i<p.length-1;i++)if(z<=p[i][1]&&z>=p[i+1][1])return THREE.MathUtils.lerp(p[i][0],p[i+1][0],(z-p[i][1])/(p[i+1][1]-p[i][1]));return z>p[0][1]?p[0][0]:p.at(-1)[0]}
 // Representative placements from ground references, not surveyed individual trees.
 const trees=[];let state=1821;const random=()=>((state=Math.imul(state,1664525)+1013904223>>>0)/4294967296);
 for(let z=-30;z<450;z+=11)for(let x=30;x<130;x+=13){if(random()<.22)continue;trees.push({x:x+random()*5,z:z+random()*5,h:14+random()*9,kind:random()<.3?'ash':'oak'})}
 for(let i=0;i<17;i++)trees.push({x:-10.5-Math.max(0,i-7)*1.1,z:-12+i*6,h:13+random()*4,kind:'screen'});
 for(let i=0;i<6;i++)trees.push({x:roadX(45+i*45)+7,z:45+i*45,h:23+i%2*3,kind:'column'});
 for(let i=0;i<4;i++)trees.push({x:24-i*17,z:378+i%2*2,h:19+i%2*2,kind:'bare'});
 for(let i=0;i<19;i++)trees.push({x:roadX(105+i*13)+7,z:105+i*13,h:7+random()*4,kind:'screen'});
 return{height,raw,base,polygons,roadX,trees,grid};
}