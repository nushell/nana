import classNames from 'classnames';
import { useEffect, useRef } from 'react';

export type ICompletion = {
  completion: string;
  start: number;
};

const CompletionItem = ({
  active,
  completion,
  ...props
}: {
  active: boolean;
  completion: ICompletion;
}) => {
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        block: 'nearest',
        // behavior: "smooth",
      });
    }
  }, [active]);

  return (
    <li
      {...props}
      ref={ref}
      className={classNames('scroll-mt-0 px-2 py-1', {
        'bg-solarized-base0 text-solarized-base2': active,
      })}
    >
      {completion.completion}
    </li>
  );
};

export const CompletionList = ({
  completions,
  activeIndex,
  positionUp,
}: {
  activeIndex: number;
  completions: ICompletion[];
  positionUp: boolean;
}) => {
  const ref = useRef<HTMLUListElement>(null);

  return (
    <ul
      ref={ref}
      className={classNames(
        'absolute left-0 z-50 max-h-64 divide-y divide-solarized-base01 overflow-hidden overflow-y-auto rounded border border-solarized-base02 bg-solarized-base03 text-solarized-base1 shadow',
        {
          'bottom-full': positionUp,
          'top-full': !positionUp,
        }
      )}
    >
      {completions.map((completion, index) => (
        <CompletionItem
          key={completion.completion}
          active={activeIndex === index}
          completion={completion}
        />
      ))}
    </ul>
  );
};
