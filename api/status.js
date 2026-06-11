export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    app: "UAOS HyperStation",
    version: "PUBLIC-FIX-1",
    features: ["status", "presets", "song-generate", "release-report"]
  });
}
