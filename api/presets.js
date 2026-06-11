export default function handler(req, res) {
  res.status(200).json([
    { name: "Khaliji Pop 96", tempo: 96, maqam: "Nahawand" },
    { name: "Oriental Ballad 76", tempo: 76, maqam: "Bayati" },
    { name: "Hijaz Dance 112", tempo: 112, maqam: "Hijaz" }
  ]);
}
