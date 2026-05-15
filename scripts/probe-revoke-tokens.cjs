/**
 * Probe Firebase Auth `revokeRefreshTokens` behavior.
 *
 * Diagnostic only — creates a throwaway test user, observes how Firebase Admin
 * SDK sets `tokensValidAfterTime`, then deletes the user. No effect on prod
 * data. Run via: node scripts/probe-revoke-tokens.cjs
 *
 * The question we are answering: can `revokeRefreshTokens(uid)` replace the
 * current `users.sessionEpoch` fence in `auth.ts`? Specifically, can it kill
 * sessions OLDER than the caller's auth_time while preserving the caller?
 */
const { initAdmin, parseSharedArgs } = require('./_shared/initAdmin');

const args = parseSharedArgs(process.argv.slice(2));
const { auth } = initAdmin({ projectId: args.projectId, scriptName: 'probe-revoke-tokens' });

async function main() {
  const email = `probe-${Date.now()}@example-throwaway.test`;
  const password = 'TempPassword!9';

  console.log(`Creating throwaway user ${email}…`);
  const user = await auth.createUser({ email, password, displayName: 'probe' });
  console.log(`  uid=${user.uid}`);
  console.log(`  initial tokensValidAfterTime=${user.tokensValidAfterTime ?? '(unset)'}`);

  await new Promise((r) => setTimeout(r, 100));

  const before = Date.now();
  console.log(`\nCalling revokeRefreshTokens at wall-clock=${new Date(before).toISOString()}…`);
  await auth.revokeRefreshTokens(user.uid);
  const after = Date.now();
  console.log(`  done in ${after - before}ms`);

  const refreshed = await auth.getUser(user.uid);
  console.log(`  tokensValidAfterTime after revoke=${refreshed.tokensValidAfterTime}`);
  const stamp = refreshed.tokensValidAfterTime
    ? new Date(refreshed.tokensValidAfterTime).getTime()
    : null;
  if (stamp) {
    console.log(`  delta from wall-clock call: ${stamp - before}ms`);
    console.log(`  delta from call return:     ${stamp - after}ms`);
  }

  console.log(`\nVerdict:`);
  if (stamp && Math.abs(stamp - before) < 5000) {
    console.log(`  ✓ tokensValidAfterTime = ~now (NOT configurable to a custom epoch).`);
    console.log(`  ✗ Cannot pin to caller's auth_time — caller's auth_time is BEFORE now, so`);
    console.log(`    caller's current ID token would fail verifyIdToken(_, /*checkRevoked=*/true)`);
    console.log(`    immediately.`);
    console.log(`  → revokeRefreshTokens CANNOT replace the sessionEpoch fence without breaking`);
    console.log(`    the "preserve caller" UX.`);
  } else {
    console.log(`  ? Unexpected: tokensValidAfterTime not close to now. Re-examine.`);
  }

  console.log(`\nCleaning up throwaway user…`);
  await auth.deleteUser(user.uid);
  console.log(`  done.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Probe failed:', e);
    process.exit(1);
  });
