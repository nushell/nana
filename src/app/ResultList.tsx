import { IResult, Result } from "./Result";

export const ResultList = ({ results }: { results: IResult[] }) => {
    if (results.length === 0) return null;

    return (
        <div className="flex flex-auto flex-col space-y-6">
            {results.map(({ ...props }) => (
                <Result key={props.id} {...props} />
            ))}
        </div>
    );
};
