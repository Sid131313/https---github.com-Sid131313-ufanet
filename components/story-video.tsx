'use client';

import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const FRAME_COUNT = 140;
const INITIAL_FRAME_COUNT = 25;

export function useHeroFrameSequence(
  sectionRef: RefObject<HTMLElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  setPhase: Dispatch<SetStateAction<number>>,
) {
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    gsap.registerPlugin(ScrollTrigger);
    const context = canvas.getContext('2d');
    if (!context) return;

    const source = matchMedia('(max-width: 700px)').matches ? 'mobile' : 'desktop';
    const frames = new Map<number, HTMLImageElement>();
    const requests = new Map<number, Array<() => void>>();
    const attempts = new Uint8Array(FRAME_COUNT);
    const loading = new Set<number>();
    const queue: number[] = [];
    const playhead = { frame: 0 };
    let animation: gsap.core.Tween | undefined;
    let disposed = false;
    let desiredFrame = 0;
    let previousTarget = 0;
    let drawnFrame = -1;
    let resizeFrame = 0;
    let backgroundTimer = 0;

    const frameUrl = (index: number) =>
      `/hero-frames/${source}/frame_${String(index).padStart(4, '0')}.webp`;

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        drawnFrame = -1;
      }
    };

    const paint = (image: HTMLImageElement, index: number) => {
      sizeCanvas();
      if (drawnFrame === index) return;
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
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
      drawnFrame = index;
    };

    const renderNearest = (index: number) => {
      const exact = frames.get(index);
      if (exact) return paint(exact, index);
      for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
        const previous = frames.get(index - distance);
        const next = frames.get(index + distance);
        if (previous) return paint(previous, index - distance);
        if (next) return paint(next, index + distance);
      }
    };

    const resolveRequest = (index: number) => {
      requests.get(index)?.forEach(resolve => resolve());
      requests.delete(index);
    };

    const pump = () => {
      if (disposed) return;
      while (loading.size < 4 && queue.length) {
        const index = queue.shift();
        if (index === undefined || frames.has(index) || loading.has(index)) continue;
        loading.add(index);
        attempts[index] += 1;
        const image = new Image();
        image.decoding = 'async';
        if (index === 0) image.fetchPriority = 'high';
        image.onload = () => {
          if (disposed) return;
          frames.set(index, image);
          loading.delete(index);
          resolveRequest(index);
          if (Math.abs(index - desiredFrame) <= 2) renderNearest(desiredFrame);
          pump();
        };
        image.onerror = () => {
          if (disposed) return;
          loading.delete(index);
          if (attempts[index] < 2) queue.unshift(index);
          else resolveRequest(index);
          pump();
        };
        image.src = frameUrl(index);
      }
    };

    const requestFrame = (index: number, priority = false) => {
      if (index < 0 || index >= FRAME_COUNT || frames.has(index)) return Promise.resolve();
      return new Promise<void>(resolve => {
        const pending = requests.get(index);
        if (pending) {
          pending.push(resolve);
          if (priority && !loading.has(index)) {
            const queueIndex = queue.indexOf(index);
            if (queueIndex >= 0) queue.splice(queueIndex, 1);
            queue.unshift(index);
          }
          pump();
          return;
        }
        requests.set(index, [resolve]);
        if (priority) queue.unshift(index);
        else queue.push(index);
        pump();
      });
    };

    const prioritizeAround = (index: number) => {
      const direction = index >= previousTarget ? 1 : -1;
      void requestFrame(index, true);
      for (let distance = 1; distance <= 8; distance += 1) {
        void requestFrame(index + distance * direction, true);
        void requestFrame(index - distance * direction, true);
      }
      previousTarget = index;
    };

    const render = () => {
      desiredFrame = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(playhead.frame)));
      prioritizeAround(desiredFrame);
      renderNearest(desiredFrame);
      const progress = desiredFrame / (FRAME_COUNT - 1);
      const nextPhase = progress < 0.34 ? 0 : progress < 0.66 ? 1 : 2;
      setPhase(value => (value === nextPhase ? value : nextPhase));
      section.style.setProperty('--story-progress', progress.toFixed(4));
    };

    const warmup = Array.from({ length: INITIAL_FRAME_COUNT }, (_, index) =>
      requestFrame(index, index === 0),
    );

    void warmup[0].then(() => {
      if (disposed) return;
      renderNearest(0);
      animation = gsap.to(playhead, {
        frame: FRAME_COUNT - 1,
        ease: 'none',
        onUpdate: render,
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: matchMedia('(prefers-reduced-motion: reduce)').matches ? true : 0.28,
          invalidateOnRefresh: true,
        },
      });
      ScrollTrigger.refresh();
    });

    void Promise.all(warmup).then(() => {
      if (disposed) return;
      backgroundTimer = window.setTimeout(() => {
        for (let index = INITIAL_FRAME_COUNT; index < FRAME_COUNT; index += 1) void requestFrame(index);
      }, 250);
    });

    const handleResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        drawnFrame = -1;
        renderNearest(desiredFrame);
        ScrollTrigger.refresh();
      });
    };

    addEventListener('resize', handleResize, { passive: true });
    return () => {
      disposed = true;
      removeEventListener('resize', handleResize);
      cancelAnimationFrame(resizeFrame);
      clearTimeout(backgroundTimer);
      animation?.scrollTrigger?.kill();
      animation?.kill();
    };
  }, [canvasRef, sectionRef, setPhase]);

}
