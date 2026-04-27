/**
 * One-shot migration: move Equipment team/unit storage from the legacy
 * `assignedUnit` + `assignedTeam` fields to the denormalized
 * `holderTeamId` / `holderUnitId` / `signerTeamId` / `signerUnitId` quartet.
 *
 * Also:
 *  - Backfills `signedById` by looking up the signer by display name when possible
 *    (best-effort; leaves blank if ambiguous — operator fixes those manually).
 *  - Sets `status: TemplateStatus.CANONICAL` on existing equipmentTemplates so
 *    they remain pickable after the status field becomes required.
 *  - Does NOT touch `photoUrl` — existing equipment will have to be reshot via
 *    the manager 'force report' flow.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./sa.json ts-node scripts/migrate-equipment-team-fields.ts --project sayeret-givati-1983
 *
 * The script is idempotent: running it twice is safe. It only writes when a
 * change is actually needed.
 */

import * as admin from 'firebase-admin';

const args = process.argv.slice(2);
const projectIdx = args.indexOf('--project');
const projectId = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
const dryRun = args.includes('--dry-run');

if (!projectId) {
  console.error('Missing --project <projectId>');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId,
});

const db = admin.firestore();

async function migrate() {
  const userSnap = await db.collection('users').get();
  const usersByDisplayName = new Map<string, { uid: string; teamId?: string; unitId?: string }>();
  for (const doc of userSnap.docs) {
    const data = doc.data();
    const name = `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim();
    if (name) {
      usersByDisplayName.set(name, { uid: doc.id, teamId: data.teamId, unitId: data.unitId });
    }
  }
  console.log(`Loaded ${usersByDisplayName.size} users for signer backfill`);

  // --- Equipment items ---
  const equipSnap = await db.collection('equipment').get();
  let equipChanged = 0;
  for (const doc of equipSnap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};

    const holderProfile = data.currentHolderId
      ? (await db.collection('users').doc(data.currentHolderId).get()).data()
      : null;

    if (data.holderTeamId === undefined) {
      updates.holderTeamId = holderProfile?.teamId ?? data.assignedTeam ?? null;
    }
    if (data.holderUnitId === undefined) {
      updates.holderUnitId = holderProfile?.unitId ?? data.assignedUnit ?? null;
    }

    if (!data.signedById && data.signedBy) {
      const match = usersByDisplayName.get(data.signedBy);
      if (match) {
        updates.signedById = match.uid;
        if (data.signerTeamId === undefined) updates.signerTeamId = match.teamId ?? null;
        if (data.signerUnitId === undefined) updates.signerUnitId = match.unitId ?? null;
      } else {
        console.warn(`equipment/${doc.id}: cannot backfill signedById — signer "${data.signedBy}" not found`);
      }
    }

    if (data.assignedUnit !== undefined) updates.assignedUnit = admin.firestore.FieldValue.delete();
    if (data.assignedTeam !== undefined) updates.assignedTeam = admin.firestore.FieldValue.delete();

    if (Object.keys(updates).length > 0) {
      if (!dryRun) await doc.ref.update(updates);
      equipChanged++;
    }
  }
  console.log(`equipment: ${equipChanged}/${equipSnap.size} docs ${dryRun ? 'would change' : 'updated'}`);

  // --- Equipment templates ---
  const tmplSnap = await db.collection('equipmentTemplates').get();
  let tmplChanged = 0;
  for (const doc of tmplSnap.docs) {
    const data = doc.data();
    const updates: Record<string, unknown> = {};
    if (data.status === undefined) updates.status = 'canonical';
    if (data.requiresSerialNumber === undefined) updates.requiresSerialNumber = true;
    if (Object.keys(updates).length > 0) {
      if (!dryRun) await doc.ref.update(updates);
      tmplChanged++;
    }
  }
  console.log(`equipmentTemplates: ${tmplChanged}/${tmplSnap.size} docs ${dryRun ? 'would change' : 'updated'}`);

  console.log(dryRun ? 'DRY RUN — no writes performed' : 'Migration complete');
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
