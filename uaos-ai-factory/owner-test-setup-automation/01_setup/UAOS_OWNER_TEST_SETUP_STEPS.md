# UAOS Owner Test Setup Steps

1. Open `00_launcher\START_UAOS_OWNER_TEST.cmd`.
2. Wait for local build check to finish.
3. If preview starts, open `http://127.0.0.1:4173/universal-arranger-os/`.
4. If preview does not start, use the safe manual fallback: Run START_UAOS_OWNER_TEST.cmd. If the browser does not open, run npm run preview -- --host 127.0.0.1 --port 4173 from the React app folder, then open the local URL.
5. Follow the owner flow dashboard.
6. Fill the test session template and next action decision form.

Safety: deploy NO, push NO, payment NO, KORG Writer BLOCKED, .STY/.SET generated NO, USB NO, PA3X NO.
