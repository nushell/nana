import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { ansiFormat } from '../support/formatting';
import { getWorkingDirectory } from '../support/nana';
import { Output } from './Output';
import { Prompt } from './Prompt';

export type CardPropTypes = {
  workingDir?: string;
  input: string;
  output?: string;
};

export type ICard = CardPropTypes & {
  id: string;
};

export const Card = (
  props: ICard & {
    history: string[];
    onInputChange: (newInput: string) => void;
    onSubmit: (newProps: CardPropTypes, isError: boolean) => void;
    onClose: () => void;
  }
) => {
  const {
    input,
    workingDir,
    history,
    output,
    onClose,
    onSubmit,
    onInputChange,
  } = props;

  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);

  const resetActiveHistoryIndex = () => {
    setActiveHistoryIndex(history.length);
  };

  useEffect(resetActiveHistoryIndex, [history.length]);

  const handleSubmit = async (out: string) => {
    onSubmit(
      {
        input,
        workingDir: await getWorkingDirectory(),
        output: JSON.parse(out),
      },
      false
    );
    resetActiveHistoryIndex();
  };

  const handleError = async (output: string) => {
    onSubmit(
      {
        input,
        workingDir: await getWorkingDirectory(),
        output: ansiFormat(output),
      },
      true
    );
  };

  const handleHistory = (delta: number) => {
    const index = activeHistoryIndex + delta;
    if (index >= 0 && index < history.length) {
      onInputChange(history[index]);
      setActiveHistoryIndex(index);
    }
  };

  return (
    <div className="mb-2 flex flex-col">
      <div className="mr-4 w-fit translate-y-1 self-end rounded-t bg-solarized-blue px-2 font-mono text-sm text-solarized-base2 dark:bg-solarized-base01">
        <span>{workingDir}</span>
        &nbsp;
        <span onClick={onClose}>
          <FaTimes className="inline cursor-pointer text-sm text-solarized-base3 hover:text-solarized-red dark:text-solarized-base03" />
        </span>
      </div>

      <div
        id="card-body"
        className="rounded bg-solarized-blue px-2 pb-2 pt-2 dark:bg-solarized-base01"
      >
        <div id="header" className="flex">
          <Prompt
            input={input ?? ''}
            onSubmit={handleSubmit}
            onSubmitError={handleError}
            onHistoryUp={() => {
              handleHistory(-1);
            }}
            onHistoryDown={() => {
              handleHistory(1);
            }}
            onInputChange={onInputChange}
          />
        </div>

        {output !== undefined && (
          <div className="mt-2 rounded-sm border-solarized-base1 text-left font-mono text-sm text-solarized-base3 dark:border-solarized-base0 dark:bg-solarized-base02">
            <Output value={output} />
          </div>
        )}
      </div>
    </div>
  );
};
