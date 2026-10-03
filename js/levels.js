/* Definicao das 5 ondas. Velocidade cresce a cada nivel. */
(function () {
  window.Levels = [
    { name: "HAMBURGUERES VOADORES", sprite: "burger", cols: 6, rows: 2, speed: 22, zigAmp: 52, zigFreq: 1.1, shootEvery: 2.3, score: 100 },
    { name: "BOLACHAS ESPACIAIS",   sprite: "cookie", cols: 7, rows: 2, speed: 28, zigAmp: 58, zigFreq: 1.35, shootEvery: 2.0, score: 150 },
    { name: "FERROS DE PASSAR",     sprite: "iron",   cols: 6, rows: 2, speed: 36, zigAmp: 62, zigFreq: 1.6, shootEvery: 1.7, score: 200 },
    { name: "GRAVATAS BORBOLETA",   sprite: "bowtie", cols: 7, rows: 2, speed: 44, zigAmp: 66, zigFreq: 1.9, shootEvery: 1.45, score: 250 },
    { name: "DIAMANTES MORTAIS",    sprite: "diamond",cols: 6, rows: 3, speed: 54, zigAmp: 70, zigFreq: 2.2, shootEvery: 1.2, score: 300 }
  ];
})();
