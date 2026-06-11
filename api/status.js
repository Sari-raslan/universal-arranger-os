export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    app: "UAOS HyperStation",
    company: "AEPlatform",
    version: "FINAL-PUBLIC",
    frontend: "https://universal-arranger-os.vercel.app",
    backend: "Vercel serverless /api",
    status: "public-live"
  });
}
