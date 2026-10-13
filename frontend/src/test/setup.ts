import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { MotionGlobalConfig } from 'motion/react';

/** Las animaciones no aportan a las pruebas y solo las demorarían. */
MotionGlobalConfig.skipAnimations = true;

/**
 * jsdom no implementa IntersectionObserver. Las animaciones de aparición lo
 * usan, así que en pruebas todo elemento observado se reporta como visible.
 */
class IntersectionObserverDePrueba implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  constructor(private readonly callback: IntersectionObserverCallback) {}
  observe(objetivo: Element) {
    this.callback(
      [{ isIntersecting: true, target: objetivo, intersectionRatio: 1 } as unknown as IntersectionObserverEntry],
      this,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

globalThis.IntersectionObserver ??= IntersectionObserverDePrueba;

// jsdom no reproduce video.
HTMLMediaElement.prototype.play = () => Promise.resolve();
HTMLMediaElement.prototype.pause = () => undefined;

// jsdom no dibuja en canvas; la secuencia de cuadros simplemente no pinta en pruebas.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
});
