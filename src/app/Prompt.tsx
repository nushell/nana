import { KeyboardEvent, useRef } from 'react';
import { complete } from '../support/nana';

export type ICompletion = {
  completion: string;
  start: number;
};

type PromptPropType = {
  input: string;
  onInputChange: (input: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
};

export const Prompt = ({
  input,
  onInputChange,
  onSubmit,
  onHistoryUp,
  onHistoryDown,
}: PromptPropType) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const applyCompletion = (completion: ICompletion, selectionStart: number) => {
    const before = input.slice(0, completion.start);
    const after = input.slice(
      completion.start + selectionStart - completion.start
    );
    return before + completion.completion + after;
  };

  const handleCompletion = async (position: number) => {
    const results: ICompletion[] = await complete({
      argument: input,
      position: position,
    });

    if (results.length > 0) {
      onInputChange(applyCompletion(results[0], position));
    }
  };

  const handleSubmit = async () => {
    if (input.length > 0) {
        onSubmit();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        onHistoryUp();
        break;
      case 'ArrowDown':
        e.preventDefault();
        onHistoryDown();
        break;
      case 'Enter':
        e.preventDefault();
        handleSubmit();
        break;
      case 'Tab':
        if (
          e.target instanceof HTMLInputElement &&
          e.target.selectionStart !== null
        ) {
          e.preventDefault();
          handleCompletion(e.target.selectionStart);
        }
        break;
    }
  };

  return (
    <input
      title="nushell input"
      ref={inputRef}
      autoFocus
      autoCapitalize="none"
      type="text"
      className="input m-0 w-full rounded-sm bg-solarized-base3 py-0 pl-2 font-mono text-solarized-base03 outline-none focus:ring-2 focus:ring-solarized-base0 dark:border-solarized-base02 dark:bg-solarized-base03 dark:text-solarized-base3 dark:focus:ring-solarized-blue"
      value={input ?? ''}
      onKeyDown={handleKeyDown}
      onChange={(e) => {
        onInputChange(e.target.value);
      }}
    />
  );
};
