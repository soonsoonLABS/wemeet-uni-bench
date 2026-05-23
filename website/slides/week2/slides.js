/* =========================================================================
   wemeet-uni-bench Week 2 Slides — keyboard navigation
   ========================================================================= */

const slides = document.querySelectorAll('.slide');
const total = slides.length;
let current = 0;

const $progress = document.getElementById('progress');
const $current = document.getElementById('current');
const $totalEl = document.getElementById('total');

$totalEl.textContent = String(total).padStart(2, '0');

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

  // Update URL hash for deep linking
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
      // Toggle fullscreen
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

// Click to advance (right half) / go back (left half)
document.addEventListener('click', (e) => {
  // Don't trigger on links/buttons
  if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') return;
  const rect = document.body.getBoundingClientRect();
  if (e.clientX < rect.width * 0.3) prev();
  else if (e.clientX > rect.width * 0.7) next();
});

// Init from hash
const initial = parseInt(location.hash.slice(1), 10);
show(isFinite(initial) && initial > 0 ? initial - 1 : 0);
