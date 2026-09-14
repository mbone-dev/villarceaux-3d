import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const filesToValidate = [
  'courses/villarceaux/holes/hole-01/hole.json',
  'courses/villarceaux/holes/hole-01/scene/surfaces.json',
  'courses/villarceaux/holes/hole-01/scene/landmarks.json',
];

test('hole-01 utilise les statuts attendus', () => {
  const statuses = new Set(['measured', 'documented', 'observed', 'estimated', 'unknown']);

  const check = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    if ('status' in obj) {
      assert.ok(statuses.has(obj.status), `Statut invalide: ${obj.status}`);
      if (obj.status === 'unknown') {
        assert.equal(obj.value, null, 'unknown doit utiliser value=null');
      }
    }
    for (const value of Object.values(obj)) check(value);
  };

  for (const relPath of filesToValidate) {
    const data = JSON.parse(fs.readFileSync(path.join(root, relPath), 'utf8'));
    check(data);
  }
});
