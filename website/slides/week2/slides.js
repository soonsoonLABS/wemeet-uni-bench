/* =========================================================================
   wemeet-uni-bench Week 2 Slides — keyboard navigation
   ========================================================================= */

(function () {
  const slides = document.querySelectorAll('.slide');
  const total = slides.length;

  const $progress = document.getElementById('progress');
  const $current = document.getElementById('current');
  const $totalEl = document.getElementById('total');

  $totalEl.textContent = String(total).padStart(2, '0');

  // --- DEBUG MODE: ?debug=all shows every slide stacked vertically -----------
  const params = new URLSearchParams(location.search);
  if (params.get('debug') === 'all') {
    document.body.classList.add('debug-all');
    slides.forEach((s, i) => {
      s.classList.add('is-active');
      s.style.position = 'relative';
      s.style.opacity = '1';
      s.style.visibility = 'visible';
      s.style.transform = 'none';
      s.style.borderBottom = '4px solid #d4ff3a';
      s.style.height = '100vh';
      // Add slide number label
      const label = document.createElement('div');
      label.textContent = `SLIDE ${String(i + 1).padStart(2, '0')}`;
      label.style.cssText = 'position:absolute;top:8px;left:8px;background:#d4ff3a;color:#0b0b0d;padding:6px 12px;font-family:monospace;font-weight:700;font-size:14px;z-index:999;letter-spacing:0.1em;';
      s.appendChild(label);
    });
    const slidesEl = document.getElementById('slides');
    slidesEl.style.position = 'relative';
    slidesEl.style.height = 'auto';
    slidesEl.style.overflow = 'visible';
    document.documentElement.style.overflow = 'auto';
    document.body.style.overflow = 'auto';
    $current.textContent = 'ALL';
    $progress.style.width = '100%';
    return;
  }

  // --- Normal mode -----------------------------------------------------------
  let current = 0;

  function show(index) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;

    slides.forEach((s, i) => {
      s.classList.remove('is-active', 'is-prev');
      if (i === index) {
        s.classList.add('is-active');
      } else if (i < index) {
        s.classList.add('is-prev');
      }
    });

    current = index;
    $current.textContent = String(current + 1).padStart(2, '0');
    $progress.style.width = `${((current + 1) / total) * 100}%`;
    history.replaceState(null, '', `#${current + 1}`);
  }

  function next() { show(current + 1); }
  function prev() { show(current - 1); }

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        e.preventDefault();
        prev();
        break;
      case 'Home':
        e.preventDefault();
        show(0);
        break;
      case 'End':
        e.preventDefault();
        show(total - 1);
        break;
      case 'f':
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        break;
    }
  });

  // Touch support
  let touchStartX = null;
  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  document.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX = null;
  });

  // Click navigation (left third = prev, right third = next)
  document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
    const rect = document.body.getBoundingClientRect();
    if (e.clientX < rect.width * 0.3) prev();
    else if (e.clientX > rect.width * 0.7) next();
  });

  // Init from hash
  const initial = parseInt(location.hash.slice(1), 10);
  show(isFinite(initial) && initial > 0 ? initial - 1 : 0);
})();
