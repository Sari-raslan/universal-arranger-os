'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'dist');
fs.mkdirSync(out, { recursive: true });
fs.copyFileSync(path.join(root, 'ui', 'placeholder.html'), path.join(out, 'index.html'));
fs.writeFileSync(path.join(out, 'build.json'), JSON.stringify({
  product: 'uaos.creator',
  kind: 'shell-foundation',
  builtAt: new Date().toISOString(),
  advancedFeaturesImplemented: false
}, null, 2));
console.log(JSON.stringify({ status: 'PASS', build: 'creator-shell', out }));
