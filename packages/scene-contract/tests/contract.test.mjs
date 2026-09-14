import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const holePath = path.join(root, 'courses/villarceaux/holes/hole-01/hole.json');

test('hole-01 utilise les statuts attendus', () => {
  const hole = JSON.parse(fs.readFileSync(holePath, 'utf8'));
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

  check(hole);
});
