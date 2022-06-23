import { nanoid } from 'nanoid';
import { useCallback, useEffect } from 'react';
import { useStateDispatch } from 'use-state-dispatch';
import { getWorkingDirectory } from '../support/nana';
import { Card, CardPropTypes, ICard } from './Card';

type HistoryState = string[];

const historyReducers = {
  push(state: HistoryState, input: string): HistoryState {
    return [...state, input];
  },
};

type CardState = ICard[];

const cardReducers = {
  add(state: CardState, card: ICard) {
    return [...state, card];
  },

  remove(state: CardState, cardId: string) {
    return state.filter((card) => card.id === cardId);
  },

  // TODO: break this function into multiple
  update(state: CardState, cardId: string, props: Partial<CardPropTypes>) {
    return state.map((orig) => {
      if (orig.id === cardId) {
        return { ...orig, ...props };
      }
      return orig;
    });
  },
};

export const App = () => {
  const [history, dispatchHistory] = useStateDispatch(
    [] as HistoryState,
    historyReducers
  );

  const [cards, dispatchCards] = useStateDispatch([] as ICard[], cardReducers);

  const addEmptyCard = useCallback(async () => {
    const workingDir = await getWorkingDirectory();

    dispatchCards.add({ workingDir, id: nanoid(), input: '' });
  }, []);

  useEffect(() => {
    if (cards.length === 0) addEmptyCard();
  }, [cards.length]);

  const handleSubmit = (
    cardId: string,
    props: CardPropTypes,
    isError: boolean
  ) => {
    const cardIndex = cards.findIndex(({ id }) => id === cardId);
    const isLast = cardIndex === cards.length;
    dispatchCards.update(cardId, props);
    if (!isLast) addEmptyCard();

    dispatchHistory.push(props.input);
  };

  return (
    <main>
      {cards.map((card) => (
        <Card
          key={card.id}
          {...card}
          history={history}
          onClose={() => {
            dispatchCards.remove(card.id);
          }}
          onSubmit={(props: CardPropTypes, isError) => {
            handleSubmit(card.id, props, isError);
          }}
          onInputChange={(input) => dispatchCards.update(card.id, { input })}
        />
      ))}
    </main>
  );
};
