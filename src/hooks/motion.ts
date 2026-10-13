import { useRef } from 'react';

/**
 * The UI has no motion. These helpers keep their old signatures so call sites stay simple,
 * but they never animate: content renders in its final state and numbers show their real value.
 */

export const prefersReducedMotion = (): boolean => true;

export function useRevealOnScroll<T extends HTMLElement>(_delaySeconds = 0) {
  return useRef<T | null>(null);
}

export function useRevealGroup<T extends HTMLElement>(_baseDelaySeconds = 0) {
  return useRef<T | null>(null);
}

export function useCountUp(target: number, _enabled = true): number {
  return target;
}
