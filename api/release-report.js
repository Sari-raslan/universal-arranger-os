export default function handler(req, res) {
  res.status(200).json({
    product: "UAOS HyperStation",
    gate: "public-preview-live",
    ready: [
      "Vercel frontend",
      "Vercel /api/status",
      "PWA install",
      "Desktop shell prepared",
      "Android/Capacitor prepared"
    ],
    pending: [
      "real payment links",
      "real licensed WAV library",
      "Apple iOS build requires macOS + Xcode"
    ]
  });
}
