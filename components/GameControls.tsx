
import React from 'react';
import { ArrowPathIcon, AcademicCapIcon, ArrowsRightLeftIcon } from './icons'; // Added ArrowsRightLeftIcon

interface GameControlsProps {
  shufflesRemaining: number;
  adviceRemaining: number;
  onShuffle: () => void;
  onAdvice: () => void;
  canPlay: boolean;
  turn: number;
  maxTurns: number;
  activeDeckId: string | null;
  deckId1: string | null;
  deckName1?: string | null;
  deckId2: string | null;
  deckName2?: string | null;
  onSwitchDeck: (deckId: string) => void;
}

const GameControls: React.FC<GameControlsProps> = ({
  shufflesRemaining,
  adviceRemaining,
  onShuffle,
  onAdvice,
  canPlay,
  turn,
  maxTurns,
  activeDeckId,
  deckId1,
  deckName1,
  deckId2,
  deckName2,
  onSwitchDeck
}) => {
  const gameIsActive = turn > 0 && turn <= maxTurns;

  if (!gameIsActive) {
    return null;
  }

  const baseButtonClasses = "px-4 py-2.5 font-medium rounded-md shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out flex items-center justify-center focus:outline-none focus:ring-2 transform active:scale-95 w-full sm:w-auto text-sm border";

  const enabledShuffleClasses = "bg-cyan-600 hover:bg-cyan-500 text-white focus:ring-cyan-400/70 border-cyan-700 hover:border-cyan-500 shadow-cyan-900/30 hover:shadow-cyan-700/40";
  const enabledAdviceClasses = "bg-teal-600 hover:bg-teal-500 text-white focus:ring-teal-400/70 border-teal-700 hover:border-teal-500 shadow-teal-900/30 hover:shadow-teal-700/40";
  const enabledSwitchClasses = "bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-400/70 border-indigo-700 hover:border-indigo-500 shadow-indigo-900/30 hover:shadow-indigo-700/40";
  const activeSwitchClasses = "bg-slate-500 text-slate-300 cursor-default border-slate-400 opacity-80 ring-2 ring-sky-400 ring-inset"; // For the active deck button
  const disabledClasses = "bg-slate-600 text-slate-400 cursor-not-allowed opacity-60 border-slate-500";

  const canSwitchDecks = canPlay && deckId1 && deckId2;

  return (
    <div className="mt-6 p-4 bg-slate-700/50 rounded-lg shadow-md border border-slate-600/80 space-y-4">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
        <button
          onClick={onShuffle}
          disabled={shufflesRemaining <= 0 || !canPlay}
          className={`${baseButtonClasses} ${shufflesRemaining > 0 && canPlay ? enabledShuffleClasses : disabledClasses}`}
          aria-label={`カードをシャッフルする (${shufflesRemaining}回残り)`}
          aria-disabled={shufflesRemaining <= 0 || !canPlay}
        >
          <ArrowPathIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          シャッフル ({shufflesRemaining}回)
        </button>
        <button
          onClick={onAdvice}
          disabled={adviceRemaining <= 0 || !canPlay}
          className={`${baseButtonClasses} ${adviceRemaining > 0 && canPlay ? enabledAdviceClasses : disabledClasses}`}
          aria-label={`専門家にアドバイスを求める (${adviceRemaining}回残り)`}
          aria-disabled={adviceRemaining <= 0 || !canPlay}
        >
          <AcademicCapIcon className="w-4 h-4 mr-2" aria-hidden="true" />
          アドバイス ({adviceRemaining}回)
        </button>
      </div>

      {deckId1 && deckId2 && (
        <div className="pt-4 border-t border-slate-600 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
          <span className="text-sm text-slate-300 hidden sm:block">スキルセット切替:</span>
          {deckId1 && (
            <button
              onClick={() => onSwitchDeck(deckId1)}
              disabled={!canSwitchDecks || activeDeckId === deckId1}
              className={`${baseButtonClasses} ${activeDeckId === deckId1 ? activeSwitchClasses : (canSwitchDecks ? enabledSwitchClasses : disabledClasses)}`}
              aria-label={`${deckName1 || 'スキルセット1'}に切り替え`}
              aria-pressed={activeDeckId === deckId1}
              aria-disabled={!canSwitchDecks || activeDeckId === deckId1}
            >
              <ArrowsRightLeftIcon className="w-4 h-4 mr-1.5 sm:mr-2" aria-hidden="true"/>
              <span className="truncate max-w-[100px] sm:max-w-[120px]">{deckName1 || 'スキルセット1'}</span>
              {activeDeckId === deckId1 && <span className="ml-1.5 text-xs">(有効)</span>}
            </button>
          )}
          {deckId2 && (
            <button
              onClick={() => onSwitchDeck(deckId2)}
              disabled={!canSwitchDecks || activeDeckId === deckId2}
              className={`${baseButtonClasses} ${activeDeckId === deckId2 ? activeSwitchClasses : (canSwitchDecks ? enabledSwitchClasses : disabledClasses)}`}
              aria-label={`${deckName2 || 'スキルセット2'}に切り替え`}
              aria-pressed={activeDeckId === deckId2}
              aria-disabled={!canSwitchDecks || activeDeckId === deckId2}
            >
                <ArrowsRightLeftIcon className="w-4 h-4 mr-1.5 sm:mr-2" aria-hidden="true"/>
                <span className="truncate max-w-[100px] sm:max-w-[120px]">{deckName2 || 'スキルセット2'}</span>
                {activeDeckId === deckId2 && <span className="ml-1.5 text-xs">(有効)</span>}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GameControls;
