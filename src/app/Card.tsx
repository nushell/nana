import { useEffect, useState } from 'react';
import { FaCopy, FaDownload, FaFile, FaFileDownload, FaRegSave, FaSave, FaTimes } from 'react-icons/fa';
import { ansiFormat } from '../support/formatting';
import {
  copyCardToClipboard,
  getWorkingDirectory,
  saveCardToFile,
  simpleCommandWithResult,
  sortCardOutput,
} from '../support/nana';
import { Output, SortingOptionsType } from './Output';
import { Prompt } from './Prompt';
import { message, save } from '@tauri-apps/api/dialog';

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
  const { id, input, workingDir, history, output, onClose, onSubmit, onInputChange } = props;

  const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);

  const resetActiveHistoryIndex = () => {
    setActiveHistoryIndex(history.length);
  };

  useEffect(resetActiveHistoryIndex, [history.length]);

  const handleSubmit = async () => {
    const workingDir = await getWorkingDirectory();
    let isError = false;
    let output: string;
    try {
      output = JSON.parse(await simpleCommandWithResult(id, input));
    } catch (error) {
      output = ansiFormat(error as string);
      isError = true;
    }

    onSubmit({ input, workingDir, output }, isError);
    resetActiveHistoryIndex();
  };

  const handleSortBy = async (sortingOptions: SortingOptionsType) => {
    const { column, ascending } = sortingOptions;
    if (!column) return;

    const workingDir = await getWorkingDirectory();
    let isError = false;
    let output: string;
    try {
      output = JSON.parse(await sortCardOutput(id, column, ascending));
    } catch (error) {
      output = ansiFormat(error as string);
      isError = true;
    }

    onSubmit({ input, workingDir, output }, isError);
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
      <div
        id="card-header"
        className="flex w-full items-center justify-between rounded-t bg-solarized-blue px-2 py-1 font-mono text-sm text-solarized-base2 dark:bg-solarized-base01"
      >
        <div id="left-buttons" className="flex">
          {output && (
            <>
              <FaCopy
                className="group ml-1 mr-2 cursor-pointer text-xs hover:text-green-300"
                title="Copy results to clipboard (as tab-separated values)"
                onClick={async () => {
                  await copyCardToClipboard(id);
                }}
              />
              <SaveFileButton cardID={id} />
            </>
          )}
        </div>
        <div>{workingDir}</div>
        <FaTimes
          className="cursor-pointer text-solarized-base3 hover:text-solarized-red dark:text-solarized-base03"
          onClick={onClose}
        />
      </div>

      <div id="card-body" className="rounded-b bg-solarized-blue px-2 pb-2 dark:bg-solarized-base01">
        <div id="header" className="flex">
          <Prompt
            input={input ?? ''}
            onSubmit={handleSubmit}
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
          <div className="mt-2 border-solarized-base1 text-left font-mono text-sm text-solarized-base3 dark:border-solarized-base0 dark:bg-solarized-base02">
            <Output value={output} onSortOutput={(sortingOptions) => handleSortBy(sortingOptions)} />
          </div>
        )}
      </div>
    </div>
  );
};

const SaveFileButton = ({ cardID }: { cardID: string }) => {
  const [hover, setHover] = useState(false);

  let hoverTimeoutId = 0;
  const mouseEnter = () => {
    clearTimeout(hoverTimeoutId);
    setHover(true);
  };
  // short delay before closing the menu, to add some leeway in case the cursor briefly leaves the menu
  const mouseLeave = () => (hoverTimeoutId = setTimeout(() => setHover(false), 100));

  const handleItemClick = async (nuFormatDisplayName: string, nuFormat: string) => {
    const filePath = await save({
      filters: [
        {
          name: nuFormatDisplayName,
          extensions: [nuFormat], // TODO: handle situation where Nu format differs from file extension?
        },
      ],
    });

    if (filePath) {
      try {
        await saveCardToFile(cardID, nuFormat, filePath);
      } catch (error) {
        await message(`Failed to save file: ${error}`, {
          title: 'Error',
          type: 'error',
        });
      }
    }
  };

  const itemClasses = 'px-1 hover:bg-solarized-base2 dark:hover:bg-solarized-base0';

  return (
    <span className="relative" onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
      <FaFileDownload title="Save card to disk" className="hover:text-green-300" />
      <div
        className={`absolute top-4 z-10 
      cursor-pointer whitespace-nowrap rounded-md
      border-4 border-solarized-base0 bg-solarized-base3 text-sm text-solarized-base03
      drop-shadow-lg dark:border-solarized-base0 dark:bg-solarized-base03 dark:text-solarized-base3 ${
        hover ? 'visible' : 'invisible'
      }`}
      >
        <div onClick={() => handleItemClick('CSV', 'csv')} className={itemClasses}>
          CSV
        </div>
        <div onClick={() => handleItemClick('HTML', 'html')} className={itemClasses}>
          HTML
        </div>
        <div onClick={() => handleItemClick('JSON', 'json')} className={itemClasses}>
          JSON
        </div>
        <div onClick={() => handleItemClick('Markdown', 'md')} className={itemClasses}>
          Markdown
        </div>
        <div onClick={() => handleItemClick('Nuon', 'nuon')} className={itemClasses} title="Nushell Object Notation">
          Nuon
        </div>
        <div onClick={() => handleItemClick('TOML', 'toml')} className={itemClasses}>
          TOML
        </div>
        <div onClick={() => handleItemClick('XML', 'xml')} className={itemClasses}>
          XML
        </div>
        <div onClick={() => handleItemClick('YAML', 'yaml')} className={itemClasses}>
          YAML
        </div>

        {/* 
        // judgment call: TSV isn't common enough to include by default
        <div onClick={() => handleItemClick("TSV", "tsv")} className={itemClasses}>TSV</div>
        // .text is awkward as a file extension. TODO implement a way to configure button with a .txt file extention
        <div onClick={() => handleItemClick("Text", "text")} className={itemClasses}>Simple text</div>
        // to xlsx isn't currently implemented/working on the Nu side
        <div onClick={() => handleItemClick("Excel", "xlsx")} className={itemClasses}>Excel (XLSX)</div>
      */}
      </div>
    </span>
  );
};
