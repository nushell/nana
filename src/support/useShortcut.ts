import { useEffect, useMemo, useRef } from 'react';

type Meta = 'meta' | '';
type Alt = 'alt' | '';
type Shift = 'shift' | '';

type Key =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | 'backspace'
  | 'arrowleft'
  | 'arrowright'
  | 'arrowdown'
  | 'arrowup';

type Shortcut = `${Meta}-${Alt}-${Shift}-${Key}`;

// Doesn't quite work...
const x: Shortcut = 'meta---a';

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
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  key?: string;
}

export function parseShortcut(shortcut: string) {
  const keys = shortcut
    .split(/-(?!$)/)
    .map((str) => str.toLowerCase())
    .map((char) => keyboardAliases[char] || char);

  const parsed: ParsedShortcut = {};
  for (const key of keys) {
    if (key === 'meta') parsed.metaKey = true;
    else if (key === 'alt') parsed.altKey = true;
    else if (key === 'shift') parsed.shiftKey = true;
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
        event.shiftKey === parsedShortcut.shiftKey;

      if (matches) fnRef.current();
    }

    document.addEventListener('keydown', handleEvent);

    return () => document.removeEventListener('keydown', handleEvent);
  }, [parsedShortcut]);
}
