/* Pixel-art procedural 8-bit: cada sprite e uma matriz de chars + paleta.
   Renderizado uma vez em offscreen canvas, depois blitado com drawImage. */
(function () {
  var cache = {};

  var DEFS = {
    player: {
      w: 16, h: 12,
      pal: { W: "#00FFFF", C: "#FF2244", E: "#FFFFFF" },
      rows: [
        ".......WW.......",
        ".......WW.......",
        "......WWWW......",
        "......WWWW......",
        ".....WWWWWW.....",
        ".....WCCWW......",
        "....WWCCCWW.....",
        "....WCCCCWW.....",
        "...WWCCCCWWW....",
        "..WWWWWWWWWWW...",
        ".WWWEWWWWWEWWW..",
        "WWWWWWWWWWWWWWW."
      ]
    },
    burger: {
      w: 16, h: 12,
      pal: { T: "#F5A623", G: "#39FF14", Y: "#FFE600", B: "#8B3A1A", D: "#C97A1B", S: "#FFFFFF" },
      rows: [
        ".....TTTTTT.....",
        "...TTTTTTTTTT...",
        "..STTTTTTTTTTT..",
        ".TTTTTTTTTTTTTT.",
        ".GGGGGGGGGGGGGG.",
        "GYYYYYYYYYYYYYYG",
        ".BBBBBBBBBBBBBB.",
        ".BBBBBBBBBBBBBB.",
        "..BBBBBBBBBBBB..",
        "..DDDDDDDDDDDD..",
        "...DDDDDDDDDD...",
        "................"
      ]
    },
    cookie: {
      w: 16, h: 12,
      pal: { C: "#D2691E", L: "#F5D67B", D: "#3A1C00" },
      rows: [
        ".....CCCCCC.....",
        "...CCCCCCCCCC...",
        "..LCCCCCCCCCCC..",
        "..CCCCDCCCCDCC..",
        ".CCCCCCCCCCCCCC.",
        ".CCCDCCCCCCCCDC.",
        ".CCCCCCCCDCCCCC.",
        ".CCCCCCCCCCCCCC.",
        "..CCCCDCCCCDCC..",
        "..CCCCCCCCCCCC..",
        "...CCCCCCCCCC...",
        ".....CCCCCC....."
      ]
    },
    iron: {
      w: 16, h: 12,
      pal: { M: "#C9D1D9", K: "#444444", H: "#FF3300", E: "#00FFFF", B: "#222222" },
      rows: [
        ".....KKKK.......",
        "....K....K......",
        "....K....K......",
        ".....KKKK....E..",
        "..MMMMMMMMM.E...",
        ".MMMMMMMMMMME...",
        ".MMBMMBMMBMM....",
        ".MMMMMMMMMMM....",
        ".HHHHHHHHHHH....",
        ".HHHHHHHHHHH....",
        "..HHHHHHHHH.....",
        "................"
      ]
    },
    bowtie: {
      w: 16, h: 12,
      pal: { R: "#FF0055", P: "#FF77AA", N: "#FFFFFF", B: "#7A0026" },
      rows: [
        "RR........RR....",
        "RRRR....RRRR....",
        "RPRRR..RRRPR....",
        "RPPRRRRRRRPP....",
        "RPPPRNNNNRPPP...",
        ".RPPRNNNNNRPP...",
        ".RPPRNNNNNRPP...",
        "RPPPRNNNNRPPP...",
        "RPPRRRRRRRPP....",
        "RPRRR..RRRPR....",
        "RRRR....RRRR....",
        "RR........RR...."
      ]
    },
    diamond: {
      w: 16, h: 12,
      pal: { A: "#00E5FF", W: "#FFFFFF", B: "#0066FF", D: "#0033AA" },
      rows: [
        ".......WW.......",
        "......WAAW......",
        ".....WAAAAW.....",
        "....WAAWWAAW....",
        "...WAAWWWWAAW...",
        "..WAAWWWWWWAAW..",
        "...WAAWWWWAAW...",
        "....WAAWWAAW....",
        ".....WAAAAW.....",
        "......WAAW......",
        ".......WW.......",
        "................"
      ]
    }
  };

  function build(name) {
    var def = DEFS[name];
    var cv = document.createElement("canvas");
    cv.width = def.w; cv.height = def.h;
    var g = cv.getContext("2d");
    for (var y = 0; y < def.rows.length; y++) {
      var row = def.rows[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row[x];
        if (ch === "." || ch === " ") continue;
        g.fillStyle = def.pal[ch] || "#FF00FF";
        g.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  }

  window.Sprites = {
    get: function (name) {
      if (!cache[name]) cache[name] = build(name);
      return cache[name];
    },
    draw: function (ctx, name, x, y) {
      var s = this.get(name);
      ctx.drawImage(s, Math.round(x - s.width / 2), Math.round(y - s.height / 2));
    }
  };
})();
