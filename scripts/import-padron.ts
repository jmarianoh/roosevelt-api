// Uso: npx tsx scripts/import-padron.ts "<ruta al CSV>"   (el CSV nunca entra al repo)
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const db = new DatabaseSync(join(root, '.local-data', 'roosevelt.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS residents(id INTEGER PRIMARY KEY, unit TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL, resides INTEGER NOT NULL DEFAULT 0, pays INTEGER NOT NULL DEFAULT 0, votes INTEGER NOT NULL DEFAULT 0, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '');`);

// CSV mínimo con comillas; ponytail: sin saltos de línea dentro de campos (el padrón no los trae).
const parse = (line: string) => { const out: string[] = []; let cur = '', q = false;
  for (const c of line) { if (c === '"') q = !q; else if (c === ',' && !q) { out.push(cur); cur = ''; } else cur += c; }
  return [...out, cur]; };

const lines = readFileSync(process.argv[2], 'utf8').split(/\r?\n/).filter(Boolean);
const start = lines.findIndex((l) => l.startsWith('Depto.')) + 1;
if (!start) throw new Error('No se encontró la cabecera "Depto."');

// Las filas sin Depto pertenecen a la unidad anterior; la fila de 1405 al final se une a su unidad por número.
const byUnit = new Map<string, string[][]>();
let unit = '';
for (const l of lines.slice(start)) {
  const f = parse(l);
  if (f[0].trim()) unit = f[0].trim();
  byUnit.set(unit, [...(byUnit.get(unit) ?? []), f]);
}

db.exec('BEGIN; DELETE FROM residents;');
const ins = db.prepare('INSERT INTO residents(unit,name,role,resides,pays,votes,email,phone) VALUES(?,?,?,?,?,?,?,?)');
let n = 0;
for (const [u, rows] of byUnit) for (const f of rows) {
  ins.run(u, f[1].trim(), f[2].trim(), f[3] === 'Sí' ? 1 : 0, f[4] === 'Sí' ? 1 : 0, f[5] === 'Sí' ? 1 : 0, f[6].trim(), f[7].trim());
  n++;
}
db.exec('COMMIT;');
console.log(`${n} personas en ${byUnit.size} departamentos.`);
