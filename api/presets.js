export default function handler(req, res) {
  res.status(200).json([
    { name: "Khaliji Pop 96", tempo: 96, maqam: "Nahawand", progression: ["Cm","F","G7","Cm"] },
    { name: "Oriental Ballad 76", tempo: 76, maqam: "Bayati", progression: ["Dm","G7","Cm","Dm"] },
    { name: "Hijaz Dance 112", tempo: 112, maqam: "Hijaz", progression: ["Cm","Bb","G7","Cm"] }
  ]);
}
