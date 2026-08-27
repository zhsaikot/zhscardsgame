import { SUITS, RANKS, CARD_VALUES, CARD_POWER } from './constants.js';

export function createDeck() {
  const deck = [];
  let id = 0;
  
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        id: `${rank}${suit.charAt(0).toUpperCase()}`,
        rank,
        suit,
        pointValue: CARD_VALUES[rank],
        power: CARD_POWER[rank]
      });
    }
  }
  
  return deck;
}

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck, numCards) {
  const dealt = deck.slice(0, numCards);
  const remaining = deck.slice(numCards);
  return { dealt, remaining };
}

export function getLegalCards(hand, leadSuit) {
  if (!leadSuit) {
    return hand.map(c => c.id);
  }
  
  const leadSuitCards = hand.filter(c => c.suit === leadSuit);
  if (leadSuitCards.length > 0) {
    return leadSuitCards.map(c => c.id);
  }
  
  return hand.map(c => c.id);
}

export function determineTrickWinner(plays, leadSuit, trumpSuit) {
  if (plays.length === 0) return null;
  
  let winningCard = plays[0];
  let winningIndex = 0;
  
  for (let i = 1; i < plays.length; i++) {
    const currentCard = plays[i];
    
    // Trump beats non-trump
    if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
      winningCard = currentCard;
      winningIndex = i;
    } else if (currentCard.suit !== trumpSuit && winningCard.suit === trumpSuit) {
      continue;
    }
    // Same suit comparison
    else if (currentCard.suit === winningCard.suit) {
      if (currentCard.power > winningCard.power) {
        winningCard = currentCard;
        winningIndex = i;
      }
    }
    // If winning card is lead suit and current is not trump or lead
    else if (winningCard.suit === leadSuit && currentCard.suit !== leadSuit && currentCard.suit !== trumpSuit) {
      continue;
    }
  }
  
  return winningIndex;
}

export function calculateTrickPoints(plays) {
  return plays.reduce((sum, card) => sum + card.pointValue, 0);
}
