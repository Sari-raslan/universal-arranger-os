export default {
  meta: {
    lang: 'en',
    dir: 'ltr',
    title: 'UAOS / AE Platform — Arranger Studio · MIDI Toolkit · Singy',
    description:
      'UAOS by AE Platform: three customer products — Arranger Studio, MIDI Toolkit, and Singy. Private founding pilot ready. Not a public store release.',
  },
  skipLink: 'Skip to main content',
  nav: {
    brand: 'UAOS',
    home: 'Home',
    arranger: 'Arranger Studio',
    midi: 'MIDI Toolkit',
    singy: 'Singy',
    studio: 'Studio Services',
    status: 'Status',
    support: 'Support',
    languageLabel: 'Language',
  },
  hero: {
    eyebrow: 'AE Platform / UAOS',
    title: 'Three products. One musical platform.',
    subtitle:
      'Arranger Studio, MIDI Toolkit, and Singy — one-click Windows packages with honest format limits. No developer tools required.',
    ctaArranger: 'Arranger Studio',
    ctaMidi: 'MIDI Toolkit',
    ctaSingy: 'Singy',
    markAlt: 'UAOS brand mark',
  },
  products: {
    arranger: {
      id: 'arranger-studio',
      path: '/products/arranger-studio/',
      title: 'UAOS Arranger Studio',
      tagline: 'Chords and melody → arrangement → MIDI export',
      status: 'V14 production candidate · Private founding pilot',
      proof:
        'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_ARRANGER_STUDIO_V14.zip',
      points: [
        'Idea → Understand → Arrange → Sequence → Play → Export',
        'Port conflict recovery without Task Manager',
        'EN / DE / AR with Arabic RTL',
        'MIDI SMF export where verified',
        'Proprietary keyboard WRITE remains FORMAT_CONTRACT_REQUIRED',
      ],
      limitations: [
        'Not Commander',
        'Not public store release',
        'Owner musical acceptance is a separate gate',
        'No invented proprietary WRITE',
      ],
      howItWorks: [
        'Extract the product ZIP',
        'Double-click START-UAOS-ARRANGER-STUDIO.bat',
        'Open a demo or create a project',
        'Play, save, export MIDI',
      ],
      faq: [
        { q: 'Do I need Node or Git?', a: 'No. Runtime is bundled.' },
        { q: 'Is this a public release?', a: 'No. Private founding pilot / production candidate.' },
        { q: 'Market leadership claims?', a: 'None. Honest product status only.' },
      ],
    },
    midi: {
      id: 'midi-toolkit',
      path: '/products/midi-toolkit/',
      title: 'UAOS MIDI Toolkit',
      tagline: 'Inspect, clean, normalize, convert where verified',
      status: 'V14 production candidate · Private founding pilot',
      proof: 'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_MIDI_TOOLKIT_V14.zip',
      points: [
        'AUDIO_TO_MIDI · MIDI_INSPECT · MIDI_CLEAN · MIDI_NORMALIZE',
        'FORMAT_INSPECT · CONVERT_WHERE_VERIFIED',
        'Format truth matrix (no invented WRITE)',
        'Neutral IR path · roundtrip where proven',
      ],
      limitations: [
        'Korg/Yamaha/Roland/Ketron WRITE requires full contract proof',
        'Microphone live capture remains HARDWARE_REQUIRED',
      ],
      howItWorks: [
        'Extract ZIP → START-UAOS-MIDI-TOOLKIT.bat',
        'Select a mode',
        'Load input where supported',
        'Process and export with overwrite protection',
      ],
      faq: [
        { q: 'Can it write .SET files?', a: 'No — FORMAT_CONTRACT_REQUIRED until proven.' },
        { q: 'Developer environment?', a: 'Not required.' },
      ],
    },
    singy: {
      id: 'singy',
      path: '/products/singy/',
      title: 'Singy — Kids + Teen',
      tagline: 'One family launcher. Age-appropriate musical coaching.',
      status: 'V14 production candidate · Musical acceptance owner gate',
      proof: 'KIDS_FIRST_RUN=PASS · TEEN_FIRST_RUN=PASS · UNCLEARED_SHIPPED_ASSETS=0',
      points: [
        'First screen: choose KIDS or TEEN',
        'Shared Musical Brain + memory + lessons',
        'Built-in synthesized playback only',
        'Privacy-friendly Kids UX · creative Teen studio',
      ],
      limitations: [
        'No uncleared KORG/MP3/oud/qanun/ney samples',
        'FINAL_MUSICAL_ACCEPTANCE remains owner decision',
      ],
      howItWorks: [
        'Extract ZIP → START-SINGY.bat',
        'Choose KIDS or TEEN',
        'Open lesson / create',
        'Hear result · save session',
      ],
      faq: [
        { q: 'Are Kids and Teen separate products?', a: 'One Singy family with two modes.' },
        { q: 'Account required?', a: 'No account dependency for core offline flow.' },
      ],
    },
  },
  studioServices: {
    title: 'Studio Services',
    message:
      'Studio Services remain available as a separate offering. This site focuses on the three customer software SKUs.',
  },
  statusPage: {
    title: 'Product status',
    items: [
      'Arranger Studio V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'MIDI Toolkit V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'Singy V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'PUBLIC_RELEASE=NO · PAYMENT_ACTIVE=NO · WEBSITE_PRODUCTION_DEPLOY=NO',
      'WHEA_GATE=NOT_CLEARED (Electron heavy deferred)',
    ],
  },
  support: {
    title: 'Support',
    body: 'Founding pilot support is best-effort. Contact admin@aeplatform.app. Attach an in-app diagnostics export when possible (secrets redacted).',
    email: 'admin@aeplatform.app',
  },
  footer: {
    platformName: 'AE Platform / UAOS',
    rights: 'All rights reserved. Preview materials — not a public release.',
    impressum: 'Impressum',
    datenschutz: 'Datenschutz',
    terms: 'Terms (draft)',
    support: 'Support',
  },
  legal: {
    pendingTitle: 'Information pending',
    pendingBody:
      'Legal pages require owner company/imprint data. Drafts only — not accepted. Not published for production use.',
    backHome: 'Back to home',
  },
  cta: {
    pilot: 'Private founding pilot — invite only',
    noPrice: 'Price shown only after owner approval',
  },
  sections: {
    how: 'How it works',
    features: 'Features',
    limits: 'Real limitations',
    faq: 'FAQ',
  },
};
