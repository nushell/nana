import { useEffect, useState } from 'react';
import { getWorkingDirectory } from '../support/nana';

import { Card, ICard, CardPropTypes } from './Card';

export default () => {
  const [history, setHistory] = useState<string[]>([]);
  const [cards, setCards] = useState<ICard[]>([]);

  useEffect(() => {
    if (cards.length === 0) addEmptyCard();
  }, [cards.length]);

  const addEmptyCard = async () => {
    addCard({
      workingDir: await getWorkingDirectory(),
    });
  };

  const addCard = (props: CardPropTypes) => {
    setCards((cards) => [...cards, { id: cards.length, ...props }]);
  };

  const addToHistory = (input?: string) => {
    if (!input) return;
    if (history.indexOf(input) === -1) {
      setHistory((history) => [...history, input]);
    }
  };

  const removeCard = (cardId: number) => {
    setCards((cards) => cards.filter(({ id }) => id !== cardId));
  };

  const updateCard = (cardId: number, props: CardPropTypes) => {
    return setCards((cards) =>
      cards.map((orig) => {
        if (orig.id === cardId) {
          return { ...orig, ...props };
        }
        return orig;
      })
    );
  };

  const handleSubmit = async (
    cardId: number,
    props: CardPropTypes,
    isError: boolean
  ) => {
    const card = cards.find(({ id }) => id === cardId);
    const alreadySubmitted = card && card.input !== undefined;
    updateCard(cardId, props);
    if (!isError && !alreadySubmitted) addEmptyCard();

    addToHistory(props.input);
  };

  return (
    <main>
      {cards.map((card) => (
        <Card
          key={card.id}
          {...card}
          history={history}
          onClose={() => {
            removeCard(card.id);
          }}
          onSubmit={(props: CardPropTypes, isError) => {
            handleSubmit(card.id, props, isError);
          }}
        />
      ))}
    </main>
  );
};
