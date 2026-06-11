function song(body = {}) {
  const tempo = Number(body.tempo || 96);
  const maqam = body.maqam || "Nahawand";
  const chord = body.chord || "Cm";
  const notes = [
    { time: 0, note: 60, velocity: 110 },
    { time: 480, note: 63, velocity: 100 },
    { time: 960, note: 67, velocity: 100 },
    { time: 1440, note: 72, velocity: 105 }
  ];
  return { ok: true, name: "UAOS Public Pattern", tempo, maqam, chord, notes };
}

export default function handler(req, res) {
  res.status(200).json(song(req.body || {}));
}
