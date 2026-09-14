import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const required = [
  'courses/villarceaux/course.json',
  'courses/villarceaux/holes/hole-01/hole.json',
  'courses/villarceaux/holes/hole-01/scene/surfaces.json',
  'courses/villarceaux/holes/hole-01/scene/cameras.json',
  'courses/villarceaux/holes/hole-01/references/index.json',
  'apps/web-demo/src/main.ts',
  'packages/viewer/src/index.ts',
];

for (const rel of required) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    throw new Error(`Fichier obligatoire absent: ${rel}`);
  }
}

const hole = JSON.parse(fs.readFileSync(path.join(root, 'courses/villarceaux/holes/hole-01/hole.json'), 'utf8'));
const allowed = new Set(['measured', 'documented', 'observed', 'estimated', 'unknown']);

const visit = (value) => {
  if (!value || typeof value !== 'object') return;
  if ('status' in value) {
    if (!allowed.has(value.status)) {
      throw new Error(`Statut invalide détecté: ${value.status}`);
    }
    if (value.status === 'unknown' && value.value !== null) {
      throw new Error('Les champs unknown doivent avoir value=null');
    }
  }
  for (const item of Object.values(value)) visit(item);
};

visit(hole);

console.log('Validation données trou 01 : OK');
