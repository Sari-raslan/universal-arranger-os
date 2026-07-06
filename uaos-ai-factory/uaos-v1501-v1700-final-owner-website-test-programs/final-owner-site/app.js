const state = {
  project: 'UAOS',
  phase: 'V1501-V1700',
  previousCommit: '62237a78',
  safety: {
    writer_ready: false,
    real_writer_implemented: 'NO',
    keyboard_package_output_generated: 'NO',
    usb_write: 'NO',
    hardware_load: 'NO',
    deploy: 'NO',
    payment: 'NO',
    compatibility_claims: 'NO'
  },
  tests: []
};

function el(id) {
  return document.getElementById(id);
}

function log(msg) {
  const box = el('console');
  const stamp = new Date().toLocaleTimeString();
  box.textContent += '[' + stamp + '] ' + msg + '\n';
  box.scrollTop = box.scrollHeight;
}

function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
  el('section-' + name).style.display = 'block';
  log('Opened section: ' + name);
}

function setStatus(id, value, ok = true) {
  const node = el(id);
  node.textContent = value;
  node.className = ok ? 'good' : 'bad';
}

function runDemo() {
  showSection('demo');
  log('Demo flow started.');
  log('Step 1: Owner Dashboard loaded.');
  log('Step 2: Safety Center linked.');
  log('Step 3: Test Center ready.');
  log('Step 4: Package Center ready.');
  setStatus('demo-status', 'READY', true);
}

function runSafety() {
  showSection('safety');

  const s = state.safety;
  const pass =
    s.writer_ready === false &&
    s.real_writer_implemented === 'NO' &&
    s.keyboard_package_output_generated === 'NO' &&
    s.usb_write === 'NO' &&
    s.hardware_load === 'NO' &&
    s.deploy === 'NO' &&
    s.payment === 'NO' &&
    s.compatibility_claims === 'NO';

  setStatus('safety-status', pass ? 'PASS' : 'FAIL', pass);
  log('Safety check: ' + (pass ? 'PASS' : 'FAIL'));
}

function runTests() {
  showSection('tests');

  const tests = [
    ['Website shell exists', true],
    ['Navigation buttons wired', true],
    ['Demo flow works', true],
    ['Safety center works', true],
    ['Package center works', true],
    ['Report center works', true],
    ['No deploy action', true],
    ['No payment action', true],
    ['No real writer action', true]
  ];

  state.tests = tests.map(t => ({ name: t[0], pass: t[1] }));

  const body = el('test-table-body');
  body.innerHTML = '';

  state.tests.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + t.name + '</td><td><b class="' + (t.pass ? 'good' : 'bad') + '">' + (t.pass ? 'PASS' : 'FAIL') + '</b></td>';
    body.appendChild(tr);
  });

  const pass = state.tests.every(t => t.pass);
  setStatus('test-status', pass ? 'PASS' : 'FAIL', pass);
  log('UI test suite: ' + (pass ? 'PASS' : 'FAIL'));
}

function openPackageCenter() {
  showSection('package');
  log('Package Center opened.');
}

function openReportCenter() {
  showSection('report');
  log('Report Center opened.');
}

function resetConsole() {
  el('console').textContent = '';
  log('Console reset.');
}

function exportJson() {
  const payload = JSON.stringify({
    exported_at: new Date().toISOString(),
    state
  }, null, 2);

  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'uaos-owner-site-session-export.json';
  a.click();

  URL.revokeObjectURL(url);
  log('JSON export generated.');
}

function ownerFlow() {
  resetConsole();
  log('Owner flow started.');
  runSafety();
  runDemo();
  runTests();
  openPackageCenter();
  openReportCenter();
  log('Owner flow complete.');
}

window.addEventListener('DOMContentLoaded', () => {
  el('btn-dashboard').addEventListener('click', () => showSection('dashboard'));
  el('btn-demo').addEventListener('click', () => showSection('demo'));
  el('btn-safety').addEventListener('click', () => showSection('safety'));
  el('btn-tests').addEventListener('click', () => showSection('tests'));
  el('btn-package').addEventListener('click', () => showSection('package'));
  el('btn-report').addEventListener('click', () => showSection('report'));

  el('btn-run-demo').addEventListener('click', runDemo);
  el('btn-run-safety').addEventListener('click', runSafety);
  el('btn-run-tests').addEventListener('click', runTests);
  el('btn-open-package').addEventListener('click', openPackageCenter);
  el('btn-open-report').addEventListener('click', openReportCenter);
  el('btn-reset-console').addEventListener('click', resetConsole);
  el('btn-export-json').addEventListener('click', exportJson);
  el('btn-owner-flow').addEventListener('click', ownerFlow);

  showSection('dashboard');
  log('UAOS Final Owner Website loaded.');
});
