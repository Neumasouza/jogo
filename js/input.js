/* Abstracao de input em ACOES: left / right / fire.
   Teclado + botoes touch + arrastar no canvas. */
(function () {
  var S = { left: false, right: false, fireHeld: false, firePressed: false, dragX: null };

  function init(canvas, onFirstInteract) {
    var fired = false;
    function first() { if (!fired) { fired = true; if (onFirstInteract) onFirstInteract(); } }

    window.addEventListener("keydown", function (e) {
      first();
      if (e.repeat) { if (isFire(e)) e.preventDefault(); return; }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") S.left = true;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") S.right = true;
      if (isFire(e)) { S.fireHeld = true; S.firePressed = true; e.preventDefault(); }
    });
    window.addEventListener("keyup", function (e) {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") S.left = false;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") S.right = false;
      if (isFire(e)) S.fireHeld = false;
    });

    function isFire(e) { return e.key === " " || e.key === "z" || e.key === "Z" || e.key === "j" || e.key === "J"; }

    function bindHold(el, prop) {
      function on(e) { e.preventDefault(); first(); S[prop] = true; if (prop === "fireHeld") S.firePressed = true; }
      function off(e) { e.preventDefault(); S[prop] = false; }
      el.addEventListener("touchstart", on, { passive: false });
      el.addEventListener("touchend", off, { passive: false });
      el.addEventListener("touchcancel", off, { passive: false });
      el.addEventListener("mousedown", on);
      el.addEventListener("mouseup", off);
      el.addEventListener("mouseleave", off);
    }
    bindHold(document.getElementById("t-left"), "left");
    bindHold(document.getElementById("t-right"), "right");
    bindHold(document.getElementById("t-fire"), "fireHeld");

    // arrastar no canvas move a nave (mobile)
    var dragging = false;
    function canvasX(e) {
      var r = canvas.getBoundingClientRect();
      var cx = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      return (cx - r.left) / r.width * 240;
    }
    canvas.addEventListener("touchstart", function (e) { first(); dragging = true; S.dragX = canvasX(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener("touchmove", function (e) { S.dragX = canvasX(e); e.preventDefault(); }, { passive: false });
    canvas.addEventListener("touchend", function () { dragging = false; S.dragX = null; });
    canvas.addEventListener("mousedown", function (e) { first(); dragging = true; S.dragX = canvasX(e); });
    window.addEventListener("mousemove", function (e) { if (dragging) S.dragX = canvasX(e); });
    window.addEventListener("mouseup", function () { dragging = false; S.dragX = null; });
  }

  window.Input = { state: S, init: init };
})();
