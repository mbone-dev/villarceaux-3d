import {mkdir,writeFile,readFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const output=fileURLToPath(new URL('../public/assets/',import.meta.url));
await mkdir(output,{recursive:true});
async function request(url,options={}){const response=await fetch(url,{...options,signal:AbortSignal.timeout(90000)});if(!response.ok)throw new Error(url+': '+response.status+' '+(await response.text()).slice(0,700));return response}
const exists=async p=>{try{await access(p);return true}catch{return false}};
const json=(name,value)=>writeFile(output+name,JSON.stringify(value,null,2)+'\n');
// Preserve imported original data. Never silently replace a recovered grid.
if(!await exists(output+'terrain-grid.json')){
 const tee=[1.711045,49.115037],green=[1.70716,49.11686],metresLat=111320,metresLon=111320*Math.cos(tee[1]*Math.PI/180);
 const east=(green[0]-tee[0])*metresLon,north=(green[1]-tee[1])*metresLat,length=Math.hypot(east,north),de=east/length,dn=north/length;
 const lon=[],lat=[];for(let j=0;j<56;j++)for(let i=0;i<29;i++){const x=-140+i*10,z=-70+j*10;lon.push(+(tee[0]+(de*z+dn*x)/metresLon).toFixed(7));lat.push(+(tee[1]+(dn*z-de*x)/metresLat).toFixed(7))}
 const source=await (await request('https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:'ign_rge_alti_wld',lon:lon.join('|'),lat:lat.join('|'),delimiter:'|',zonly:'false'})})).json();
 const elevations=source.elevations?.map(p=>p.z);
 if(elevations?.length!==1624||!elevations.every(z=>Number.isFinite(z)&&z>0&&z<500))throw Error('Grille IGN invalide : aucune altitude de remplacement inventée.');
 await json('ign-elevations-source.json',source);
 await json('terrain-grid.json',{source:'IGN RGE ALTI',acquired:new Date().toISOString(),tee_lonlat:tee,green_lonlat:green,direction_east_north:[de,dn],length_m:length,xmin:-140,zmin:-70,step:10,nx:29,nz:56,elevations});
}
await writeFile(output+'course-layout.json',await readFile(new URL('../data/course-layout.json',import.meta.url)));
if(!await exists(output+'materials.json')){
 // Discover actual asset IDs from the provider catalogue, never assume a download URL exists.
 const catalogue=await (await request('https://api.polyhaven.com/assets?t=textures')).json();
 const choices={grass:{include:/grass/i,exclude:/rock|snow|moss|dirt|aerial/i},sand:{include:/sand/i,exclude:/stone|brick|rock|wood/i},road:{include:/asphalt/i,exclude:/paint|paver/i}};
 const manifest={provider:'Poly Haven',license:'CC0',licenseURL:'https://polyhaven.com/license',selected:new Date().toISOString(),materials:{}};
 for(const [kind,filter] of Object.entries(choices)){
  const candidates=Object.keys(catalogue).filter(id=>filter.include.test(id+' '+catalogue[id].name)&&!filter.exclude.test(id)).sort();
  if(!candidates.length)throw Error('Aucun matériau adapté pour '+kind);
  let selected=false;
  for(const id of candidates.slice(0,4)){
   const files=await (await request('https://api.polyhaven.com/files/'+id)).json();
   const pick=key=>{const aliases={diff:/^(diff|diffuse|albedo|color)$/i,nor_gl:/^(nor_gl|normal|normalgl|normal_gl)$/i,rough:/^(rough|roughness)$/i};const found=Object.keys(files).find(k=>aliases[key].test(k));return files[found]?.['1k']?.jpg||files[found]?.['1k']?.png};
   console.log('Matériau',id,'cartes disponibles',Object.keys(files).join(', '));
   if(!pick('diff')||!pick('nor_gl'))continue;
   const record={id,source:'https://polyhaven.com/a/'+id,maps:{}};
   for(const [map,key] of [['color','diff'],['normal','nor_gl'],['roughness','rough']]){
    const item=pick(key);if(!item){if(map==='roughness')continue;throw Error('Carte manquante')}
    const u=new URL(item.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.polyhaven.org'))throw Error('Hôte de matériau inattendu');
    const bytes=Buffer.from(await (await request(item.url)).arrayBuffer());const extension=new URL(item.url).pathname.endsWith('.png')?'png':'jpg';const filename=kind+'-'+map+'.'+extension;
    await writeFile(output+filename,bytes);record.maps[map]={file:filename,source:item.url,sha256:createHash('sha256').update(bytes).digest('hex')};
   }
   manifest.materials[kind]=record;selected=true;break;
  }
  if(!selected)throw Error('Matériau PBR complet introuvable pour '+kind);
 }
 await json('materials.json',manifest);
}
console.log('Données et textures disponibles dans public/assets. Consulter materials.json pour les sources exactes.');