(() => {
  const garden = document.querySelector('.moss-garden');
  if (!garden) return;
  const flowers = [...garden.querySelectorAll('.header-flower')].map(element => ({
    element,
    delay: Number(element.dataset.flowerDelay),
    frames: [...element.querySelectorAll('img')]
  }));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let start = 0, distance = 1, pending = false, ready = false;

  function paint() {
    pending = false;
    if (!ready || motion.matches) {
      garden.classList.remove('is-growing');
      return;
    }
    const progress = clamp((window.scrollY - start) / distance);
    flowers.forEach(({delay, frames}) => {
      const stage = clamp((progress - delay) / (1 - 0.16)) * 3;
      frames.forEach((frame, index) => {
        frame.style.setProperty('--frame-opacity', Math.max(0, 1 - Math.abs(stage - index)));
      });
    });
    garden.classList.add('is-growing');
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(paint); }
  }
  function measure() {
    const rect = garden.getBoundingClientRect();
    const gardenTop = rect.top + window.scrollY;
    // Begin on entry, and finish while the flower heads are still visible.
    start = Math.max(0, gardenTop - window.innerHeight * 0.75);
    const visibleRunway = Math.min(...flowers.map(({element}) => {
      const flower = element.getBoundingClientRect();
      return flower.bottom + window.scrollY - gardenTop - flower.height * 0.35;
    }));
    const finish = gardenTop + Math.min(rect.height * 0.45, visibleRunway);
    distance = Math.max(1, finish - start);
    schedule();
  }
  // Retain static blooms if a frame fails to load; never show an incomplete sequence.
  Promise.all(flowers.flatMap(({frames}) => frames.map(frame => frame.decode())))
    .then(() => { ready = true; measure(); })
    .catch(() => { garden.classList.remove('is-growing'); });
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', measure, {passive: true});
  window.addEventListener('pageshow', measure);
  motion.addEventListener('change', measure);
  new ResizeObserver(measure).observe(garden);
})();
