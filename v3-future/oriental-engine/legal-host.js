import { orientalInstruments } from './oriental-db.js';
import { checkLibraryLicense } from './license-gate.js';
import { createLocalLibraryManifest, saveManifest } from './local-manifest.js';
import { createMaqamTuning } from './maqam-tuning.js';

const licensed = orientalInstruments.map(checkLibraryLicense);
const manifest = createLocalLibraryManifest(licensed.map(x => x.library));

saveManifest(manifest);

console.log(JSON.stringify({
  status: 'UAOS Oriental Engine Legal Host Ready',
  redistributesContent: false,
  licenseMode: 'local-user-owned-libraries-only',
  maqams: [
    createMaqamTuning('rast'),
    createMaqamTuning('bayati'),
    createMaqamTuning('hijaz'),
    createMaqamTuning('nahawand')
  ],
  manifest: 'uaos-oriental-manifest.json'
}, null, 2));
