import { useEffect, useRef, useState } from "react";

import { Prompt } from "./Prompt";
import { IResult } from "./Result";

import { ansiFormat } from "../support/formatting";
import { getWorkingDirectory } from "../support/nana";
import { ResultList } from "./ResultList";

export default () => {
    const promptRef = useRef<HTMLDivElement>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [activeHistoryIndex, setActiveHistoryIndex] = useState(-1);
    const [input, setInput] = useState("");
    const [results, setResults] = useState<IResult[]>([]);

    const [workingDir, setWorkingDir] = useState("");

    const resetActiveHistoryIndex = () => {
        setActiveHistoryIndex(history.length);
    };

    // reset the active history index when the history changes
    useEffect(resetActiveHistoryIndex, [history.length]);

    // auto-scroll to the prompt whenever a new result is added/removed
    useEffect(() => {
        promptRef.current?.scrollIntoView({ block: "start" });
    }, [results.length]);

    // get working directory/bind global key presses on mount
    useEffect(() => {
        refreshWorkingDir();
        window.addEventListener("keydown", handleGlobalKeyDown);
        () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, []);

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key == "l") {
            // ctrl + l
            e.preventDefault();
            setResults([]);
        }
    };

    const refreshWorkingDir = async () => {
        setWorkingDir(await getWorkingDirectory());
    };

    const handleResult = async (output: string, duration: number) => {
        if (history.indexOf(input) === -1) {
            setHistory((history) => [...history.slice(-25), input]);
        }

        setResults((results) => [
            ...results.slice(-10),
            {
                id: results.length,
                workingDir,
                input,
                duration,
                output: JSON.parse(output),
            },
        ]);
        refreshWorkingDir();
        resetActiveHistoryIndex();
        setInput("");
    };

    const handleError = async (output: string) => {
        setResults((results) => [
            ...results,
            {
                id: results.length,
                workingDir,
                input,
                output: ansiFormat(output),
            },
        ]);
        refreshWorkingDir();
        setInput("");
    };

    const handleHistory = (delta: number) => {
        const index = activeHistoryIndex + delta;
        if (index >= 0 && index < history.length) {
            setInput(history[index]);
            setActiveHistoryIndex(index);
        }
    };

    return (
        <main className="px-8 py-4 space-y-6">
            <ResultList results={results} />

            <Prompt
                ref={promptRef}
                input={input}
                onSubmit={handleResult}
                onSubmitError={handleError}
                workingDir={workingDir}
                onHistoryUp={() => {
                    handleHistory(1);
                }}
                onHistoryDown={() => {
                    handleHistory(-1);
                }}
                onChangeInput={(value) => {
                    setInput(value);
                }}
            />
        </main>
    );
};
