import classNames from "classnames";
import { HTMLAttributes } from "react";
import { humanDuration } from "../support/formatting";
import { Output } from "./Output";

export type IResult = {
    id: number;
    workingDir: string;
    input: string;
    output?: string;
    duration?: number;
};

const Indicator = ({ className }: HTMLAttributes<HTMLSpanElement>) => (
    <span
        className={classNames(
            className,
            "rounded-full default:h-2 default:w-2"
        )}
    />
);

export const Result = ({
    workingDir,
    input,
    output,
    duration,
}: Omit<HTMLAttributes<HTMLDivElement>, "id"> & IResult) => (
    <div className="flex flex-col space-y-1">
        <div className="flex space-x-3">
            <div className="relative flex items-center">
                <Indicator
                    className={classNames("absolute -ml-5", {
                        "bg-green-500": typeof output !== "string",
                        "bg-red-500": typeof output === "string",
                    })}
                />
                <div className="space-x-4">
                    <span className="font-bold">{input}</span>
                    {duration ? (
                        <span className="text-xs text-neutral-500">
                            {humanDuration(duration)}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="!ml-auto text-sm text-neutral-500">
                {workingDir}
            </div>
        </div>
        <Output value={output} />
    </div>
);
