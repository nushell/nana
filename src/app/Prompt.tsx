import { forwardRef, KeyboardEvent, useRef, useState } from "react";
import { complete, simpleCommandWithResult } from "../support/nana";
import { CompletionList, ICompletion } from "./CompletionList";
import { Spinner } from "./Spinner";

type PromptPropType = {
    input: string;
    workingDir: string | null;
    onChangeInput: (input: string) => void;
    onSubmit: (output: string, duration: number) => void;
    onSubmitError: (output: string) => void;
    onHistoryUp: () => void;
    onHistoryDown: () => void;
};

export const Prompt = forwardRef<HTMLDivElement, PromptPropType>(
    (
        {
            input,
            workingDir,
            onChangeInput: onChange,
            onSubmit,
            onSubmitError,
            onHistoryUp,
            onHistoryDown,
        }: PromptPropType,
        ref
    ) => {
        const inputRef = useRef<HTMLInputElement>(null);
        const [isLoading, setLoading] = useState(false);
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
                handleChange(applyCompletion(results[0], position));
            } else if (results.length > 1) {
                setCompletions(results);
            }
        };

        const handleSubmit = async () => {
            if (input.length > 0) {
                const timeout = setTimeout(() => {
                    setLoading(true);
                }, 200);
                try {
                    const startTime = Date.now();
                    const response: string = await simpleCommandWithResult(
                        input
                    );
                    onSubmit(response, Date.now() - startTime);
                } catch (err) {
                    onSubmitError(err as string);
                } finally {
                    clearTimeout(timeout);
                    setLoading(false);
                }
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
                    case "ArrowUp":
                        e.preventDefault();
                        handlePrevCompletion();
                        break;
                    case "ArrowDown":
                    case "Tab":
                        e.preventDefault();
                        handleNextCompletion();
                        break;
                    case "Enter":
                        e.preventDefault();
                        handleAcceptSuggestion(activeCompletionIndex);
                        break;
                    case "Escape":
                        e.preventDefault();
                        handleDismissCompletion();
                        break;
                }

                return;
            }

            switch (e.key) {
                case "ArrowUp":
                    e.preventDefault();
                    onHistoryUp();
                    break;
                case "ArrowDown":
                    e.preventDefault();
                    onHistoryDown();
                    break;
                case "Enter":
                    e.preventDefault();
                    handleSubmit();
                    break;
                case "Tab":
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

        let hasTopCleareance = false;

        // todo: use popper.js
        if (inputRef.current) {
            const rect = inputRef.current.getBoundingClientRect();
            hasTopCleareance = rect.top >= 100;
        }

        return (
            <div ref={ref} className="flex flex-col space-y-1">
                <div className="!ml-auto text-sm text-neutral-500">
                    {workingDir}
                </div>
                <div className="relative flex items-center">
                    <div className="absolute -ml-6 text-center text-neutral-500">
                        {isLoading && <Spinner />}
                    </div>
                    <input
                        ref={inputRef}
                        autoFocus
                        autoCapitalize="none"
                        type="text"
                        className="w-full rounded bg-neutral-700 px-2 py-1"
                        value={input}
                        onKeyDown={handleKeyDown}
                        onChange={(e) => {
                            handleChange(e.target.value);
                        }}
                    />
                    {completions.length > 0 && (
                        <CompletionList
                            activeIndex={activeCompletionIndex}
                            completions={completions}
                            positionUp={hasTopCleareance}
                        />
                    )}
                </div>
            </div>
        );
    }
);
