const fs = require('fs');
const path = require('path');

const tmp = process.env.TEMP || process.env.TMP || '/tmp';
const server = JSON.parse(fs.readFileSync(path.join(tmp, 'server-indexes.json'), 'utf8'));
const local = JSON.parse(fs.readFileSync('firebase/firestore.indexes.json', 'utf8'));

function norm(fields) {
  return fields
    .filter((f) => f.fieldPath !== '__name__')
    .map((f) => (f.arrayConfig ? `${f.fieldPath}:CONTAINS` : `${f.fieldPath}:${f.order}`))
    .join(',');
}

const serverEntries = server.map((i) => ({
  collection: i.name.split('collectionGroups/')[1].split('/')[0],
  key: norm(i.fields),
}));
const localEntries = local.indexes.map((i) => ({
  collection: i.collectionGroup,
  key: norm(i.fields),
}));

const fullKey = (e) => `${e.collection}|${e.key}`;

const serverKeys = new Set(serverEntries.map(fullKey));
const localKeys = new Set(localEntries.map(fullKey));

const stale = serverEntries.filter((e) => !localKeys.has(fullKey(e)));
const missing = localEntries.filter((e) => !serverKeys.has(fullKey(e)));

console.log('STALE (server only, would be deleted by --force):');
stale.forEach((s) => console.log(`  [${s.collection}] ${s.key}`));
console.log('\nMISSING (local only, not yet on server):');
missing.forEach((m) => console.log(`  [${m.collection}] ${m.key}`));
console.log(
  `\ntotals: server=${serverEntries.length}, local=${localEntries.length}, stale=${stale.length}, missing=${missing.length}`
);
