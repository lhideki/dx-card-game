
"use client";

import React from 'react';
import { Card, GameState } from '../types'; // GameState for evaluationStatus type
import { InfoIcon, BriefcaseIcon, SparklesIcon, TagIcon, ClockIcon, ExclamationTriangleIcon, CurrencyYenIcon } from './icons.tsx'; 

interface CardComponentProps {
  card: Card;
  onPlayCard?: (card: Card) => void;
  isPlayable?: boolean;
  isNew?: boolean;
  evaluationStatus?: GameState['preEvaluationStatus'][string];
}

const ImpactPips: React.FC<{ level: 'High' | 'Medium' | 'Low' }> = ({ level }) => {
  const pipCount = level === 'High' ? 3 : level === 'Medium' ? 2 : 1;
  const pips = [];
  for (let i = 0; i < 3; i++) {
    pips.push(
      <span
        key={i}
        className={`inline-block w-2 h-2 rounded-full ml-1 ${
          i < pipCount ? 'bg-cyan-500' : 'bg-slate-600' 
        }`}
        aria-label={i < pipCount ? "インパクトあり" : "インパクトなし"}
      ></span>
    );
  }
  return <>{pips}</>;
};

const CostPips: React.FC<{ cost: number }> = ({ cost }) => {
  const pips = [];
  for (let i = 0; i < 5; i++) { // Max cost of 5
    pips.push(
      <span
        key={i}
        className={`inline-block w-2 h-2 rounded-full ml-1 ${
          i < cost ? 'bg-amber-500' : 'bg-slate-600'
        }`}
        aria-label={i < cost ? "コストあり" : "コストなし"}
      ></span>
    );
  }
  return <>{pips}</>;
};


const subtleCardStockPattern = `data:image/svg+xml,${encodeURIComponent(
  `<svg width='12' height='12' viewBox='0 0 12 12' xmlns='http://www.w3.org/2000/svg'>
    <defs>
      <pattern id='subtleCardStock' patternUnits='userSpaceOnUse' width='12' height='12'>
        <circle cx='1' cy='1' r='0.3' fill='#475569' fill-opacity='0.15'/>
        <circle cx='7' cy='2' r='0.4' fill='#334155' fill-opacity='0.1'/>
        <circle cx='4' cy='5' r='0.25' fill='#475569' fill-opacity='0.18'/>
        <circle cx='9' cy='6' r='0.35' fill='#334155' fill-opacity='0.09'/>
        <circle cx='2' cy='8' r='0.3' fill='#475569' fill-opacity='0.12'/>
        <circle cx='6' cy='10' r='0.4' fill='#334155' fill-opacity='0.14'/>
         <circle cx='10' cy='11' r='0.2' fill='#475569' fill-opacity='0.08'/>
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#subtleCardStock)'/>
  </svg>`
)}`;


const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  onPlayCard, 
  isPlayable = false, 
  isNew = false,
  evaluationStatus
}) => {
  const handleCardClick = () => {
    if (onPlayCard && isPlayable) {
      onPlayCard(card);
    }
  };

  const baseContainerClasses = 'relative rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ease-in-out border-2 w-[240px] min-h-[380px] group'; // Increased min-h for cost
  
  let cardGradientValue = 'linear-gradient(to bottom right, #475569, #1e293b)'; 
  let borderColor = 'border-slate-500'; 
  let shadow = 'shadow-xl shadow-slate-900/60'; 
  let termTextColor = 'text-cyan-400';
  let termIconColor = 'text-cyan-500';
  let cursorStyles = '';
  let animationStyles = '';
  let hoverStyles = 'group-hover:shadow-2xl group-hover:shadow-cyan-700/30';
  let newBadge = null;
  let innerBorderStyle = 'shadow-[inset_0_0_0_1px_rgba(100,116,139,0.4)]'; 

  if (isNew) {
    cardGradientValue = `linear-gradient(145deg, #0f172a 0%, #1e293b 40%, #065f46 100%)`; 
    borderColor = 'border-cyan-400'; 
    shadow = 'shadow-2xl shadow-cyan-500/50'; 
    animationStyles = 'animate-pulse-border'; 
    termTextColor = 'text-cyan-300';
    termIconColor = 'text-cyan-400';
    innerBorderStyle = 'shadow-[inset_0_0_0_1px_rgba(34,211,238,0.6),_inset_0_0_0_3px_rgba(20,83,96,0.3)]'; 
    if (isPlayable) {
        newBadge = (
            <div 
              className={`absolute -top-3 -right-3 bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-md shadow-lg transform z-10 animate-pulse-new-badge group-hover:scale-105 transition-transform border-2 border-slate-800`}
              aria-hidden="true"
            >
              NEW!
            </div>
        );
    }
  } else if (!isPlayable) { 
    cardGradientValue = 'linear-gradient(to bottom right, #334155, #0f172a)'; 
    borderColor = 'border-slate-700'; 
    shadow = 'shadow-lg shadow-slate-950/40'; 
    animationStyles += ' opacity-60 saturate-[0.6]'; 
    hoverStyles = ''; 
    innerBorderStyle = 'shadow-[inset_0_0_0_1px_rgba(51,65,85,0.5)]'; 
  } else { 
    borderColor = 'border-slate-500 group-hover:border-cyan-500'; 
    shadow = 'shadow-xl shadow-slate-900/60'; 
    hoverStyles = 'group-hover:shadow-2xl group-hover:shadow-cyan-600/30 group-hover:shadow-[inset_0_0_0_1px_rgba(34,211,238,0.5)]'; 
  }

  if (isPlayable) {
    cursorStyles = 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/80 focus:ring-offset-2 focus:ring-offset-slate-900 transform group-hover:scale-[1.03]';
  }
  
  const finalBackgroundImageStyle = `url("${subtleCardStockPattern}"), ${cardGradientValue}`;

  let statusIcon = null;
  let statusLabel = "";

  if (evaluationStatus === 'pending') {
    statusIcon = <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>;
    statusLabel = "バックグラウンドで評価中";
  } else if (evaluationStatus === 'idle') {
    statusIcon = <ClockIcon className="w-4 h-4 text-sky-400" />;
    statusLabel = "評価待機中";
  } else if (evaluationStatus === 'error') {
    statusIcon = <ExclamationTriangleIcon className="w-4 h-4 text-red-400" />;
    statusLabel = "評価エラー";
  } else if (evaluationStatus === 'aborted') {
    statusIcon = <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />;
    statusLabel = "評価中断";
  }


  return (
    <div
      className={`${baseContainerClasses} ${borderColor} ${shadow} ${cursorStyles} ${animationStyles} ${hoverStyles} ${innerBorderStyle}`}
      style={{ 
        backgroundImage: finalBackgroundImageStyle,
      }}
      onClick={handleCardClick}
      role={isPlayable ? "button" : undefined}
      tabIndex={isPlayable ? 0 : undefined}
      onKeyDown={isPlayable ? (e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick() : undefined}
      aria-label={`${card.term} カード${isPlayable ? '. クリックまたはEnterで使用します。' : '.'}${statusLabel ? ` (${statusLabel})` : ''}`}
    >
      {newBadge}
      {statusIcon && (
        <div 
            className="absolute top-2.5 right-2.5"
            role="status"
            aria-label={statusLabel}
            title={statusLabel}
        >
          {statusIcon}
        </div>
      )}
      <div>
        <h3 className={`text-xl font-bold mb-2.5 flex items-center ${termTextColor} tracking-tight`}>
          <SparklesIcon className={`w-5 h-5 mr-2 ${termIconColor} flex-shrink-0`} aria-hidden="true" />
          {card.term}
        </h3>
        
        <div className="mb-3">
          <p className="text-xs font-semibold flex items-start mb-0.5 text-slate-400 uppercase tracking-wider">
            <TagIcon className="w-3.5 h-3.5 mr-1.5 mt-px text-slate-500 flex-shrink-0" aria-hidden="true" />
            カテゴリ
          </p>
          <p className="text-sm text-slate-300 ml-[20px] leading-snug">{card.category}</p>
        </div>

        <div className="mb-3">
          <p className="text-xs font-semibold flex items-start mb-0.5 text-slate-400 uppercase tracking-wider">
            <BriefcaseIcon className="w-3.5 h-3.5 mr-1.5 mt-px text-slate-500 flex-shrink-0" aria-hidden="true" />
            ユースケース
          </p>
          <p className="text-sm text-slate-300 ml-[20px] leading-snug">{card.useCase}</p>
        </div>

        <div className="mb-3">
           <p className="text-xs font-semibold flex items-start mb-0.5 text-teal-500 uppercase tracking-wider">
            <InfoIcon className="w-3.5 h-3.5 mr-1.5 mt-px text-teal-600 flex-shrink-0" aria-hidden="true" />
            概要
          </p>
          <p className="text-sm text-slate-300 ml-[20px] leading-snug">{card.description}</p>
        </div>

        <div className="mb-1 mt-auto pt-2 border-t border-slate-700/70">
          <p className="text-xs font-semibold flex items-center text-teal-500 uppercase tracking-wider mb-1.5">
            <SparklesIcon className="w-3.5 h-3.5 mr-1.5 text-teal-600 flex-shrink-0" aria-hidden="true" />
            インパクト
            <span className="ml-auto text-sm font-bold text-slate-100 flex items-center normal-case">
                {card.impact} <ImpactPips level={card.impact} />
            </span>
          </p>
          <p className="text-xs font-semibold flex items-center text-amber-500 uppercase tracking-wider">
            <CurrencyYenIcon className="w-3.5 h-3.5 mr-1.5 text-amber-600 flex-shrink-0" aria-hidden="true" />
            コスト
            <span className="ml-auto text-sm font-bold text-slate-100 flex items-center normal-case">
                {card.cost} <CostPips cost={card.cost} />
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CardComponent;
