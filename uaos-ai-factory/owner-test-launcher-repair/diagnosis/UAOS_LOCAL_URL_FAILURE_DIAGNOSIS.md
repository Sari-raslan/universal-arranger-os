# UAOS Local URL Failure Diagnosis

Broken URL reported: `http://127.0.0.1:4173/universal-arranger-os/`

Broken URL confirmed: YES

Cause: the launcher was using port 4173, but the React app preview script uses port 5180.

Build PASS: YES

Vite preview output: `http://127.0.0.1:5180/universal-arranger-os/`

Working URL selected: `http://127.0.0.1:5180/`

Recommended app route: `http://127.0.0.1:5180/universal-arranger-os/`

App.jsx touched: NO

Deploy: NO
