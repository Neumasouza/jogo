/* Pools: evita GC spikes (principio de performance). */
(function () {
  function makePool(n, factory) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(factory());
    return {
      items: a,
      spawn: function () {
        for (var i = 0; i < a.length; i++) if (!a[i].active) return a[i];
        return null;
      },
      active: function () {
        return a.filter(function (o) { return o.active; });
      },
      clear: function () { a.forEach(function (o) { o.active = false; }); }
    };
  }

  window.Pools = {
    makePlayerBullets: function () {
      return makePool(24, function () {
        return { active: false, x: 0, y: 0, w: 2, h: 8, speed: 430 };
      });
    },
    makeEnemyBullets: function () {
      return makePool(6, function () {
        return { active: false, x: 0, y: 0, w: 3, h: 7, speed: 110 };
      });
    },
    makeParticles: function () {
      return makePool(120, function () {
        return { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, color: "#fff", size: 1 };
      });
    }
  };
})();
