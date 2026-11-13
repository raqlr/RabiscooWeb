(() => {
  const wall = document.getElementById('picture-wall');
  const pictures = [...wall.querySelectorAll('.picture')];
  const status = document.getElementById('wall-status');
  const storageKey = 'rabiscoo-picture-wall-v1';
  let positions = {}, topLayer = 1, drag = null;
  try { positions = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch {}
  if (!positions || typeof positions !== 'object' || Array.isArray(positions)) positions = {};
  const clamp = (value, max) => Math.max(0, Math.min(value, Math.max(0, max)));
  function defaults(index) {
    const narrow = wall.clientWidth < 640;
    return narrow ? [[.03,.02],[.97,.08],[.03,.48],[.97,.53],[.5,.94]][index]
      : [[.02,.04],[.5,.02],[.98,.04],[.22,.85],[.78,.85]][index];
  }
  function dimensions(picture) {
    // A small inset keeps tilted corners inside the wall.
    return { x: Math.max(0, wall.clientWidth - picture.offsetWidth - 16), y: Math.max(0, wall.clientHeight - picture.offsetHeight - 16) };
  }
  function place(picture, x, y) {
    const limit = dimensions(picture);
    const left = clamp(x, limit.x), top = clamp(y, limit.y);
    picture.style.left = `${left + 8}px`;
    picture.style.top = `${top + 8}px`;
    positions[picture.dataset.id] = { x: limit.x ? left / limit.x : 0, y: limit.y ? top / limit.y : 0 };
  }
  function layout() {
    pictures.forEach((picture, index) => {
      const saved = positions[picture.dataset.id];
      const [x,y] = saved && Number.isFinite(saved.x) && Number.isFinite(saved.y) ? [saved.x,saved.y] : defaults(index);
      const limit = dimensions(picture);
      place(picture, x * limit.x, y * limit.y);
    });
  }
  function save() { try { localStorage.setItem(storageKey, JSON.stringify(positions)); } catch {} }
  pictures.forEach(picture => {
    picture.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || drag) return;
      picture.focus({preventScroll:true});
      picture.style.zIndex = ++topLayer;
      drag = { picture, pointerId:event.pointerId, x:event.clientX, y:event.clientY, left:parseFloat(picture.style.left)-8, top:parseFloat(picture.style.top)-8 };
      picture.setPointerCapture(event.pointerId);
      picture.classList.add('is-dragging');
    });
    picture.addEventListener('pointermove', event => {
      if (!drag || drag.picture !== picture || drag.pointerId !== event.pointerId) return;
      place(picture, drag.left + event.clientX - drag.x, drag.top + event.clientY - drag.y);
    });
    function finish(event) {
      if (!drag || drag.picture !== picture || drag.pointerId !== event.pointerId) return;
      picture.classList.remove('is-dragging');
      drag = null;
      save();
      status.textContent = `${picture.querySelector('img').alt} moved.`;
    }
    ['pointerup','pointercancel','lostpointercapture'].forEach(name => picture.addEventListener(name, finish));
    picture.addEventListener('keydown', event => {
      const directions = {ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
      const direction = directions[event.key];
      if (!direction) return;
      event.preventDefault();
      const step = event.shiftKey ? 30 : 10;
      picture.style.zIndex = ++topLayer;
      place(picture, parseFloat(picture.style.left)-8+direction[0]*step, parseFloat(picture.style.top)-8+direction[1]*step);
      save();
    });
  });
  layout();
  pictures.forEach(picture => picture.querySelector('img').addEventListener('load', layout));
  new ResizeObserver(layout).observe(wall);
})();
