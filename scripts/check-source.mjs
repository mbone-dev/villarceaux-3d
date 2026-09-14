import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {prepareCourse} from '../src/course.js';
const data=JSON.parse(await readFile(new URL('../data/course-layout.json',import.meta.url)));
const fake={nx:29,nz:56,step:10,xmin:-140,zmin:-70,elevations:Array.from({length:1624},(_,i)=>100+(i%29)*.15+Math.floor(i/29)*.05)};
const course=prepareCourse(fake,data);
const camera=new THREE.PerspectiveCamera(57,16/9,.1,1000);camera.position.set(0,2,0);camera.lookAt(0,2,100);camera.updateMatrixWorld();
assert(new THREE.Vector3(course.roadX(100),2,100).project(camera).x>0,'La route doit être à droite sur l’écran depuis le départ');
for(let z=-65;z<460;z+=2){const x=course.roadX(z);assert(Number.isFinite(course.height(x,z)));assert(x<0)}
for(const [x,z]of course.polygons.green)assert(Number.isFinite(course.height(x,z)));
assert.equal(course.grid.elevations.length,1624);
console.log('Repères, terrain, position de la route : contrôles passés. Ceci ne valide pas le rendu visuel.');
