// Fly-in + Drift fragments (no dust), runs once
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reduceMotion) {
  const field = document.querySelector(".field") || document.body;
  const fragments = Array.from(document.querySelectorAll(".fragment"));

  // Hide immediately to prevent flash
  fragments.forEach(el => { el.style.opacity = "0"; });

  const state = fragments.map((el, i) => {
    const rect = el.getBoundingClientRect();
    const fieldRect = field.getBoundingClientRect();

    const x = rect.left - fieldRect.left + rect.width / 2;
    const y = rect.top - fieldRect.top + rect.height / 2;

    // drift params (your original feel)
    const baseSpeed = rand(0.06, 0.18);
    const angle = rand(0, Math.PI * 2);
    const vx = Math.cos(angle) * baseSpeed;
    const vy = Math.sin(angle) * baseSpeed;

    const wobbleAmp = rand(2, 10);
    const wobbleFreq = rand(0.0004, 0.0012);

    // fly-in params
    const enterOffsetMag = rand(120, 260);
    const enterAngle = rand(0, Math.PI * 2);
    const enterX0 = Math.cos(enterAngle) * enterOffsetMag;
    const enterY0 = Math.sin(enterAngle) * enterOffsetMag;

    const enterDelay = 80 + i * 55;         // ms
    const enterDuration = rand(650, 950);   // ms

    return {
      el,
      x, y,
      vx, vy,
      wobbleAmp, wobbleFreq, wSeed: rand(0, 10000),
      enterX0, enterY0,
      enterDelay, enterDuration,
      bornAt: 0,
    };
  });

  // Place at takeoff position first (guarantee all "fly")
  state.forEach(s => {
    s.el.style.left = `${s.x}px`;
    s.el.style.top  = `${s.y}px`;
    s.el.style.transform =
      `translate(-50%, -50%) translate(${s.enterX0}px, ${s.enterY0}px)`;
  });

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  let last = 0;

  function tick(now) {
    if (!last) last = now;
    const dt = now - last;
    last = now;

    const fieldRect = field.getBoundingClientRect();

    state.forEach(s => {
      const hovering = s.el.matches(":hover");

      // entrance progress (0..1)
      const tRaw = (now - s.bornAt - s.enterDelay) / s.enterDuration;
      const t = Math.max(0, Math.min(1, tRaw));
      const e = easeOutCubic(t);

      // entrance offset decays to 0
      const enterX = (1 - e) * s.enterX0;
      const enterY = (1 - e) * s.enterY0;

      // fade in
      s.el.style.opacity = String(e);

      // drift + bounce
      if (!hovering) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;

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
      }

      // wobble
      const wob = Math.sin((now + s.wSeed) * s.wobbleFreq) * s.wobbleAmp;

      // apply
      s.el.style.left = `${s.x}px`;
      s.el.style.top  = `${s.y}px`;
      s.el.style.transform =
        `translate(-50%, -50%) translate(${enterX + wob}px, ${enterY - wob * 0.35}px)`;
    });

    requestAnimationFrame(tick);
  }

  // Start once after layout settles
  requestAnimationFrame(() => {
    requestAnimationFrame((now) => {
      state.forEach(s => { s.bornAt = now; });
      requestAnimationFrame(tick);
    });
  });

} else {
  // Reduced motion: show, no movement
  document.querySelectorAll(".fragment").forEach(el => {
    el.style.opacity = "1";
  });
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

