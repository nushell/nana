import { useEffect, useMemo, useRef } from 'react';

// Aliases for various keyboard events, allowing shortcuts to be defined
// using some more colloquial terms.
const keyboardAliases: Record<string, string | undefined> = {
  ctrl: 'control',
  mod: 'meta',
  cmd: 'meta',
  ' ': 'space',
  left: 'arrowleft',
  right: 'arrowright',
  down: 'arrowdown',
  up: 'arrowup',
  option: 'alt',
  opt: 'alt',
  delete: 'backspace',
};

export interface ParsedShortcut {
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
  key?: string;
}

export function parseShortcut(shortcut: string) {
  const keys = shortcut
    .split(/-(?!$)/)
    .map((str) => str.toLowerCase())
    .map((char) => keyboardAliases[char] || char);

  const parsed: ParsedShortcut = {
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ctrlKey: false,
  };

  for (const key of keys) {
    if (key === 'meta') parsed.metaKey = true;
    else if (key === 'alt') parsed.altKey = true;
    else if (key === 'shift') parsed.shiftKey = true;
    else if (key === 'control') parsed.ctrlKey = true;
    else parsed.key = key.toLowerCase();
  }
  return parsed;
}

export function useShortcut(shortcut: string, fn: () => void) {
  const parsedShortcut = useMemo(() => parseShortcut(shortcut), [shortcut]);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    function handleEvent(event: KeyboardEvent) {
      const matches =
        event.key.toLowerCase() === parsedShortcut.key &&
        event.altKey === parsedShortcut.altKey &&
        event.metaKey === parsedShortcut.metaKey &&
        event.shiftKey === parsedShortcut.shiftKey &&
        event.ctrlKey === parsedShortcut.ctrlKey;

      if (matches) fnRef.current();
    }

    document.addEventListener('keydown', handleEvent);

    return () => document.removeEventListener('keydown', handleEvent);
  }, [parsedShortcut]);
}
