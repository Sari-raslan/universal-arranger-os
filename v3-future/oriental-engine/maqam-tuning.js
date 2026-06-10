export function createMaqamTuning(name = 'rast') {
  const maqams = {
    rast: { root: 'C', cents: [0, 200, 350, 500, 700, 900, 1050, 1200] },
    bayati: { root: 'D', cents: [0, 150, 300, 500, 700, 800, 1000, 1200] },
    hijaz: { root: 'D', cents: [0, 100, 400, 500, 700, 800, 1100, 1200] },
    nahawand: { root: 'C', cents: [0, 200, 300, 500, 700, 800, 1100, 1200] }
  };

  return {
    name,
    ...(maqams[name] || maqams.rast),
    quarterToneReady: true
  };
}
