import { useEffect, useReducer, useState } from 'react';
import { dropFromCache, getWorkingDirectory } from '../support/nana';
import { randomId } from '../support/randomId';
import { useShortcut } from '../support/useShortcut';
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
      return state.filter((card) => card.id !== action.cardId);
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
  const [selectedCard, setSelectedCard] = useState(0);

  function decrementSelectedCard() {
    let newIndex = selectedCard - 1;
    if (newIndex < 0) {
      newIndex = cards.length - 1;
    }
    setSelectedCard(newIndex);
  }

  function incrementSelectedCard() {
    let newIndex = selectedCard + 1;
    if (newIndex >= cards.length) {
      newIndex = 0;
    }
    setSelectedCard(newIndex);
  }

  const addEmptyCard = async () => {
    const workingDir = await getWorkingDirectory();
    setSelectedCard(cards.length);
    dispatchCards({
      type: 'add',
      card: { workingDir, id: randomId(), input: '' },
    });
  };

  const deleteSelectedCard = () => deleteCard(cards[selectedCard]);

  useShortcut('meta-up', decrementSelectedCard);
  useShortcut('meta-down', incrementSelectedCard);
  useShortcut('meta-w', deleteSelectedCard);
  useShortcut('meta-n', addEmptyCard);

  useEffect(() => {
    if (cards.length === 0) addEmptyCard();
  }, [cards.length]);

  const handleSubmit = (
    cardId: string,
    props: CardPropTypes,
    isError: boolean
  ) => {
    const cardIndex = cards.findIndex(({ id }) => id === cardId);
    const isLast = cardIndex === cards.length - 1;

    dispatchCards({ type: 'update', cardId, props });
    if (isLast) {
      addEmptyCard();
    }

    dispatchHistory({ type: 'push', input: props.input });
  };

  const deleteCard = (card: ICard) => {
    if (selectedCard >= cards.length - 1) {
      setSelectedCard(selectedCard - 1);
    }
    dispatchCards({ type: 'remove', cardId: card.id });
    dropFromCache(card.id);
  };

  return (
    <main>
      {cards.map((card, index) => (
        <Card
          key={card.id}
          {...card}
          selected={index == selectedCard}
          onFocus={() => setSelectedCard(index)}
          history={history}
          onClose={() => {
            deleteCard(card);
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
