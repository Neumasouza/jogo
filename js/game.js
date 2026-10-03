/* Game: state machine MENU/PLAYING/DYING/LEVELCLEAR/GAMEOVER/WIN.
   Loop fixo 60Hz, colisao AABB com hitbox reduzida (precisao arcade). */
(function () {
  var W = 240, H = 320;
  var PLAYER_Y = 284;
  var ENERGY_MAX = 100, ENERGY_DRAIN = 3.6, WAVE_BONUS = 40;
  var FIRE_CD = 0.17;

  function aabb(ax, ay, aw, ah, bx, by, bw, bh, shrink) {
    shrink = shrink || 0.2;
    var asx = aw * shrink, asy = ah * shrink;
    var bsx = bw * shrink, bsy = bh * shrink;
    return (ax - aw / 2 + asx < bx + bw / 2 - bsx &&
            ax + aw / 2 - asx > bx - bw / 2 + bsx &&
            ay - ah / 2 + asy < by + bh / 2 - bsy &&
            ay + ah / 2 - asy > by - bh / 2 + bsy);
  }

  var Game = {
    state: "menu",
    score: 0, hi: 0, lives: 3, level: 0,
    energy: ENERGY_MAX,
    time: 0, levelTime: 0, formX: W / 2, formY: 40,
    fireTimer: 0, enemyShootT: 0, bannerT: 0, deadT: 0,
    endlessMul: 1,
    player: { x: W / 2, y: PLAYER_Y, w: 14, h: 10, speed: 185 },
    enemies: [],
    pBullets: null, eBullets: null, parts: null,
    stars: [],
    onBanner: null, onGameOver: null,

    init: function () {
      try { this.hi = parseInt(localStorage.getItem("megamania_hi") || "0", 10) || 0; } catch (e) { this.hi = 0; }
      this.pBullets = Pools.makePlayerBullets();
      this.eBullets = Pools.makeEnemyBullets();
      this.parts = Pools.makeParticles();
      this.stars = [];
      for (var i = 0; i < 36; i++) this.stars.push({ x: Math.random() * W, y: Math.random() * H, s: Math.random() < 0.3 ? 2 : 1 });
    },

    start: function () {
      this.score = 0; this.lives = 3; this.level = 0; this.endlessMul = 1;
      this.energy = ENERGY_MAX;
      this.state = "playing";
      this.loadLevel(0);
    },

    levelDef: function () {
      if (this.level < Levels.length) return Levels[this.level];
      var last = Levels[Levels.length - 1];
      // endless: reusa diamantes com velocidade maior
      return { name: "MODO INFINITO " + (this.level + 1), sprite: last.sprite, cols: last.cols, rows: last.rows, speed: last.speed * this.endlessMul, zigAmp: last.zigAmp, zigFreq: last.zigFreq + 0.2, shootEvery: Math.max(0.7, last.shootEvery - 0.15 * (this.level - 4)), score: last.score + 50 * (this.level - 4) };
    },

    loadLevel: function (idx) {
      this.level = idx;
      var def = this.levelDef();
      this.enemies = [];
      var sx = 30, sy = 22;
      for (var r = 0; r < def.rows; r++)
        for (var c = 0; c < def.cols; c++)
          this.enemies.push({ c: c, r: r, x: 0, y: 0, w: 14, h: 10, alive: true });
      this.levelTime = 0; this.formY = 42;
      this.pBullets.clear(); this.eBullets.clear();
      this.energy = ENERGY_MAX;
      this.enemyShootT = 1.2;
      this.fireTimer = 0;
      this.banner("FASE " + (idx + 1) + " — " + def.name, 2.2);
    },

    banner: function (txt, dur) {
      this.bannerT = dur;
      if (this.onBanner) this.onBanner(txt, dur);
    },

    aliveCount: function () {
      var n = 0;
      for (var i = 0; i < this.enemies.length; i++) if (this.enemies[i].alive) n++;
      return n;
    },

    explodeAt: function (x, y, colors, n, spd) {
      for (var i = 0; i < n; i++) {
        var p = this.parts.spawn(); if (!p) return;
        var a = Math.random() * Math.PI * 2;
        var v = spd * (0.4 + Math.random());
        p.active = true; p.x = x; p.y = y;
        p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v;
        p.max = p.life = 0.35 + Math.random() * 0.35;
        p.color = colors[(Math.random() * colors.length) | 0];
        p.size = Math.random() < 0.4 ? 2 : 1;
      }
    },

    killPlayer: function (reason) {
      if (this.state !== "playing") return;
      this.state = "dying";
      this.deadT = 1.4;
      this.explodeAt(this.player.x, this.player.y, ["#00FFFF", "#FFFFFF", "#FF2244", "#FFE600"], 46, 90);
      AudioSys.playerExplode();
    },

    update: function (dt, inp) {
      this.time += dt;
      // estrelas sempre
      for (var i = 0; i < this.stars.length; i++) {
        this.stars[i].y += 12 * dt;
        if (this.stars[i].y > H) { this.stars[i].y = 0; this.stars[i].x = Math.random() * W; }
      }
      // particulas sempre
      var ps = this.parts.items;
      for (var k = 0; k < ps.length; k++) {
        var p = ps[k]; if (!p.active) continue;
        p.life -= dt;
        if (p.life <= 0) { p.active = false; continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.985; p.vy *= 0.985;
      }
      if (this.bannerT > 0) this.bannerT -= dt;

      if (this.state === "dying") {
        this.deadT -= dt;
        this.updateBullets(dt);
        if (this.deadT <= 0) {
          this.lives--;
          if (this.lives < 0) return this.setGameOver(false);
          this.energy = ENERGY_MAX;
          this.player.x = W / 2;
          this.eBullets.clear(); this.pBullets.clear();
          this.state = "playing";
        }
        return;
      }
      if (this.state !== "playing") return;

      var def = this.levelDef();
      this.levelTime += dt;

      // --- energia drena sempre ---
      this.energy -= ENERGY_DRAIN * dt;
      if (this.energy <= 0) { this.energy = 0; this.killPlayer("fuel"); return; }

      // --- player ---
      var pl = this.player;
      if (inp.state.dragX != null) {
        var dx = inp.state.dragX - pl.x;
        pl.x += Math.max(-1, Math.min(1, dx * 0.25)) * pl.speed * dt * 1.6;
      } else {
        if (inp.state.left) pl.x -= pl.speed * dt;
        if (inp.state.right) pl.x += pl.speed * dt;
      }
      if (pl.x < 12) pl.x = 12;
      if (pl.x > W - 12) pl.x = W - 12;

      // tiro rapido
      this.fireTimer -= dt;
      if ((inp.state.firePressed || inp.state.fireHeld) && this.fireTimer <= 0) {
        var b = this.pBullets.spawn();
        if (b) {
          b.active = true; b.x = pl.x; b.y = pl.y - 10;
          AudioSys.laser();
          this.fireTimer = FIRE_CD;
        }
      }
      inp.state.firePressed = false;

      // --- formacao zigue-zague + descida lenta ---
      var spdMul = this.level >= Levels.length ? this.endlessMul : 1;
      this.formX = W / 2 + Math.sin(this.levelTime * def.zigFreq) * def.zigAmp;
      this.formY += def.speed * spdMul * 0.16 * dt; // descida lenta
      if (this.formY > 120) this.formY = 42;
      var stepX = 30, stepY = 22;
      for (var e = 0; e < this.enemies.length; e++) {
        var en = this.enemies[e]; if (!en.alive) continue;
        var offX = (en.c - (def.cols - 1) / 2) * stepX + Math.sin(this.levelTime * 2 + en.r * 1.3 + en.c) * 5;
        en.x = this.formX + offX;
        en.y = this.formY + en.r * stepY;
        if (en.x < 10) en.x = 10;
        if (en.x > W - 10) en.x = W - 10;
      }

      // --- tiro inimigo: um de cada vez ---
      var anyEB = false;
      var ebs = this.eBullets.items;
      for (var j = 0; j < ebs.length; j++) if (ebs[j].active) { anyEB = true; break; }
      this.enemyShootT -= dt;
      if (!anyEB && this.enemyShootT <= 0 && this.aliveCount() > 0) {
        // escolhe o mais baixo de uma coluna aleatoria viva
        var alive = this.enemies.filter(function (x) { return x.alive; });
        var shooter = alive[(Math.random() * alive.length) | 0];
        var eb = this.eBullets.spawn();
        if (eb) {
          eb.active = true; eb.x = shooter.x; eb.y = shooter.y + 8;
          eb.speed = 95 + this.level * 10;
        }
        this.enemyShootT = def.shootEvery * (0.8 + Math.random() * 0.5);
      }

      this.updateBullets(dt);

      // --- colisoes ---
      var pbs = this.pBullets.items;
      for (var bi = 0; bi < pbs.length; bi++) {
        var pb = pbs[bi]; if (!pb.active) continue;
        for (var ei = 0; ei < this.enemies.length; ei++) {
          var enemy = this.enemies[ei]; if (!enemy.alive) continue;
          if (aabb(pb.x, pb.y, pb.w, pb.h, enemy.x, enemy.y, enemy.w, enemy.h)) {
            pb.active = false; enemy.alive = false;
            this.score += def.score;
            if (this.score > this.hi) { this.hi = this.score; try { localStorage.setItem("megamania_hi", String(this.hi)); } catch (err) {} }
            this.explodeAt(enemy.x, enemy.y, ["#FFE600", "#FF5500", "#FFFFFF"], 18, 70);
            AudioSys.enemyExplode();
            break;
          }
        }
      }
      // player x inimigo / tiro inimigo
      for (var qi = 0; qi < this.enemies.length; qi++) {
        var en2 = this.enemies[qi]; if (!en2.alive) continue;
        if (aabb(pl.x, pl.y, pl.w, pl.h, en2.x, en2.y, en2.w, en2.h)) { this.killPlayer("crash"); return; }
      }
      for (var mi = 0; mi < ebs.length; mi++) {
        var ebo = ebs[mi]; if (!ebo.active) continue;
        if (aabb(pl.x, pl.y, pl.w, pl.h, ebo.x, ebo.y, ebo.w, ebo.h)) { this.killPlayer("shot"); return; }
      }

      // --- onda limpa ---
      if (this.aliveCount() === 0) {
        this.energy = Math.min(ENERGY_MAX, this.energy + WAVE_BONUS);
        AudioSys.levelClear();
        this.score += 500;
        if (this.level + 1 >= Levels.length && this.endlessMul >= 1 && this.level >= Levels.length) {
          // continua infinito
        }
        if (this.level + 1 < 99) {
          this.state = "levelclear";
          this.deadT = 1.6;
          this.banner("ONDA DESTRUIDA! +500", 1.6);
        }
      }
    },

    updateLevelClear: function (dt) {
      this.time += dt;
      if (this.bannerT > 0) this.bannerT -= dt;
      this.deadT -= dt;
      this.updateBullets(dt);
      if (this.deadT <= 0) {
        if (this.level + 1 >= Levels.length) {
          // apos fase 5 entra em infinito cada vez mais rapido
          if (this.level >= Levels.length) this.endlessMul += 0.18;
          else AudioSys.win();
        }
        this.state = "playing";
        this.loadLevel(this.level + 1);
      }
    },

    updateBullets: function (dt) {
      var pbs = this.pBullets.items;
      for (var i = 0; i < pbs.length; i++) {
        var b = pbs[i]; if (!b.active) continue;
        b.y -= b.speed * dt;
        if (b.y < -12) b.active = false;
      }
      var ebs = this.eBullets.items;
      for (var j = 0; j < ebs.length; j++) {
        var e = ebs[j]; if (!e.active) continue;
        e.y += e.speed * dt;
        if (e.y > H + 12) e.active = false;
      }
    },

    setGameOver: function (win) {
      this.state = win ? "win" : "gameover";
      if (this.onGameOver) this.onGameOver(win, this.score, this.hi);
    },

    render: function (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      // estrelas sutis (mantem fundo preto)
      ctx.fillStyle = "#333";
      for (var i = 0; i < this.stars.length; i++) {
        var s = this.stars[i];
        ctx.fillRect(s.x | 0, s.y | 0, s.s, s.s);
      }
      var def = this.levelDef();

      if (this.state === "menu") return; // overlay DOM cobre

      // inimigos
      for (var e = 0; e < this.enemies.length; e++) {
        var en = this.enemies[e]; if (!en.alive) continue;
        Sprites.draw(ctx, def.sprite, en.x, en.y);
      }
      // nave
      if (this.state !== "dying" || ((this.time * 12) | 0) % 2 === 0) {
        if (this.state === "playing" || this.state === "levelclear" || this.state === "dying")
          Sprites.draw(ctx, "player", this.player.x, this.player.y);
      }
      // balas player: neon rapido
      var pbs = this.pBullets.items;
      ctx.fillStyle = "#FFFF00";
      for (var bi = 0; bi < pbs.length; bi++) {
        var b = pbs[bi]; if (!b.active) continue;
        ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 6), 2, 8);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(Math.round(b.x - 1), Math.round(b.y - 6), 2, 3);
        ctx.fillStyle = "#FFFF00";
      }
      // balas inimigas: poucas, lentas, rosas
      var ebs = this.eBullets.items;
      ctx.fillStyle = "#FF55AA";
      for (var mi = 0; mi < ebs.length; mi++) {
        var eb = ebs[mi]; if (!eb.active) continue;
        ctx.fillRect(Math.round(eb.x - 1), Math.round(eb.y - 3), 3, 7);
      }
      // particulas
      var ps = this.parts.items;
      for (var k = 0; k < ps.length; k++) {
        var p = ps[k]; if (!p.active) continue;
        ctx.globalAlpha = Math.max(0, p.life / p.max);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      this.renderHUD(ctx);
    },

    renderHUD: function (ctx) {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, 22);
      ctx.fillStyle = "#222";
      ctx.fillRect(0, 22, W, 1);
      ctx.font = "8px monospace";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#FFE600";
      ctx.fillText("SCORE " + this.score, 4, 4);
      ctx.fillStyle = "#00FFFF";
      var hiTxt = "HI " + this.hi;
      ctx.fillText(hiTxt, W - 4 - hiTxt.length * 5, 4);
      ctx.fillStyle = "#39FF14";
      ctx.fillText("F" + (this.level + 1) + "x" + this.lives, 4, 13);

      // barra de energia inferior
      var by = H - 16;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, H - 20, W, 20);
      ctx.fillStyle = "#222";
      ctx.fillRect(0, H - 20, W, 1);
      ctx.fillStyle = this.energy < 25 && ((this.time * 6) | 0) % 2 === 0 ? "#FF0000" : "#FFFFFF";
      ctx.fillText("ENERGIA", 4, by);
      var bx = 58, bw = W - 62;
      ctx.fillStyle = "#333";
      ctx.fillRect(bx - 1, by - 1, bw + 2, 10);
      var pct = this.energy / ENERGY_MAX;
      var col = pct > 0.5 ? "#39FF14" : pct > 0.25 ? "#FFE600" : "#FF2244";
      ctx.fillStyle = col;
      ctx.fillRect(bx, by, Math.round(bw * pct), 8);
    }
  };

  // levelclear roda dentro do update principal via proxy
  var baseUpdate = Game.update;
  Game.update = function (dt, inp) {
    if (this.state === "levelclear") return this.updateLevelClear(dt);
    return baseUpdate.call(this, dt, inp);
  };

  window.Game = Game;
})();
