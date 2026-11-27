function mountListingTicker(ticker, createRepeatedCards) {
  const viewport = ticker.querySelector('#tickerViewport');
  const list = ticker.querySelector('#recentItems');
  const repeat = ticker.querySelector('#tickerRepeat');
  const controls = ticker.querySelector('#tickerControls');
  const toggle = ticker.querySelector('#tickerToggle');
  const toggleText = ticker.querySelector('#tickerToggleText');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const speed = 28;

  let paused = reducedMotion.matches;
  let hovered = false;
  let focused = false;
  let visible = !('IntersectionObserver' in window);
  let period = 0;
  let cardStep = 0;
  let repeatedCount = 0;
  let frame = null;
  let lastTime = null;
  let position = 0;

  function canAdvance() {
    return period > 0 && visible && !document.hidden && !paused && !hovered && !focused;
  }

  function advance(time) {
    frame = null;
    if (!canAdvance()) return;

    if (lastTime !== null) {
      const seconds = Math.min(time - lastTime, 48) / 1000;
      position = (position + seconds * speed) % period;
      viewport.scrollLeft = position;
    }
    lastTime = time;
    frame = requestAnimationFrame(advance);
  }

  function syncMotion() {
    if (canAdvance()) {
      if (frame !== null) return;
      lastTime = null;
      position = viewport.scrollLeft % period;
      frame = requestAnimationFrame(advance);
    } else if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  }

  function setPaused(value) {
    paused = value;
    toggle.classList.toggle('is-paused', paused);
    toggleText.textContent = paused ? 'Reproduzir' : 'Pausar';
    toggle.setAttribute('aria-label', paused ? 'Reproduzir rolagem automática' : 'Pausar rolagem automática');
    syncMotion();
  }

  function measure() {
    if (!list.firstElementChild) {
      period = 0;
      repeat.replaceChildren();
      repeat.hidden = true;
      syncMotion();
      return;
    }
    const gap = parseFloat(getComputedStyle(list).columnGap) || 0;
    cardStep = list.firstElementChild.getBoundingClientRect().width + gap;
    const overflows = list.scrollWidth + 8 > viewport.clientWidth;
    controls.hidden = !overflows;

    const needed = overflows ? Math.min(list.childElementCount, Math.ceil(viewport.clientWidth / cardStep) + 1) : 0;
    if (needed !== repeatedCount) {
      repeat.replaceChildren(...createRepeatedCards(needed));
      repeat.hidden = needed === 0;
      repeatedCount = needed;
    }

    period = overflows ? list.getBoundingClientRect().width + gap : 0;
    syncMotion();
  }

  function step(direction) {
    setPaused(true);
    let from = viewport.scrollLeft;
    if (direction < 0 && from < 1) {
      from = period;
      viewport.scrollLeft = from;
    } else if (direction > 0 && from >= period) {
      from %= period;
      viewport.scrollLeft = from;
    }
    viewport.scrollTo({ left: from + direction * cardStep, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }

  ticker.querySelector('#tickerPrevious').addEventListener('click', () => step(-1));
  ticker.querySelector('#tickerNext').addEventListener('click', () => step(1));
  toggle.addEventListener('click', () => setPaused(!paused));
  viewport.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovered = true;
    syncMotion();
  });
  viewport.addEventListener('pointerleave', () => {
    hovered = false;
    syncMotion();
  });
  viewport.addEventListener('pointerdown', () => setPaused(true));
  viewport.addEventListener('wheel', event => {
    if (event.deltaX !== 0 || event.shiftKey) setPaused(true);
  }, { passive: true });
  viewport.addEventListener('focusin', () => {
    focused = true;
    syncMotion();
  });
  viewport.addEventListener('focusout', event => {
    focused = viewport.contains(event.relatedTarget);
    syncMotion();
  });
  document.addEventListener('visibilitychange', syncMotion);
  reducedMotion.addEventListener('change', event => {
    if (event.matches) setPaused(true);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncMotion();
    }, { threshold: 0.12 }).observe(viewport);
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(measure).observe(viewport);
  } else {
    window.addEventListener('resize', measure);
  }
  setPaused(paused);
  measure();
  return () => {
    repeatedCount = -1;
    measure();
  };
}

