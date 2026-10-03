/* Audio 100% sintetizado via Web Audio API — sem assets externos.
   laser agudo + explosao "crushing" (noise + waveshaper). */
(function () {
  var ctx = null;

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return ctx; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function env(g, t0, peak, dur) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  }

  function laser() {
    var c = ensure(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(180, t + 0.12);
    env(g, t, 0.12, 0.13);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + 0.15);
  }

  function noiseBuffer(dur) {
    var c = ensure();
    var len = Math.floor(c.sampleRate * dur);
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function crushCurve() {
    // bit-crush aproximado
    var n = 256, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1) * 2 - 1;
      curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.35) * 0.9;
    }
    return curve;
  }

  var sharedCurve = null;

  function explode(big) {
    var c = ensure(); if (!c) return;
    var t = c.currentTime;
    var dur = big ? 0.6 : 0.32;
    var src = c.createBufferSource();
    src.buffer = noiseBuffer(dur);
    var shaper = c.createWaveShaper();
    if (!sharedCurve) sharedCurve = crushCurve();
    shaper.curve = sharedCurve;
    var filt = c.createBiquadFilter();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(big ? 3500 : 2800, t);
    filt.frequency.exponentialRampToValueAtTime(120, t + dur);
    var g = c.createGain();
    env(g, t, big ? 0.35 : 0.25, dur);
    src.connect(shaper).connect(filt).connect(g).connect(c.destination);
    src.start(t); src.stop(t + dur + 0.02);
    // corpo grave por baixo
    var o = c.createOscillator(), g2 = c.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(big ? 160 : 220, t);
    o.frequency.exponentialRampToValueAtTime(30, t + dur);
    env(g2, t, 0.25, dur);
    o.connect(g2).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function jingle(win) {
    var c = ensure(); if (!c) return;
    var notes = win ? [523, 659, 784, 1046] : [392, 523, 659];
    var t = c.currentTime;
    notes.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain();
      o.type = "square";
      o.frequency.value = f;
      var t0 = t + i * 0.11;
      env(g, t0, 0.12, 0.12);
      o.connect(g).connect(c.destination);
      o.start(t0); o.stop(t0 + 0.14);
    });
  }

  window.AudioSys = {
    unlock: ensure,
    laser: laser,
    enemyExplode: function () { explode(false); },
    playerExplode: function () { explode(true); },
    levelClear: function () { jingle(false); },
    win: function () { jingle(true); }
  };
})();
