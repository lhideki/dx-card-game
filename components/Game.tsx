"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card, Theme, GameStage, Deck, EvaluationResponse, ChallengeHistoryEntry } from '../types';
import { INITIAL_DX_CARDS, GAME_THEMES, THEME_INITIAL_CHALLENGES, MAX_TURNS, INITIAL_HAND_SIZE, SHUFFLES_ALLOWED, ADVICE_ALLOWED, GAME_DECKS } from '../constants';
import ThemeSelector from './ThemeSelector';
<<<<<<< HEAD
import DeckSelectorComponent from './DeckSelector';
=======
import DeckSelectorComponent from './DeckSelector'; 
>>>>>>> origin/main
import GameBoard from './GameBoard';
import GMDisplay from './GMDisplay';
import GameControls from './GameControls';
import LoadingSpinner from './LoadingSpinner';
import {
  evaluateCardPlay,
  getAdvice,
  shuffleChallengeEffect,
  getFinalEvaluation
} from '../services/geminiService';
import { shuffleArray, drawCards as drawCardsUtil, dealHand } from '@/utils/cardUtils';

const MAX_CONCURRENT_PRE_EVALUATIONS = 3;

<<<<<<< HEAD
const CardGame = (): React.JSX.Element => {
=======
const CardGame = (): JSX.Element => {
>>>>>>> origin/main
  const initialGameState: GameState = {
    stage: GameStage.ThemeSelection,
    selectedTheme: null,
    selectedDeckId1: null,
    selectedDeckId2: null,
    activeDeckId: null,
    selectingDeckSlot: null,
    initialChallenge: '',
    currentChallenge: '',
    challengeHistory: [],
    playerHand1: [],
    playerHand2: [],
    deck1: [],
    deck2: [],
    availableCardsForDeck1: [],
    availableCardsForDeck2: [],
    turn: 0,
    shufflesRemaining: SHUFFLES_ALLOWED,
    adviceRemaining: ADVICE_ALLOWED,
    gmMessage: 'DX用語ゲームへようこそ！まずはテーマを選択してください。',
    isLoading: false,
    lastPlayedCard: null,
    newlyDrawnCardId: null,
    finalScore: undefined,
    cumulativeCost: 0, // Initialize cumulativeCost
    preEvaluatedResults: {},
    preEvaluationStatus: {},
  };
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const gameStateRef = useRef<GameState>(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const preEvalControllersRef = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    if (gameState.newlyDrawnCardId) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, newlyDrawnCardId: null }));
      }, 1200); // Increased duration for visibility
      return () => clearTimeout(timer);
    }
  }, [gameState.newlyDrawnCardId]);

  const drawCards = useCallback(
    (
      currentDeck: Card[],
      count: number,
      allCardsForThisDeck: Card[],
      currentHandForThisDeck: Card[],
    ): { drawn: Card[]; newDeck: Card[] } =>
      drawCardsUtil(
        currentDeck,
        count,
        allCardsForThisDeck,
        currentHandForThisDeck,
        gameStateRef.current.lastPlayedCard,
      ),
    []
  );


  const cancelAllPreEvaluations = () => {
    Object.values(preEvalControllersRef.current).forEach(controller => controller.abort());
    preEvalControllersRef.current = {};
  };

  const clearPreEvaluationState = () => {
    cancelAllPreEvaluations();
    setGameState(prev => ({
      ...prev,
      preEvaluatedResults: {},
      preEvaluationStatus: {},
    }));
  };

  const getActiveHand = useCallback(() => {
    const currentGameState = gameStateRef.current;
    if (currentGameState.activeDeckId === currentGameState.selectedDeckId1) {
      return currentGameState.playerHand1;
    } else if (currentGameState.activeDeckId === currentGameState.selectedDeckId2) {
      return currentGameState.playerHand2;
    }
    return [];
  }, []);


  useEffect(() => {
    const currentGameState = gameStateRef.current;
    const activeHand = getActiveHand();

    if (
      (currentGameState.stage === GameStage.PlayerTurn || currentGameState.stage === GameStage.GMAdvising) &&
      activeHand.length > 0 &&
      currentGameState.currentChallenge &&
      currentGameState.selectedTheme &&
      currentGameState.activeDeckId
    ) {
      let currentPendingCount = Object.values(currentGameState.preEvaluationStatus).filter(s => s === 'pending').length;
      const statusUpdatesToBatch: Record<string, 'idle' | 'pending' | 'success' | 'error' | 'aborted'> = {};

      for (const card of activeHand) {
        const cardCurrentStatus = currentGameState.preEvaluationStatus[card.id];
        const needsEvaluation = !cardCurrentStatus || ['idle', 'aborted', 'error'].includes(cardCurrentStatus);

        if (needsEvaluation) {
          const existingPreview = currentGameState.preEvaluatedResults[card.id];
          if (existingPreview && existingPreview.challenge === currentGameState.currentChallenge && cardCurrentStatus === 'success') {
            continue; // Already successfully evaluated for this exact challenge
          }

          if (currentPendingCount < MAX_CONCURRENT_PRE_EVALUATIONS) {
            statusUpdatesToBatch[card.id] = 'pending';
            currentPendingCount++;

            const controller = new AbortController();
            preEvalControllersRef.current[card.id] = controller;
            const capturedChallenge = currentGameState.currentChallenge;
            const capturedThemeName = currentGameState.selectedTheme.name;

            evaluateCardPlay(capturedChallenge, card, capturedThemeName, controller.signal)
              .then((result: EvaluationResponse) => {
                if (controller.signal.aborted) return;
                setGameState(prev => {
                  const currentActiveHand = prev.activeDeckId === prev.selectedDeckId1 ? prev.playerHand1 : prev.playerHand2;
                  const isActiveDeckCard = currentActiveHand.some(c => c.id === card.id);
                  const isValidStage = prev.stage === GameStage.PlayerTurn || prev.stage === GameStage.GMAdvising;

                  if (prev.currentChallenge === capturedChallenge && isValidStage && isActiveDeckCard) {
                    return {
                      ...prev,
                      preEvaluatedResults: {
                        ...prev.preEvaluatedResults,
                        [card.id]: { challenge: capturedChallenge, result }
                      },
                      preEvaluationStatus: { ...prev.preEvaluationStatus, [card.id]: 'success' }
                    };
                  }
                  return prev;
                });
              })
              .catch((error: Error) => {
                if (controller.signal.aborted) {
                  setGameState(prev => {
                    const isValidStage = prev.stage === GameStage.PlayerTurn || prev.stage === GameStage.GMAdvising;
                     if(isValidStage && prev.preEvaluationStatus[card.id] !== 'aborted') { // only update if stage is relevant and not already aborted
                       return {
                         ...prev,
                         preEvaluationStatus: { ...prev.preEvaluationStatus, [card.id]: 'aborted' }
                       };
                     }
                     return prev;
                 });
                  return;
                }
                console.error(`Pre-evaluation for ${card.term} failed:`, error);
                setGameState(prev => {
                  const isValidStage = prev.stage === GameStage.PlayerTurn || prev.stage === GameStage.GMAdvising;
                  if(isValidStage) {
                    return {
                      ...prev,
                      preEvaluatedResults: { ...prev.preEvaluatedResults, [card.id]: null },
                      preEvaluationStatus: { ...prev.preEvaluationStatus, [card.id]: 'error' }
                    };
                  }
                  return prev;
                });
              })
              .finally(() => {
                if (preEvalControllersRef.current[card.id] === controller) {
                  delete preEvalControllersRef.current[card.id];
                }
              });
          } else {
            // At capacity, if card is not already 'pending' or 'success', mark as 'idle'
            if (cardCurrentStatus !== 'pending' && cardCurrentStatus !== 'success' && cardCurrentStatus !== 'idle') {
              statusUpdatesToBatch[card.id] = 'idle';
            }
          }
        }
      }

      if (Object.keys(statusUpdatesToBatch).length > 0) {
        setGameState(prev => ({
          ...prev,
          preEvaluationStatus: { ...prev.preEvaluationStatus, ...statusUpdatesToBatch }
        }));
      }
    } else {
      // Clear pre-evaluations if not in player turn or GMAdvising, or conditions not met
      if (currentGameState.stage !== GameStage.PlayerTurn && currentGameState.stage !== GameStage.GMAdvising) {
        clearPreEvaluationState();
      }
    }
  }, [
      gameState.stage,
      gameState.activeDeckId,
      // getActiveHand is useCallback, but its dependencies (playerHand1/2, activeDeckId) are key.
      // Explicitly list the state slices that determine the active hand's content and other conditions.
      gameState.playerHand1,
      gameState.playerHand2,
      gameState.currentChallenge,
      gameState.selectedTheme,
      gameState.preEvaluationStatus, // Re-run if statuses change (e.g., a slot opens)
      gameState.preEvaluatedResults, // Re-run if results change (e.g. challenge mismatch)
      getActiveHand // Keep getActiveHand as a stable reference getter
    ]);


  const handleThemeSelect = useCallback(async (theme: Theme) => {
    clearPreEvaluationState();
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      stage: GameStage.ThemeSelection,
      selectedTheme: theme,
      selectingDeckSlot: 1,
      gmMessage: `「${theme.name}」を選択しました。次に1つ目の専門スキルセットを選択してください。`
    }));

    setTimeout(() => {
        setGameState(prev => ({
            ...prev,
            isLoading: false,
            stage: GameStage.DeckSelection,
        }));
    }, 300);

  }, []);

  const handleDeckSelect = useCallback(async (deckId: string) => {
    const currentSelectingSlot = gameStateRef.current.selectingDeckSlot;
    const localSelectedTheme = gameStateRef.current.selectedTheme;
    const selectedDeckInfo = GAME_DECKS.find(d => d.id === deckId);

    if (!selectedDeckInfo || !localSelectedTheme || !currentSelectingSlot) return;

    setGameState(prev => ({ ...prev, isLoading: true, gmMessage: `「${selectedDeckInfo.name}」デッキを準備中...`}));

    const cardsForThisDeck = INITIAL_DX_CARDS.filter(card => selectedDeckInfo.cardIds.includes(card.id));

    if (currentSelectingSlot === 1) {
        setGameState(prev => ({
            ...prev,
            selectedDeckId1: deckId,
            availableCardsForDeck1: cardsForThisDeck,
            selectingDeckSlot: 2,
            isLoading: false,
            gmMessage: `1つ目のスキルセットとして「${selectedDeckInfo.name}」を選択しました。\n次に2つ目の専門スキルセットを選択してください。`
        }));
    } else if (currentSelectingSlot === 2) {
        if (deckId === gameStateRef.current.selectedDeckId1) {
            setGameState(prev => ({...prev, isLoading: false, gmMessage: "1つ目と同じデッキは選択できません。別のデッキを選んでください。"}));
            return;
        }

        let selectedInitialChallenge: string;
        const challengesForTheme = THEME_INITIAL_CHALLENGES[localSelectedTheme.id];
        if (challengesForTheme && Array.isArray(challengesForTheme) && challengesForTheme.length > 0) {
            selectedInitialChallenge = challengesForTheme[Math.floor(Math.random() * challengesForTheme.length)];
        } else {
            selectedInitialChallenge = "選択されたテーマの初期課題が見つかりませんでした。管理者にお問い合わせください。";
        }

        const availableCardsDeck1 = gameStateRef.current.availableCardsForDeck1;
        const { hand: drawn1, deck: newDeckState1 } = dealHand(
            availableCardsDeck1,
            INITIAL_HAND_SIZE,
        );

        const { hand: drawn2, deck: newDeckState2 } = dealHand(
            cardsForThisDeck,
            INITIAL_HAND_SIZE,
        );

        const initialCumulativeCost = 0;
        const initialChallengeHistoryEntry: ChallengeHistoryEntry = {
          challenge: selectedInitialChallenge,
          cumulativeCost: initialCumulativeCost,
        };

        setGameState(prev => ({
            ...prev,
            selectedDeckId2: deckId,
            availableCardsForDeck2: cardsForThisDeck,
            playerHand1: drawn1,
            deck1: newDeckState1,
            playerHand2: drawn2,
            deck2: newDeckState2,
            activeDeckId: prev.selectedDeckId1,
            stage: GameStage.PlayerTurn,
            initialChallenge: selectedInitialChallenge,
            currentChallenge: selectedInitialChallenge,
            challengeHistory: [initialChallengeHistoryEntry], // Updated
            turn: 1,
            cumulativeCost: initialCumulativeCost,
            gmMessage: `ゲーム開始！現在の課題は以下の通りです。\n手札から一枚選んでください。\n（アクティブスキルセット: ${GAME_DECKS.find(d=>d.id === prev.selectedDeckId1)?.name || 'デッキ1'}）`,
            isLoading: false,
            newlyDrawnCardId: drawn1.length > 0 ? drawn1[0].id : null,
            selectingDeckSlot: null,
        }));
        clearPreEvaluationState();
    }
  }, [drawCards]);

  const handleSwitchActiveDeck = useCallback((newActiveDeckId: string) => {
    const current = gameStateRef.current;
    if (newActiveDeckId === current.activeDeckId ||
        (newActiveDeckId !== current.selectedDeckId1 && newActiveDeckId !== current.selectedDeckId2)) {
      return;
    }
    clearPreEvaluationState();

    const newActiveDeckName = GAME_DECKS.find(d => d.id === newActiveDeckId)?.name || (newActiveDeckId === current.selectedDeckId1 ? "デッキ1" : "デッキ2");

    setGameState(prev => ({
      ...prev,
      activeDeckId: newActiveDeckId,
      gmMessage: `スキルセットを「${newActiveDeckName}」に切り替えました。手札を確認し、カードを選択してください。`,
      newlyDrawnCardId: null,
    }));
  }, []);


  const handlePlayCard = useCallback(async (card: Card) => {
    const current = gameStateRef.current;
    if (!current.selectedTheme || !current.activeDeckId || current.isLoading) return;

    Object.keys(preEvalControllersRef.current).forEach(controllerCardId => {
      if (controllerCardId !== card.id) { // Abort others, keep the one for the played card if it exists
        preEvalControllersRef.current[controllerCardId]?.abort();
        delete preEvalControllersRef.current[controllerCardId];
      }
    });

    setGameState(prev => ({
      ...prev,
      isLoading: true,
      stage: GameStage.EvaluatingPlay,
      gmMessage: `「${card.term}」の影響を分析中...`,
      lastPlayedCard: card,
      newlyDrawnCardId: null,
    }));

    let evaluationResult: EvaluationResponse | null = null;

    try {
      const currentChallengeForEval = current.currentChallenge;
      const preEvalForThisCard = current.preEvaluatedResults[card.id];
      const preEvalStatusForThisCard = current.preEvaluationStatus[card.id];

      if (preEvalForThisCard && preEvalForThisCard.challenge === currentChallengeForEval && preEvalStatusForThisCard === 'success') {
        evaluationResult = preEvalForThisCard.result;
         if (preEvalControllersRef.current[card.id]) { // Abort its own controller if pre-eval was used
          preEvalControllersRef.current[card.id]?.abort();
          delete preEvalControllersRef.current[card.id];
        }
      } else {
        if (preEvalControllersRef.current[card.id]) { // If a pre-eval was running for this card but not used (e.g. challenge changed)
          preEvalControllersRef.current[card.id]?.abort();
          delete preEvalControllersRef.current[card.id];
        }
        evaluationResult = await evaluateCardPlay(currentChallengeForEval, card, current.selectedTheme!.name);
      }

      if (!evaluationResult) throw new Error("Evaluation result was unexpectedly null.");

      const { newChallenge, evaluation, situationImproved } = evaluationResult;

      const currentTurn = current.turn;
      const currentChallengeHistory = current.challengeHistory;

      let newHandArray: Card[];
      let drawnCard: Card[] = [];
      let nextDeckState: Card[];
      let newlyDrawnId: string | null = null;
      let handUpdateProp: Partial<GameState> = {};

      if (current.activeDeckId === current.selectedDeckId1) {
        newHandArray = current.playerHand1.filter(c => c.id !== card.id);
        if (currentTurn < MAX_TURNS) {
          const drawResult = drawCards(current.deck1, 1, current.availableCardsForDeck1, newHandArray);
          drawnCard = drawResult.drawn;
          nextDeckState = drawResult.newDeck;
          if (drawnCard.length > 0) newlyDrawnId = drawnCard[0].id;
        } else {
          nextDeckState = current.deck1;
        }
        handUpdateProp = { playerHand1: [...newHandArray, ...drawnCard], deck1: nextDeckState };
      } else if (current.activeDeckId === current.selectedDeckId2) {
        newHandArray = current.playerHand2.filter(c => c.id !== card.id);
        if (currentTurn < MAX_TURNS) {
          const drawResult = drawCards(current.deck2, 1, current.availableCardsForDeck2, newHandArray);
          drawnCard = drawResult.drawn;
          nextDeckState = drawResult.newDeck;
          if (drawnCard.length > 0) newlyDrawnId = drawnCard[0].id;
        } else {
          nextDeckState = current.deck2;
        }
        handUpdateProp = { playerHand2: [...newHandArray, ...drawnCard], deck2: nextDeckState };
      }

      const newCumulativeCost = current.cumulativeCost + card.cost;
      const updatedChallengeHistoryEntry: ChallengeHistoryEntry = {
        challenge: newChallenge,
        cumulativeCost: newCumulativeCost,
      };
      const updatedChallengeHistory = [...currentChallengeHistory, updatedChallengeHistoryEntry];

      setGameState(prev => ({
        ...prev,
        ...handUpdateProp,
        currentChallenge: newChallenge,
        challengeHistory: updatedChallengeHistory,
        cumulativeCost: newCumulativeCost,
        gmMessage: `${evaluation}\n${situationImproved ? '状況は改善しました。' : '残念ながら、状況は悪化または停滞しました。'}`,
        isLoading: false,
        turn: prev.turn + 1,
        stage: prev.turn + 1 > MAX_TURNS ? GameStage.GameOverGeneratingEval : GameStage.PlayerTurn,
        newlyDrawnCardId: newlyDrawnId,
      }));

    } catch (error: any) {
       if (error.name === 'AbortError') {
        console.warn(`Evaluation for ${card.term} was aborted.`);
      } else {
        console.error("Failed to evaluate card play:", error);
      }
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        stage: GameStage.PlayerTurn,
        gmMessage: `カード評価中にエラーが発生しました: ${error.message || "不明なエラー"}. もう一度お試しください。`
      }));
    } finally {
      // Clear all pre-evals (including for the card just played, if its controller wasn't already deleted)
      // and trigger new ones for the updated hand/challenge.
      clearPreEvaluationState();
    }
  }, [drawCards]);

  useEffect(() => {
    const performFinalEvaluation = async () => {
        const currentGameState = gameStateRef.current;
        if (currentGameState.stage === GameStage.GameOverGeneratingEval && currentGameState.selectedTheme) {
            setGameState(prev => ({ ...prev, isLoading: true, gmMessage: "最終評価を生成中です..." }));
            try {
                const challengeTextsForHistory = currentGameState.challengeHistory.map(entry => entry.challenge);
                const finalEvalResult = await getFinalEvaluation(
                    currentGameState.currentChallenge,
                    currentGameState.selectedTheme.name,
                    challengeTextsForHistory, // Pass only challenge texts for Gemini prompt
                    currentGameState.cumulativeCost
                );
                setGameState(prev => ({
                    ...prev,
                    gmMessage: finalEvalResult.evaluationText,
                    finalScore: finalEvalResult.score,
                    isLoading: false,
                    stage: GameStage.GameOver,
                }));
            } catch (error: any) {
                console.error("Failed to get final evaluation:", error);
                const errorMessage = error.message || "最終評価の取得中に不明なエラーが発生しました。";
                setGameState(prev => ({
                    ...prev,
                    isLoading: false,
                    stage: GameStage.GameOver,
                    gmMessage: `最終評価の取得中にエラーが発生しました: ${errorMessage}`,
                    finalScore: undefined
                }));
            }
        }
    };
    performFinalEvaluation();
  }, [gameState.stage, gameState.cumulativeCost]);


  const handleShuffleCards = useCallback(async () => {
    clearPreEvaluationState();
    const current = gameStateRef.current;
    if (current.shufflesRemaining <= 0 || !current.selectedTheme || !current.selectedDeckId1 || !current.selectedDeckId2 || current.isLoading) return;

    setGameState(prev => ({ ...prev, isLoading: true, stage: GameStage.ShufflingCards, gmMessage: "両方のスキルセットのカードをシャッフルし、状況がカオスに変化します...", newlyDrawnCardId: null }));
    try {
      const newChallengeSituation = await shuffleChallengeEffect(current.currentChallenge, current.selectedTheme.name);

      const { hand: drawn1, deck: newDeckState1 } = dealHand(
          current.availableCardsForDeck1,
          INITIAL_HAND_SIZE,
          current.lastPlayedCard,
      );
      const { hand: drawn2, deck: newDeckState2 } = dealHand(
          current.availableCardsForDeck2,
          INITIAL_HAND_SIZE,
          current.lastPlayedCard,
      );

      const shuffleChallengeHistoryEntry: ChallengeHistoryEntry = {
        challenge: `シャッフルにより状況変化: ${newChallengeSituation}`,
        cumulativeCost: current.cumulativeCost // Cost doesn't change with shuffle, but record current cost
      };
      const updatedChallengeHistory = [...current.challengeHistory, shuffleChallengeHistoryEntry];

      setGameState(prev => ({
        ...prev,
        currentChallenge: newChallengeSituation,
        challengeHistory: updatedChallengeHistory,
        playerHand1: drawn1,
        deck1: newDeckState1,
        playerHand2: drawn2,
        deck2: newDeckState2,
        shufflesRemaining: prev.shufflesRemaining - 1,
        gmMessage: `カードをシャッフルしました！両方の手札が新しくなり、課題の状況が次のように変化しました...`,
        isLoading: false,
        stage: GameStage.PlayerTurn,
        newlyDrawnCardId: null,
      }));
    } catch (error) {
      console.error("Failed to shuffle cards:", error);
      setGameState(prev => ({ ...prev, isLoading: false, stage: GameStage.PlayerTurn, gmMessage: "シャッフル処理中にエラーが発生しました。" }));
    }
  }, [drawCards]);

  const handleRequestAdvice = useCallback(async () => {
    const current = gameStateRef.current;
    const activeHand = getActiveHand(); // Gets the current active hand
    if (current.adviceRemaining <= 0 || !current.selectedTheme || !current.activeDeckId || current.isLoading || activeHand.length === 0) return;

    // Pre-evaluations continue during GMAdvising, so no need to clear them here specifically.
    setGameState(prev => ({ ...prev, isLoading: true, stage: GameStage.GMAdvising, gmMessage: "専門家からのアドバイスを解析中..." }));
    try {
      const advice = await getAdvice(current.currentChallenge, activeHand, current.selectedTheme.name);
      setGameState(prev => ({
        ...prev,
        adviceRemaining: prev.adviceRemaining - 1,
        gmMessage: `専門家からのアドバイス:\n${advice}`,
        isLoading: false,
        stage: GameStage.PlayerTurn, // Return to PlayerTurn after advice
      }));
    } catch (error) {
      console.error("Failed to get advice:", error);
      setGameState(prev => ({ ...prev, isLoading: false, stage: GameStage.PlayerTurn, gmMessage: "アドバイス取得中にエラーが発生しました。" }));
    }
  }, [getActiveHand]); // getActiveHand is stable due to useRef, actual hand data changes trigger pre-eval useEffect

  const handleRestartGame = () => {
    clearPreEvaluationState();
    setGameState(initialGameState);
  };

  const renderThemeSelectionStage = () => (
    gameState.isLoading && gameState.stage === GameStage.ThemeSelection && !gameState.selectingDeckSlot ?
    <div className="flex justify-center items-center h-64"><LoadingSpinner /></div> :
    <ThemeSelector themes={GAME_THEMES} onSelectTheme={handleThemeSelect} />
  );

  const renderDeckSelectionStage = () => {
    if (!gameState.selectingDeckSlot) {
        return <div className="text-center p-4">デッキ選択の準備中です...</div>;
    }
    if (gameState.isLoading && gameState.stage === GameStage.DeckSelection) {
        return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
    }
    return (
        <>
        <GMDisplay
            message={gameState.gmMessage}
            currentChallenge=""
            isLoading={false}
            stage={gameState.stage}
        />
        <DeckSelectorComponent
            decks={GAME_DECKS}
            onSelectDeck={handleDeckSelect}
            selectingDeckSlot={gameState.selectingDeckSlot}
            deck1IdAlreadySelected={gameState.selectedDeckId1}
        />
        </>
    );
  }

  const renderActiveDeckInfo = () => {
    if (gameState.stage !== GameStage.PlayerTurn &&
        gameState.stage !== GameStage.EvaluatingPlay && // Added to show during inline eval
        gameState.stage !== GameStage.GameOver &&
        gameState.stage !== GameStage.GMAdvising) return null;
    if (!gameState.selectedDeckId1 || !gameState.selectedDeckId2) return null;


    const deck1 = GAME_DECKS.find(d => d.id === gameState.selectedDeckId1);
    const deck2 = GAME_DECKS.find(d => d.id === gameState.selectedDeckId2);

    if (!deck1 || !deck2) return null;

    const activeDeckIs1 = gameState.activeDeckId === gameState.selectedDeckId1;
    const activeDeckName = activeDeckIs1 ? deck1.name : deck2.name;

    return (
      <div className="my-4 p-3 bg-slate-700/70 rounded-lg shadow-md text-sm text-center border border-slate-600">
        <div className="grid grid-cols-2 gap-2 items-center">
            <p className={`text-slate-300 truncate ${activeDeckIs1 ? "font-bold text-cyan-300" : "text-slate-100"}`} title={deck1.name}>
              スキルセット1: {deck1.name}
            </p>
            <p className={`text-slate-300 truncate ${!activeDeckIs1 ? "font-bold text-cyan-300" : "text-slate-100"}`} title={deck2.name}>
              スキルセット2: {deck2.name}
            </p>
        </div>
        <p className="mt-2 text-xs text-teal-400">現在アクティブ: <span className="font-semibold">{activeDeckName}</span></p>
      </div>
    );
  };


  const renderLoadingStage = () => (
    <>
    <GMDisplay
      message={gameState.gmMessage}
      initialChallenge={gameState.initialChallenge}
      currentChallenge={gameState.currentChallenge}
      isLoading={true}
      lastPlayedCard={gameState.lastPlayedCard}
      turn={gameState.turn}
      maxTurns={MAX_TURNS}
      stage={gameState.stage}
      finalScore={gameState.finalScore}
    />
    {renderActiveDeckInfo()}
    </>
  );

  const renderPlayerTurnStage = () => { // This also covers GMAdvising and EvaluatingPlay for display purposes
    const activeHand = getActiveHand();
    return (
        <>
        <GMDisplay
            message={gameState.gmMessage}
            initialChallenge={gameState.initialChallenge}
            currentChallenge={gameState.currentChallenge}
            isLoading={gameState.isLoading && gameState.stage !== GameStage.GMAdvising}
            lastPlayedCard={gameState.lastPlayedCard}
            turn={gameState.turn}
            maxTurns={MAX_TURNS}
            stage={gameState.stage}
            finalScore={gameState.finalScore}
        />
        {renderActiveDeckInfo()}
        <GameBoard
            cards={activeHand}
            onPlayCard={handlePlayCard}
            newlyDrawnCardId={gameState.newlyDrawnCardId}
            preEvaluationStatus={gameState.preEvaluationStatus}
        />
        <GameControls
            shufflesRemaining={gameState.shufflesRemaining}
            adviceRemaining={gameState.adviceRemaining}
            onShuffle={handleShuffleCards}
            onAdvice={handleRequestAdvice}
            canPlay={!gameState.isLoading && (gameState.stage === GameStage.PlayerTurn || gameState.stage === GameStage.GMAdvising)}
            turn={gameState.turn}
            maxTurns={MAX_TURNS}
            activeDeckId={gameState.activeDeckId}
            deckId1={gameState.selectedDeckId1}
            deckName1={GAME_DECKS.find(d => d.id === gameState.selectedDeckId1)?.name}
            deckId2={gameState.selectedDeckId2}
            deckName2={GAME_DECKS.find(d => d.id === gameState.selectedDeckId2)?.name}
            onSwitchDeck={handleSwitchActiveDeck}
        />
        </>
    );
  }

  const renderGameOverStage = () => (
    <>
      <GMDisplay
        message={gameState.gmMessage} // This will now contain only the evaluationText
        challengeHistory={gameState.challengeHistory} // Pass the history (now with cumulative costs)
        isLoading={false}
        stage={gameState.stage}
        finalScore={gameState.finalScore}
        cumulativeCost={gameState.cumulativeCost} // Pass final cumulativeCost
        currentChallenge={gameState.currentChallenge}
      />
      {renderActiveDeckInfo()}
      <div className="mt-8 text-center">
        <button
          onClick={handleRestartGame}
          className="bg-teal-600 hover:bg-teal-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-teal-400 focus:ring-opacity-60 border border-teal-700 hover:border-teal-500"
          aria-label="もう一度プレイする"
        >
          もう一度プレイする
        </button>
      </div>
    </>
  );

  const renderGameContent = () => {
    switch (gameState.stage) {
      case GameStage.ThemeSelection:
        return renderThemeSelectionStage();

      case GameStage.DeckSelection:
        return renderDeckSelectionStage();

      case GameStage.ShufflingCards:
      case GameStage.GameOverGeneratingEval:
        return renderLoadingStage(); // These stages use the main loading display for now

      case GameStage.EvaluatingPlay: // Changed to use renderPlayerTurnStage for inline loading
      case GameStage.PlayerTurn:
      case GameStage.GMAdvising:
        return renderPlayerTurnStage();

      case GameStage.GameOver:
        return renderGameOverStage();

      default:
        return <div role="alert" className="text-red-400 text-center p-4">予期せぬゲームステージ ({gameState.stage}) です。ページを再読み込みしてください。</div>;
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center text-slate-300">
      <header className="w-full mb-10 text-center">
        <h1 className="text-5xl font-extrabold text-cyan-400 py-2"
            style={{textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 1px rgba(6,182,212,0.2)'}}>
          課題解決DXカードゲーム
        </h1>
      </header>
      <main className="w-full max-w-5xl bg-slate-800 shadow-2xl rounded-2xl p-6 md:p-10 border border-slate-700">
        {renderGameContent()}
      </main>
      <footer className="w-full mt-16 mb-8 text-center text-slate-500 text-sm">
        <p>&copy; 2025 DX Card Game. Powered by Gemini API. Dual-Deck Strategist Edition.</p>
      </footer>
    </div>
  );
};

export default CardGame;
