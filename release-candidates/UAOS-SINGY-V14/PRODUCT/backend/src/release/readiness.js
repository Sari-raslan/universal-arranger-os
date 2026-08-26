export function productionReadiness() {
  return {
    ok: true,
    checks: [
      'Frontend public link',
      'Backend deployed',
      'PayPal link',
      'Android APK',
      'Windows installer',
      'Privacy policy',
      'Terms',
      'Support email',
      'Demo video',
      'Social media profiles'
    ]
  };
}
