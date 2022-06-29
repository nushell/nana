import { forwardRef, KeyboardEvent, useRef, useState } from 'react';
import { complete } from '../support/nana';
import { CompletionList, ICompletion } from './CompletionList';

type PromptPropType = {
  input: string;
  onInputChange: (input: string) => void;
  onSubmit: () => void;
  onHistoryUp: () => void;
  onHistoryDown: () => void;
};

export const Prompt = forwardRef<HTMLDivElement, PromptPropType>(
  (
    {
      input,
      onInputChange: onChange,
      onSubmit,
      onHistoryUp,
      onHistoryDown,
    }: PromptPropType,
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [completions, setCompletions] = useState<ICompletion[]>([]);
    const [activeCompletionIndex, setActiveCompletionIndex] = useState(0);

    const resetCompletions = () => {
      setCompletions([]);
      setActiveCompletionIndex(0);
    };

    const applyCompletion = (
      completion: ICompletion,
      selectionStart: number
    ) => {
      const before = input.slice(0, completion.start);
      const after = input.slice(
        completion.start + selectionStart - completion.start
      );
      return before + completion.completion + after;
    };

    const handleChange = (input: string) => {
      resetCompletions();
      onChange(input);
    };

    const handleCompletion = async (position: number) => {
      const results: ICompletion[] = await complete({
        argument: input,
        position: position,
      });

      if (results.length == 1) {
        handleChange(applyCompletion(results[0], input.length));
      } else if (results.length > 1) {
        setCompletions(results);
      }
    };

    const handleSubmit = async () => {
      if (input.length > 0) {
        onSubmit();
      }
    };

    const handleAcceptSuggestion = (index: number) => {
      if (index >= 0 && index < completions.length) {
        return handleAcceptCompletion(completions[index]);
      }
    };

    const handlePrevCompletion = () => {
      if (activeCompletionIndex > 0) {
        setActiveCompletionIndex(activeCompletionIndex - 1);
      } else {
        setActiveCompletionIndex(completions.length - 1);
      }
    };

    const handleNextCompletion = () => {
      if (activeCompletionIndex < completions.length - 1) {
        setActiveCompletionIndex(activeCompletionIndex + 1);
      } else {
        setActiveCompletionIndex(0);
      }
    };

    const handleAcceptCompletion = (completion: ICompletion) => {
      if (inputRef.current && inputRef.current.selectionStart)
        handleChange(
          applyCompletion(completion, inputRef.current.selectionStart)
        );
    };

    const handleDismissCompletion = () => {
      resetCompletions();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (completions.length > 0) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handlePrevCompletion();
            break;
          case 'ArrowDown':
          case 'Tab':
            e.preventDefault();
            handleNextCompletion();
            break;
          case 'Enter':
            e.preventDefault();
            handleAcceptSuggestion(activeCompletionIndex);
            break;
          case 'Escape':
            e.preventDefault();
            handleDismissCompletion();
            break;
        }
        return;
      }

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

    const hasTopCleareance = () => {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        console.log('rect = ', rect);
        return rect.top >= 500;
      } else {
        return false;
      }
    };

    return (
      <div className="relative flex w-full items-center">
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
            onChange(e.target.value);
          }}
        />
        {completions.length > 0 && (
          <CompletionList
            activeIndex={activeCompletionIndex}
            completions={completions}
            positionUp={hasTopCleareance()}
          />
        )}
      </div>
    );
  }
);
