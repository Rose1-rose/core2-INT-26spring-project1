// Subtle drifting fragments (no libs)
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  const field = document.querySelector(".field") || document.body;
  const fragments = Array.from(document.querySelectorAll(".fragment"));

  // Read initial positions from inline style left/top (percent or px)
  const state = fragments.map((el) => {
    const rect = el.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();

    // Current center position relative to field
    const x = rect.left - fieldRect.left + rect.width / 2;
    const y = rect.top - fieldRect.top + rect.height / 2;

    // Per-fragment random drift params
    const baseSpeed = rand(0.06, 0.18);        // px per ms (very slow)
    const angle = rand(0, Math.PI * 2);
    const vx = Math.cos(angle) * baseSpeed;
    const vy = Math.sin(angle) * baseSpeed;

    const wobbleAmp = rand(2, 10);            // px
    const wobbleFreq = rand(0.0004, 0.0012);  // radians per ms

    return { el, x, y, vx, vy, wobbleAmp, wobbleFreq, wSeed: rand(0, 10000) };
  });

  let last = performance.now();

  function tick(now) {
    const dt = now - last;
    last = now;

    const fieldRect = field.getBoundingClientRect();

    state.forEach((s) => {
      // Pause movement when hovering (easier to click)
      if (s.el.matches(":hover")) return;

      // Move
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      // Keep within bounds (bounce)
      const r = s.el.getBoundingClientRect();
      const w = r.width;
      const h = r.height;

      const minX = w / 2 + 12;
      const maxX = fieldRect.width - w / 2 - 12;
      const minY = h / 2 + 12;
      const maxY = fieldRect.height - h / 2 - 12;

      if (s.x < minX) { s.x = minX; s.vx *= -1; }
      if (s.x > maxX) { s.x = maxX; s.vx *= -1; }
      if (s.y < minY) { s.y = minY; s.vy *= -1; }
      if (s.y > maxY) { s.y = maxY; s.vy *= -1; }

      // Wobble (tiny organic motion)
      const wob = Math.sin((now + s.wSeed) * s.wobbleFreq) * s.wobbleAmp;

      // IMPORTANT: your CSS already uses transform: translate(-50%,-50%)
      // We'll preserve that and add a pixel translate.
      s.el.style.transform = `translate(-50%, -50%) translate(${wob}px, ${-wob * 0.35}px)`;
      s.el.style.left = `${s.x}px`;
      s.el.style.top = `${s.y}px`;
    });

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}
