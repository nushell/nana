import { useCallback, useEffect, useReducer } from 'react';
import { getWorkingDirectory } from '../support/nana';
import { randomId } from '../support/randomId';
import { Card, CardPropTypes, ICard } from './Card';

type HistoryState = string[];

type HistoryAction = {
  type: 'push';
  input: string;
};

const historyReducer = (state: HistoryState, action: HistoryAction) => {
  switch (action.type) {
    case 'push':
      return [...state, action.input];
  }
};

type CardsState = ICard[];

type CardsAction =
  | {
      type: 'add';
      card: ICard;
    }
  | {
      type: 'remove';
      cardId: string;
    }
  | {
      // TODO: break this action into multiple, more explicit, actions
      type: 'update';
      cardId: string;
      props: Partial<CardPropTypes>;
    };

const cardsReducer = (state: CardsState, action: CardsAction) => {
  switch (action.type) {
    case 'add':
      return [...state, action.card];
    case 'remove':
      return state.filter((card) => card.id === action.cardId);
    case 'update':
      return state.map((orig) => {
        if (orig.id === action.cardId) {
          return { ...orig, ...action.props };
        }
        return orig;
      });
  }
};

export const App = () => {
  const [history, dispatchHistory] = useReducer(historyReducer, []);
  const [cards, dispatchCards] = useReducer(cardsReducer, []);

  const addEmptyCard = useCallback(async () => {
    const workingDir = await getWorkingDirectory();

    dispatchCards({
      type: 'add',
      card: { workingDir, id: randomId(), input: '' },
    });
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

    dispatchCards({ type: 'update', cardId, props });
    if (!isLast) addEmptyCard();

    dispatchHistory({ type: 'push', input: props.input });
  };

  return (
    <main>
      {cards.map((card) => (
        <Card
          key={card.id}
          {...card}
          history={history}
          onClose={() => {
            dispatchCards({ type: 'remove', cardId: card.id });
          }}
          onSubmit={(props: CardPropTypes, isError) => {
            handleSubmit(card.id, props, isError);
          }}
          onInputChange={(input) =>
            dispatchCards({ type: 'update', cardId: card.id, props: { input } })
          }
        />
      ))}
    </main>
  );
};
