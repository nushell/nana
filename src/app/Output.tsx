import classNames from "classnames";
import { HTMLAttributes } from "react";
import {
    humanDuration,
    humanFileSize,
    UInt8ArrayToString,
} from "../support/formatting";

const defaultCellClassName =
    "default:border default:border-neutral-600 default:p-2";

const Table = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <table
        className={classNames(
            className,
            "border-collapse overflow-hidden rounded"
        )}
        {...props}
    />
);

const Row = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <tr
        className={classNames(
            className,
            "default:odd:bg-neutral-800 default:even:bg-[rgba(255,255,255,.03)]"
        )}
        {...props}
    />
);

const Image = ({ value, type }: { value: any; type: string }) => (
    <img
        className="h-auto max-w-full"
        src={`data:${type};base64,${btoa(
            UInt8ArrayToString(new Uint8Array(value))
        )}`}
    />
);

const Binary = ({ value: { val } }: { value: any }): any => {
    if (val[0] == 0x89 && val[1] == 0x50 && val[2] == 0x4e && val[3] == 0x47) {
        return <Image value={val} type="image/png" />;
    } else {
        // todo
    }
};

const Pre = ({
    children,
    className,
    ...props
}: HTMLAttributes<HTMLPreElement>): any => {
    if (typeof children === "string") {
        if (children.split("\n").length == 1) {
            return children;
        }
    }
    return (
        <pre
            className={classNames(
                className,
                "overflow-auto rounded bg-neutral-900 p-4"
            )}
            {...props}
        >
            {children}
        </pre>
    );
};

const Record = ({ value: { cols, vals } }: { value: any }) => (
    <Table>
        <tbody>
            {vals.map((val: any, i: number) => (
                <Row key={i}>
                    <th className={defaultCellClassName}>{cols[i]}</th>
                    <td className={defaultCellClassName}>
                        <Output value={val} />
                    </td>
                </Row>
            ))}
        </tbody>
    </Table>
);

const List = ({ value: { vals } }: { value: any }): any => {
    if (vals.length > 0) {
        const isRecordList = vals.every((v: any) => v.Record);
        const cols = isRecordList ? vals[0].Record.cols : [];
        return (
            <Table>
                <tbody>
                    <Row>
                        {cols.map((col: string, i: number) => (
                            <th
                                key={i}
                                className={classNames(
                                    "font-bold",
                                    defaultCellClassName
                                )}
                            >
                                {col}
                            </th>
                        ))}
                    </Row>

                    {vals.map((value: any, i: number) => (
                        <Row key={i}>
                            {isRecordList ? (
                                value.Record.vals.map((v: any, j: number) => (
                                    <td
                                        key={j}
                                        className={defaultCellClassName}
                                    >
                                        <Output value={v}></Output>
                                    </td>
                                ))
                            ) : (
                                <td className={defaultCellClassName}>
                                    <Output value={value}></Output>
                                </td>
                            )}
                        </Row>
                    ))}
                </tbody>
            </Table>
        );
    }

    return [];
};

export const Output = ({ value }: { value: any }): any => {
    if (!value || value.Nothing) {
        return null;
    } else if (value.Int) {
        return value.Int.val.toString();
    } else if (value.Float) {
        return value.Float.val.toString();
    } else if (value.Bool) {
        return value.Bool.val.toString();
    } else if (value.String) {
        return value.String.val ? <Pre>{value.String.val}</Pre> : <>&nbsp;</>;
    } else if (value.Filesize) {
        return humanFileSize(value.Filesize.val);
    } else if (value.Duration) {
        return humanDuration(value.Duration.val);
    } else if (value.Date) {
        return new Date(Date.parse(value.Date.val)).toISOString();
    } else if (value.Binary) {
        return <Binary value={value.Binary} />;
    } else if (value.Record) {
        return <Record value={value.Record} />;
    } else if (value.List) {
        return <List value={value.List}></List>;
    }

    // todo: use rehype-sanitize
    return <Pre dangerouslySetInnerHTML={{ __html: value }} />;
};
