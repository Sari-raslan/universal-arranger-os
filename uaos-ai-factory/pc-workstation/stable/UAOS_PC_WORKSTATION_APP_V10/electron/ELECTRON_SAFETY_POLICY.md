# Electron Safety Policy

Safety labels:

- PC_ONLY
- UAOS_FORMAT
- TEST_UNVERIFIED
- NOT_FOR_PA3X_LOAD
- NOT_FOR_USB_TRANSFER
- NOT_COMPATIBILITY_VERIFIED

Policy:

- Load only the local stable home HTML file.
- Do not load remote pages.
- Do not add payment or deployment behavior.
- Do not expose Node APIs to the app page.
- Do not install dependencies automatically.
- Do not build installers automatically.
- Do not copy files outside the repository.
- Do not write to removable media.
- Do not access owner fixture paths.
- Do not include proprietary samples or libraries.
