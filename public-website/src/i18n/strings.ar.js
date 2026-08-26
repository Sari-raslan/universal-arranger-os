export default {
  meta: {
    lang: 'ar',
    dir: 'rtl',
    title: 'UAOS / AE Platform — Arranger Studio · MIDI Toolkit · Singy',
    description:
      'UAOS من AE Platform: ثلاثة منتجات للعملاء — Arranger Studio وMIDI Toolkit وSingy. تجربة تأسيس خاصة. ليست إصداراً عاماً.',
  },
  skipLink: 'تخطَّ إلى المحتوى',
  nav: {
    brand: 'UAOS',
    home: 'الرئيسية',
    arranger: 'Arranger Studio',
    midi: 'MIDI Toolkit',
    singy: 'Singy',
    studio: 'خدمات الاستوديو',
    status: 'الحالة',
    support: 'الدعم',
    languageLabel: 'اللغة',
  },
  hero: {
    eyebrow: 'AE Platform / UAOS',
    title: 'ثلاثة منتجات. منصة موسيقية واحدة.',
    subtitle:
      'Arranger Studio وMIDI Toolkit وSingy — حزم ويندوز بنقرة واحدة مع حدود تنسيق صادقة. بلا أدوات مطوّر.',
    ctaArranger: 'Arranger Studio',
    ctaMidi: 'MIDI Toolkit',
    ctaSingy: 'Singy',
    markAlt: 'شعار UAOS',
  },
  products: {
    arranger: {
      id: 'arranger-studio',
      path: '/products/arranger-studio/',
      title: 'UAOS Arranger Studio',
      tagline: 'أكوردات ولحن ← توزيع ← تصدير MIDI',
      status: 'مرشّح إنتاج V14 · تجربة تأسيس خاصة',
      proof: 'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_ARRANGER_STUDIO_V14.zip',
      points: [
        'فكرة ← فهم ← توزيع ← تسلسل ← تشغيل ← تصدير',
        'استعادة تعارض المنافذ دون Task Manager',
        'EN / DE / AR مع RTL للعربية',
        'تصدير MIDI SMF حيث تم التحقق',
        'كتابة ملفات اللوحة الملكية تبقى FORMAT_CONTRACT_REQUIRED',
      ],
      limitations: [
        'ليس Commander',
        'ليست إصداراً عاماً للمتجر',
        'القبول الموسيقي قرار المالك منفصل',
        'لا كتابة ملكية مخترعة',
      ],
      howItWorks: [
        'استخرج الحزمة',
        'انقر نقراً مزدوجاً START-UAOS-ARRANGER-STUDIO.bat',
        'افتح تجربة أو أنشئ مشروعاً',
        'شغّل واحفظ وصدّر MIDI',
      ],
      faq: [
        { q: 'هل أحتاج Node أو Git؟', a: 'لا. التشغيل مدمج.' },
        { q: 'إصدار عام؟', a: 'لا. تجربة تأسيس خاصة.' },
        { q: 'ادعاءات ريادة السوق؟', a: 'لا.' },
      ],
    },
    midi: {
      id: 'midi-toolkit',
      path: '/products/midi-toolkit/',
      title: 'UAOS MIDI Toolkit',
      tagline: 'فحص وتنظيف وتطبيع وتحويل حيث تم التحقق',
      status: 'مرشّح إنتاج V14 · تجربة تأسيس خاصة',
      proof: 'ONE_CLICK_START=PASS · P0=0 · P1=0 · ZIP UAOS_MIDI_TOOLKIT_V14.zip',
      points: [
        'AUDIO_TO_MIDI · MIDI_INSPECT · MIDI_CLEAN · MIDI_NORMALIZE',
        'FORMAT_INSPECT · CONVERT_WHERE_VERIFIED',
        'مصفوفة صدق التنسيق (بدون كتابة مخترعة)',
        'مسار Neutral IR · roundtrip حيث ثبت',
      ],
      limitations: [
        'كتابة Korg/Yamaha/Roland/Ketron تتطلب إثبات عقد كامل',
        'الميكروفون المباشر يبقى HARDWARE_REQUIRED',
      ],
      howItWorks: [
        'استخراج ← START-UAOS-MIDI-TOOLKIT.bat',
        'اختر الوضع',
        'حمّل المدخلات حيث يُدعم',
        'عالِج وصدّر',
      ],
      faq: [
        { q: 'هل يكتب ملفات .SET؟', a: 'لا — FORMAT_CONTRACT_REQUIRED.' },
        { q: 'بيئة مطوّر؟', a: 'غير مطلوبة.' },
      ],
    },
    singy: {
      id: 'singy',
      path: '/products/singy/',
      title: 'Singy — أطفال + مراهقون',
      tagline: 'مشغّل عائلي واحد. تدريب موسيقي مناسب للعمر.',
      status: 'مرشّح إنتاج V14 · القبول الموسيقي قرار المالك',
      proof: 'KIDS_FIRST_RUN=PASS · TEEN_FIRST_RUN=PASS · UNCLEARED_SHIPPED_ASSETS=0',
      points: [
        'الشاشة الأولى: اختر KIDS أو TEEN',
        'دماغ موسيقي مشترك + ذاكرة + دروس',
        'تشغيل مدمج فقط',
        'واجهة أطفال مريحة للخصوصية · استوديو مراهقين إبداعي',
      ],
      limitations: [
        'لا عيّنات KORG/MP3/عود/قانون/ناي غير مصرّح بها',
        'FINAL_MUSICAL_ACCEPTANCE يبقى قرار المالك',
      ],
      howItWorks: [
        'استخراج ← START-SINGY.bat',
        'اختر KIDS أو TEEN',
        'افتح درساً / أنشئ',
        'اسمع النتيجة · احفظ الجلسة',
      ],
      faq: [
        { q: 'منتجان منفصلان؟', a: 'عائلة Singy واحدة بوضعين.' },
        { q: 'حساب مطلوب؟', a: 'لا للمسار الأساسي دون اتصال.' },
      ],
    },
  },
  studioServices: {
    title: 'خدمات الاستوديو',
    message:
      'تبقى خدمات الاستوديو عرضاً منفصلاً. يركز هذا الموقع على منتجات البرمجيات الثلاثة.',
  },
  statusPage: {
    title: 'حالة المنتجات',
    items: [
      'Arranger Studio V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'MIDI Toolkit V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'Singy V14 — INTERNAL_PRODUCT_COMPLETION=PASS',
      'PUBLIC_RELEASE=NO · PAYMENT_ACTIVE=NO · WEBSITE_PRODUCTION_DEPLOY=NO',
      'WHEA_GATE=NOT_CLEARED',
    ],
  },
  support: {
    title: 'الدعم',
    body: 'دعم تجربة التأسيس بأفضل جهد. تواصل: admin@aeplatform.app. أرفق تصدير التشخيص إن أمكن.',
    email: 'admin@aeplatform.app',
  },
  footer: {
    platformName: 'AE Platform / UAOS',
    rights: 'جميع الحقوق محفوظة. مواد معاينة — ليست إصداراً عاماً.',
    impressum: 'بيانات النشر',
    datenschutz: 'الخصوصية',
    terms: 'الشروط (مسودة)',
    support: 'الدعم',
  },
  legal: {
    pendingTitle: 'معلومات معلّقة',
    pendingBody: 'الصفحات القانونية تحتاج بيانات الشركة من المالك. مسودات فقط — غير مقبولة.',
    backHome: 'العودة للرئيسية',
  },
  cta: {
    pilot: 'تجربة تأسيس خاصة — بدعوة فقط',
    noPrice: 'يظهر السعر بعد موافقة المالك فقط',
  },
  sections: {
    how: 'كيف يعمل',
    features: 'الميزات',
    limits: 'حدود حقيقية',
    faq: 'أسئلة شائعة',
  },
};
