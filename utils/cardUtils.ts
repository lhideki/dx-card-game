export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

import type { Card } from '../types';

export function drawCards(
  currentDeck: Card[],
  count: number,
  allCardsForThisDeck: Card[],
  currentHandForThisDeck: Card[],
  lastPlayedCard: Card | null,
): { drawn: Card[]; newDeck: Card[] } {
  let deckToDrawFrom = [...currentDeck];

  const cardsToExcludeFromRefill = new Set<string>();
  currentHandForThisDeck.forEach(c => cardsToExcludeFromRefill.add(c.id));
  deckToDrawFrom.forEach(c => cardsToExcludeFromRefill.add(c.id));
  if (lastPlayedCard && allCardsForThisDeck.some(c => c.id === lastPlayedCard.id)) {
    cardsToExcludeFromRefill.add(lastPlayedCard.id);
  }

  if (deckToDrawFrom.length < count) {
    const availableToRefill = allCardsForThisDeck.filter(c => !cardsToExcludeFromRefill.has(c.id));
    deckToDrawFrom = shuffleArray([...deckToDrawFrom, ...shuffleArray(availableToRefill)]);

    if (deckToDrawFrom.length < count) {
      const desperationRefill = allCardsForThisDeck.filter(
        c =>
          !currentHandForThisDeck.some(hc => hc.id === c.id) &&
          (!lastPlayedCard || c.id !== lastPlayedCard.id || !allCardsForThisDeck.some(ac => ac.id === lastPlayedCard.id)),
      );
      deckToDrawFrom = shuffleArray(desperationRefill);
    }
  }

  const drawn = deckToDrawFrom.slice(0, Math.min(count, deckToDrawFrom.length));
  const newDeckState = deckToDrawFrom.slice(Math.min(count, deckToDrawFrom.length));
  return { drawn, newDeck: newDeckState };
}

export function dealHand(
  allCardsForThisDeck: Card[],
  handSize: number,
  lastPlayedCard: Card | null = null,
): { hand: Card[]; deck: Card[] } {
  const shuffledDeck = shuffleArray([...allCardsForThisDeck]);
  const { drawn, newDeck } = drawCards(
    shuffledDeck,
    handSize,
    allCardsForThisDeck,
    [],
    lastPlayedCard,
  );
  return { hand: drawn, deck: newDeck };
}
