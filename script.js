'use strict';

(() => {
  const FRAME_COUNT = 140;
  const INITIAL_FRAME_COUNT = 25;
  const MAX_CONCURRENT_LOADS = 4;
  const section = document.querySelector('.story');
  const canvas = document.querySelector('.story-canvas');

  if (section instanceof HTMLElement && canvas instanceof HTMLCanvasElement) {
    const context = canvas.getContext('2d');

    if (context) {
      const source = matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop';
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const frames = new Map();
      const attempts = new Uint8Array(FRAME_COUNT);
      const loading = new Set();
      const queued = new Set();
      const queue = [];
      const waiters = new Map();
      const phaseElements = [...document.querySelectorAll('[data-story-phase]')];
      let desiredFrame = 0;
      let previousTarget = 0;
      let drawnFrame = -1;
      let targetProgress = 0;
      let currentProgress = 0;
      let activePhase = 0;
      let animationFrame = 0;
      let resizeFrame = 0;

      const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
      const frameUrl = (index) => `./public/hero-frames/${source}/frame_${String(index).padStart(4, '0')}.webp`;

      const sizeCanvas = () => {
        const rectangle = canvas.getBoundingClientRect();
        const pixelRatio = Math.min(devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.round(rectangle.width * pixelRatio));
        const height = Math.max(1, Math.round(rectangle.height * pixelRatio));

        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          drawnFrame = -1;
        }
      };

      const paint = (image, index) => {
        sizeCanvas();
        if (drawnFrame === index || !image.naturalWidth || !image.naturalHeight) return;

        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = image.naturalWidth / image.naturalHeight;
        let sourceX = 0;
        let sourceY = 0;
        let sourceWidth = image.naturalWidth;
        let sourceHeight = image.naturalHeight;

        if (imageRatio > canvasRatio) {
          sourceWidth = image.naturalHeight * canvasRatio;
          sourceX = (image.naturalWidth - sourceWidth) / 2;
        } else {
          sourceHeight = image.naturalWidth / canvasRatio;
          sourceY = (image.naturalHeight - sourceHeight) / 2;
        }

        context.fillStyle = '#140f16';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
          image,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        drawnFrame = index;
      };

      const renderNearest = (index) => {
        const exact = frames.get(index);
        if (exact) {
          paint(exact, index);
          return;
        }

        for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
          const previous = frames.get(index - distance);
          const next = frames.get(index + distance);
          if (previous) {
            paint(previous, index - distance);
            return;
          }
          if (next) {
            paint(next, index + distance);
            return;
          }
        }
      };

      const settleWaiters = (index) => {
        const callbacks = waiters.get(index) || [];
        callbacks.forEach((resolve) => resolve());
        waiters.delete(index);
      };

      const enqueue = (index, priority = false) => {
        if (index < 0 || index >= FRAME_COUNT || frames.has(index) || loading.has(index)) return;

        if (queued.has(index)) {
          if (priority) {
            const position = queue.indexOf(index);
            if (position >= 0) queue.splice(position, 1);
            queue.unshift(index);
          }
          return;
        }

        queued.add(index);
        if (priority) queue.unshift(index);
        else queue.push(index);
      };

      const pump = () => {
        while (loading.size < MAX_CONCURRENT_LOADS && queue.length) {
          const index = queue.shift();
          queued.delete(index);
          if (frames.has(index) || loading.has(index)) continue;

          loading.add(index);
          attempts[index] += 1;
          const image = new Image();
          image.decoding = 'async';
          if (index === 0) image.fetchPriority = 'high';

          image.onload = () => {
            frames.set(index, image);
            loading.delete(index);
            settleWaiters(index);
            if (Math.abs(index - desiredFrame) <= 2) renderNearest(desiredFrame);
            pump();
          };

          image.onerror = () => {
            loading.delete(index);
            if (attempts[index] < 2) enqueue(index, true);
            else settleWaiters(index);
            pump();
          };

          image.src = frameUrl(index);
        }
      };

      const requestFrame = (index, priority = false) => {
        if (index < 0 || index >= FRAME_COUNT || frames.has(index)) return Promise.resolve();

        const promise = new Promise((resolve) => {
          const callbacks = waiters.get(index) || [];
          callbacks.push(resolve);
          waiters.set(index, callbacks);
        });

        enqueue(index, priority);
        pump();
        return promise;
      };

      const prioritizeAround = (index) => {
        const direction = index >= previousTarget ? 1 : -1;
        enqueue(index, true);
        for (let distance = 8; distance >= 1; distance -= 1) {
          enqueue(index - distance * direction, true);
          enqueue(index + distance * direction, true);
        }
        pump();
        previousTarget = index;
      };

      const setPhase = (phase) => {
        if (phase === activePhase) return;
        activePhase = phase;
        phaseElements.forEach((element) => {
          element.classList.toggle('is-active', Number(element.dataset.storyPhase) === phase);
        });
      };

      const renderProgress = (progress) => {
        desiredFrame = clamp(Math.round(progress * (FRAME_COUNT - 1)), 0, FRAME_COUNT - 1);
        prioritizeAround(desiredFrame);
        renderNearest(desiredFrame);
        section.style.setProperty('--story-progress', progress.toFixed(4));
        setPhase(progress < 0.7 ? 0 : 1);
      };

      const tick = () => {
        animationFrame = 0;
        const difference = targetProgress - currentProgress;
        currentProgress = reducedMotion ? targetProgress : currentProgress + difference * 0.18;

        if (Math.abs(difference) < 0.0004) currentProgress = targetProgress;
        renderProgress(currentProgress);

        if (currentProgress !== targetProgress) animationFrame = requestAnimationFrame(tick);
      };

      const requestTick = () => {
        if (!animationFrame) animationFrame = requestAnimationFrame(tick);
      };

      const updateTarget = () => {
        const rectangle = section.getBoundingClientRect();
        const scrollDistance = Math.max(1, section.offsetHeight - innerHeight);
        targetProgress = clamp(-rectangle.top / scrollDistance, 0, 1);
        requestTick();
      };

      requestFrame(0, true).then(() => renderNearest(0));
      for (let index = 1; index < INITIAL_FRAME_COUNT; index += 1) requestFrame(index);
      window.setTimeout(() => {
        for (let index = INITIAL_FRAME_COUNT; index < FRAME_COUNT; index += 1) requestFrame(index);
      }, 250);

      addEventListener('scroll', updateTarget, { passive: true });
      addEventListener('resize', () => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          drawnFrame = -1;
          sizeCanvas();
          renderNearest(desiredFrame);
          updateTarget();
        });
      }, { passive: true });

      sizeCanvas();
      updateTarget();
    }
  }

  const menuButton = document.querySelector('.menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');

  const setMenuOpen = (open) => {
    if (!(menuButton instanceof HTMLButtonElement) || !(mobileMenu instanceof HTMLElement)) return;
    menuButton.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    mobileMenu.classList.toggle('is-open', open);
    mobileMenu.setAttribute('aria-hidden', String(!open));
    if ('inert' in mobileMenu) mobileMenu.inert = !open;
  };

  if (menuButton instanceof HTMLButtonElement && mobileMenu instanceof HTMLElement) {
    if ('inert' in mobileMenu) mobileMenu.inert = true;
    menuButton.addEventListener('click', () => setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true'));
    mobileMenu.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) setMenuOpen(false);
    });
    addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    });
  }

  document.querySelectorAll('[data-scroll-to]').forEach((control) => {
    control.addEventListener('click', () => {
      const target = document.querySelector(control.getAttribute('data-scroll-to'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  const formatPhone = (value) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('7') || digits.startsWith('8')) digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let formatted = '+7';
    if (digits.length) formatted += ` ${digits.slice(0, 3)}`;
    if (digits.length > 3) formatted += ` ${digits.slice(3, 6)}`;
    if (digits.length > 6) formatted += `-${digits.slice(6, 8)}`;
    if (digits.length > 8) formatted += `-${digits.slice(8, 10)}`;
    return formatted;
  };

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('focus', () => {
      if (!input.value) input.value = '+7';
    });
    input.addEventListener('input', () => {
      input.value = formatPhone(input.value);
    });
    input.addEventListener('blur', () => {
      if (input.value === '+7') input.value = '';
    });
  });

  const addressForm = document.querySelector('#address-form');
  const addressSuccess = document.querySelector('#address-success');
  const changeAddress = document.querySelector('#change-address');

  if (addressForm instanceof HTMLFormElement && addressSuccess instanceof HTMLElement) {
    addressForm.addEventListener('submit', (event) => {
      event.preventDefault();
      addressForm.hidden = true;
      addressSuccess.hidden = false;
      addressSuccess.querySelector('h3')?.focus();
    });

    changeAddress?.addEventListener('click', () => {
      addressSuccess.hidden = true;
      addressForm.hidden = false;
      addressForm.querySelector('[name="address"]')?.focus();
    });
  }

  const connectModal = document.querySelector('#connect-modal');
  const connectForm = document.querySelector('#connect-form');
  const connectSuccess = document.querySelector('#connect-modal-success');
  let modalTrigger = null;

  const closeConnectModal = () => {
    if (!(connectModal instanceof HTMLElement)) return;
    connectModal.hidden = true;
    document.body.classList.remove('has-modal');
    if (connectForm instanceof HTMLFormElement && connectSuccess instanceof HTMLElement) {
      connectForm.hidden = false;
      connectSuccess.hidden = true;
      connectForm.reset();
    }
    if (modalTrigger instanceof HTMLElement) modalTrigger.focus();
  };

  const openConnectModal = (trigger) => {
    if (!(connectModal instanceof HTMLElement)) return;
    modalTrigger = trigger;
    connectModal.hidden = false;
    document.body.classList.add('has-modal');
    requestAnimationFrame(() => connectModal.querySelector('input')?.focus());
  };

  document.querySelectorAll('[data-open-connect]').forEach((control) => {
    control.addEventListener('click', () => openConnectModal(control));
  });

  document.querySelectorAll('[data-close-connect]').forEach((control) => {
    control.addEventListener('click', closeConnectModal);
  });

  connectForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!(connectForm instanceof HTMLFormElement) || !(connectSuccess instanceof HTMLElement)) return;
    connectForm.hidden = true;
    connectSuccess.hidden = false;
    connectSuccess.querySelector('h3')?.focus();
  });

  addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && connectModal instanceof HTMLElement && !connectModal.hidden) {
      closeConnectModal();
    }
  });
})();
