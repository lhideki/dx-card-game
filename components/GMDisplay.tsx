
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, GameStage, ChallengeHistoryEntry } from '../types'; // Added ChallengeHistoryEntry
import { ChatBubbleLeftEllipsisIcon, ClipboardDocumentCheckIcon, SparklesIcon, InformationCircleIcon, CurrencyYenIcon } from './icons.tsx'; 
import LoadingSpinner from './LoadingSpinner.tsx';

interface GMDisplayProps {
  message: string;
  initialChallenge?: string | null; 
  currentChallenge: string;
  challengeHistory?: ChallengeHistoryEntry[]; // Updated type
  isLoading?: boolean;
  lastPlayedCard?: Card | null;
  turn?: number;
  maxTurns?: number;
  stage?: GameStage;
  finalScore?: number;
  cumulativeCost?: number; 
}

const GMDisplay: React.FC<GMDisplayProps> = ({ 
    message, 
    initialChallenge, 
    currentChallenge, 
    challengeHistory,
    isLoading, 
    lastPlayedCard, 
    turn, 
    maxTurns,
    stage,
    finalScore,
    cumulativeCost 
}) => {
  
  const isAdvice = stage !== GameStage.GameOver && message.toLowerCase().startsWith("専門家からのアドバイス:");
  const displayTitleBase = isAdvice ? "専門家からのアドバイス" : "ゲームマスターからのメッセージ";
  const displayMessageContent = isAdvice ? message.substring("専門家からのアドバイス:".length).trimStart() : message;

  return (
    <div className="bg-slate-700/60 backdrop-blur-md p-6 rounded-lg shadow-xl mb-8 border border-slate-600">
      {/* Turn display (only for active game, not game over) */}
      {turn !== undefined && maxTurns !== undefined && turn > 0 && stage !== GameStage.GameOver && (
         <div className="text-right text-sm text-slate-400 mb-3 font-mono" aria-label={`現在のターン: ${turn} / ${maxTurns}`}>
           TURN: {turn} / {maxTurns}
         </div>
      )}

      {/* Game Over Specific Layout */}
      {stage === GameStage.GameOver && finalScore !== undefined && challengeHistory && challengeHistory.length > 0 ? (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-cyan-300 flex items-center mb-4">
              <ClipboardDocumentCheckIcon className="w-6 h-6 mr-2.5 text-cyan-400" aria-hidden="true"/>
              課題の変遷
            </h2>
            <ul className="list-none space-y-4 pl-1">
              {challengeHistory.map((historyItem, index) => (
                <li key={index} className="pb-3 border-b border-slate-600/70 last:border-b-0 last:pb-0">
                  <div className="text-sm font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                    <div className="flex items-center">
                      <SparklesIcon className="w-4 h-4 mr-2 text-teal-500 opacity-80" aria-hidden="true"/>
                      ステップ {index + 1}
                      {index === 0 && <span className="ml-2 text-xs text-amber-400 bg-amber-800/60 px-2 py-0.5 rounded-full shadow-sm border border-amber-600/50">(初期課題)</span>}
                      {index === challengeHistory.length - 1 && <span className="ml-2 text-xs text-green-400 bg-green-800/60 px-2 py-0.5 rounded-full shadow-sm border border-green-600/50">(最終状況)</span>}
                    </div>
                    <span className="text-xs text-amber-300 bg-slate-600/50 px-2 py-0.5 rounded-full shadow-sm border border-slate-500/70">
                      累計コスト: {historyItem.cumulativeCost}
                    </span>
                  </div>
                  <div className="text-slate-300 leading-relaxed markdown-content text-base ml-[26px]">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{historyItem.challenge}</ReactMarkdown>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <hr className="my-6 border-slate-600" />
          
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-teal-300 flex items-center mb-2">
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-teal-400" aria-hidden="true"/>
              最終評価コメント
            </h3>
            <div className="text-slate-200 leading-relaxed markdown-content text-base">
               {/* message prop now contains only finalEvalResult.evaluationText from App.tsx */}
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
            </div>
          </div>
          
          {cumulativeCost !== undefined && ( // This shows the FINAL cumulative cost, separate from per-step
            <div className="mt-6 p-3 bg-slate-600/40 rounded-md border border-slate-500/60 text-center shadow">
              <p className="text-sm font-medium text-amber-300 flex items-center justify-center">
                <CurrencyYenIcon className="w-4 h-4 mr-1.5 text-amber-400" aria-hidden="true"/>
                最終累計コスト: 
                <span className="ml-1.5 font-bold text-amber-200 text-base">{cumulativeCost}</span>
              </p>
            </div>
          )}

          <div className="mt-8 p-5 bg-gradient-to-br from-cyan-700/50 via-slate-700/60 to-teal-700/50 rounded-lg border border-cyan-600/80 text-center shadow-2xl">
            <h4 className="text-xl font-semibold text-cyan-200 mb-2">最終スコア</h4>
            <p className="text-5xl font-bold text-white tracking-tight">
              {finalScore} 
              <span className="text-2xl text-cyan-300 align-baseline"> / 100</span>
            </p>
            <p className="mt-3 text-sm text-slate-400">ゲーム終了！お疲れ様でした。</p>
          </div>
        </>
      ) : (
        <>
          {/* Regular Game Play Layout (Non-GameOver Stages) */}
          {initialChallenge && initialChallenge !== currentChallenge && turn !== undefined && turn > 0 && (
            <div className="mb-5 opacity-90">
              <h2 className="text-sm font-semibold text-slate-400 flex items-center mb-1.5">
                <InformationCircleIcon className="w-4 h-4 mr-1.5 text-slate-500" aria-hidden="true"/>
                当初の課題:
              </h2>
              <div className="text-slate-300 leading-normal markdown-content text-base border-l-2 border-slate-500 pl-3">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{initialChallenge}</ReactMarkdown>
              </div>
            </div>
          )}
          
          {currentChallenge && ( // Always show current challenge if available in non-GameOver stages
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-cyan-400 flex items-center mb-2">
                <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2 text-cyan-500" aria-hidden="true"/>
                {initialChallenge && initialChallenge !== currentChallenge && turn !== undefined && turn > 0 ? "現在の状況:" : "現在の課題:"}
              </h2>
              <div className="text-slate-200 leading-normal markdown-content text-base">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentChallenge}</ReactMarkdown>
              </div>
            </div>
          )}

          {lastPlayedCard && (
             <div className="my-5 p-3 bg-slate-600/50 rounded-md border border-slate-500/80 shadow-sm">
                <p className="text-sm text-cyan-400 font-medium flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-1.5 text-cyan-500" aria-hidden="true"/>
                    あなたがプレイしたカード: <span className="ml-1.5 font-semibold text-slate-100">{lastPlayedCard.term}</span>
                </p>
                <p className="text-sm text-slate-400 italic mt-1 ml-[22px]">{lastPlayedCard.useCase}</p>
             </div>
          )}

          {isLoading && (
            <div className="my-6">
              <LoadingSpinner />
            </div>
          )}

          <div className={`mt-5 ${isLoading ? 'opacity-70' : ''}`}>
            <h3 className="text-sm font-semibold text-teal-400 flex items-center mb-1.5">
              <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-2 text-teal-500" aria-hidden="true"/>
              {displayTitleBase}:
            </h3>
            <div className="text-slate-200 leading-normal markdown-content text-base">
               <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayMessageContent}</ReactMarkdown>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GMDisplay;