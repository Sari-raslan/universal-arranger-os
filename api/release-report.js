export default function handler(req, res) {
  res.status(200).json({
    product: "UAOS HyperStation",
    gate: "public-live-fixed",
    ready: ["frontend", "serverless api", "presets", "song generate"],
    pending: ["real audio sampler", "real midi binary export", "desktop installer", "apk"]
  });
}
