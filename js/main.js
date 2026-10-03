/* Bootstrap + loop com timestep fixo 60Hz. */
(function () {
  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  var overlay = document.getElementById("overlay");
  var bannerEl = document.getElementById("banner");
  var gameoverEl = document.getElementById("gameover");
  var goTitle = document.getElementById("go-title");
  var goScore = document.getElementById("go-score");
  var goHi = document.getElementById("go-hi");

  Game.init();

  var bannerTimer = null;
  Game.onBanner = function (txt, dur) {
    bannerEl.textContent = txt;
    bannerEl.classList.remove("hidden");
    if (bannerTimer) clearTimeout(bannerTimer);
    bannerTimer = setTimeout(function () { bannerEl.classList.add("hidden"); }, dur * 1000);
  };
  Game.onGameOver = function (win, score, hi) {
    goTitle.textContent = win ? "VOCE VENCEU!" : "GAME OVER";
    goTitle.style.color = win ? "#39FF14" : "#FF2244";
    goScore.textContent = "SCORE " + score;
    goHi.textContent = "HI " + hi;
    gameoverEl.classList.remove("hidden");
  };

  function startGame() {
    AudioSys.unlock();
    overlay.classList.add("hidden");
    overlay.classList.remove("show");
    gameoverEl.classList.add("hidden");
    Game.start();
  }

  document.getElementById("btn-start").addEventListener("click", startGame);
  document.getElementById("btn-retry").addEventListener("click", startGame);
  Input.init(canvas, function () { AudioSys.unlock(); });

  // primeiro toque no overlay tambem destrava audio
  overlay.addEventListener("touchstart", function () { AudioSys.unlock(); }, { passive: true });

  document.addEventListener("visibilitychange", function () {
    // pausa implicita: evita dt gigante (acumulador limitado abaixo)
  });

  var STEP = 1 / 60, acc = 0, last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 5) {
      Game.update(STEP, Input);
      acc -= STEP; n++;
    }
    Game.render(ctx);
  }
  requestAnimationFrame(frame);
})();
