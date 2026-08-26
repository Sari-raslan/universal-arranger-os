'use strict';
const { GAP_CLASSIFICATION, assertBanned, packageBoundaryCheck, safeExportGuard, BANNED } = require('./index.cjs');
let fail = 0;
function ok(m){ console.log('PASS', m); }
function bad(m){ console.error('FAIL', m); fail++; }

if (GAP_CLASSIFICATION.filter((g) => g.class === 'TECHNICAL_SAFE_TO_CLOSE').length >= 3) ok('technical gaps'); else bad('tech');
if (GAP_CLASSIFICATION.some((g) => g.class === 'ALREADY_CLOSED')) ok('converters gap already closed'); else bad('already');
if (!assertBanned('korg.writer').allowed) ok('ban enforcement'); else bad('ban');
if (BANNED.length >= 5) ok('banned list'); else bad('list');
if (packageBoundaryCheck({ claimsCommercialHardwareReady: false, includesKorgWriter: false }).ok) ok('package boundary'); else bad('boundary');
if (!packageBoundaryCheck({ claimsCommercialHardwareReady: true }).ok) ok('reject commercial hw claim'); else bad('claim');
if (safeExportGuard({ outputDir: 'C:/out', proprietaryWriter: false }).ok) ok('safe export guard'); else bad('export');
if (!safeExportGuard({ inPlace: true }).ok) ok('reject in-place'); else bad('inplace');

if (fail) { console.error(JSON.stringify({ status: 'FAIL', failures: fail })); process.exit(1); }
console.log(JSON.stringify({ status: 'PASS', suite: 'KEYBOARD-V17-GAP-CLOSURE', failures: 0 }));
