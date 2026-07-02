export function validateNativeOutputPlan026(plan) {
  const failures = [];
  if (!plan || typeof plan !== 'object') failures.push('plan missing');
  if (!String(plan?.label || '').includes('TEST_UNVERIFIED')) failures.push('not labeled TEST_UNVERIFIED');
  if (plan?.proprietarySampleClaims) failures.push('contains proprietary sample claims');
  if (plan?.targetsInternalKeyboardMemory) failures.push('targets internal keyboard memory');
  if (plan?.overwriteInstruction) failures.push('contains overwrite instruction');
  if (!plan?.backupConfirmed) failures.push('missing backup confirmation');
  if (!plan?.ownerApproval) failures.push('missing owner approval');
  if (!plan?.isolatedTestOutputFolder) failures.push('not isolated to test output folder');
  return { status: failures.length ? 'BLOCKED' : 'PASS', failures };
}

export const designOnly = true;
export const generatesNativeKeyboardFiles = false;
