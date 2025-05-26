
export interface Card {
  id: string;
  term: string;
  useCase: string;
  description: string;
  category: string; // e.g., "基盤技術", "業務プロセス", "顧客エンゲージメント", "戦略策定"
  impact: 'High' | 'Medium' | 'Low'; // Potential impact level
  cost: number; // Cost to play the card, e.g., 1-5
}

export type DXCard = Card; // Alias for clarity if needed

export interface Theme {
  id: string;
  name: string;
  description: string; 
}

export type GameTheme = Theme; // Alias for clarity

export interface Deck {
  id: string;
  name: string;
  description: string;
  cardIds: string[]; // Array of card IDs belonging to this deck
}

export enum GameStage {
  ThemeSelection = 'THEME_SELECTION',
  DeckSelection = 'DECK_SELECTION', 
  // GeneratingChallenge = 'GENERATING_CHALLENGE', // Covered by isLoading within other stages
  PlayerTurn = 'PLAYER_TURN',
  EvaluatingPlay = 'EVALUATING_PLAY',
  GMAdvising = 'GM_ADVISING',
  ShufflingCards = 'SHUFFLING_CARDS',
  GameOverGeneratingEval = 'GAME_OVER_GENERATING_EVAL',
  GameOver = 'GAME_OVER',
}

export interface ChallengeHistoryEntry {
  challenge: string;
  cumulativeCost: number;
}

export interface GameState {
  stage: GameStage;
  selectedTheme: Theme | null;
  
  selectedDeckId1: string | null; 
  selectedDeckId2: string | null;
  activeDeckId: string | null; // Points to either selectedDeckId1 or selectedDeckId2
  selectingDeckSlot: 1 | 2 | null; // To manage the deck selection process

  initialChallenge: string;
  currentChallenge: string;
  challengeHistory: ChallengeHistoryEntry[]; // Updated type
  
  playerHand1: Card[]; // Hand for deck 1
  playerHand2: Card[]; // Hand for deck 2
  
  deck1: Card[]; // Draw pile for deck 1
  deck2: Card[]; // Draw pile for deck 2
  
  availableCardsForDeck1: Card[]; // All cards for deck 1
  availableCardsForDeck2: Card[]; // All cards for deck 2

  turn: number; 
  shufflesRemaining: number;
  adviceRemaining: number;
  gmMessage: string; 
  isLoading: boolean;
  lastPlayedCard: Card | null; 
  newlyDrawnCardId: string | null; // ID of the card, to identify which hand it went to.
  finalScore?: number; 
  cumulativeCost: number; // Added to track total cost of cards played
  preEvaluatedResults: Record<string, { challenge: string, result: EvaluationResponse } | null>;
  preEvaluationStatus: Record<string, 'idle' | 'pending' | 'success' | 'error' | 'aborted'>;
}

// For Gemini API responses
export interface EvaluationResponse {
  newChallenge: string;
  evaluation: string;
  situationImproved: boolean;
}

export interface FinalEvaluationResponse {
  evaluationText: string;
  score: number; // Score out of 100
}