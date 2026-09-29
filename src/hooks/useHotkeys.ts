import { useEffect, useLayoutEffect, useRef } from 'react';
import { tinykeys, type KeybindingsMap } from 'tinykeys';

/**
 * Registers global keybindings with tinykeys. Handlers are read through a ref,
 * so callers can pass an inline object without re-binding every render.
 * Keys typed into inputs/textareas are ignored (tinykeys default).
 */
export function useHotkeys(bindings: KeybindingsMap, enabled = true) {
  const ref = useRef(bindings);
  useLayoutEffect(() => {
    ref.current = bindings;
  });
  const signature = Object.keys(bindings).join('|');

  useEffect(() => {
    if (!enabled) return;
    const map: KeybindingsMap = {};
    for (const key of signature.split('|')) {
      map[key] = (event) => ref.current[key]?.(event);
    }
    return tinykeys(window, map);
  }, [signature, enabled]);
}
