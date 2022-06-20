import classNames from "classnames";
import { IconBaseProps } from "react-icons";
import { CgSpinner } from "react-icons/cg";

export const Spinner = ({ className }: IconBaseProps) => (
    <CgSpinner className={classNames(className, "animate-spin")} />
);
