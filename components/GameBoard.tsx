
import React, { useState } from 'react';
import { Card, GameState } from '../types'; 
import CardComponent from './CardComponent';

interface GameBoardProps {
  cards: Card[];
  onPlayCard: (card: Card) => void;
  newlyDrawnCardId?: string | null;
  preEvaluationStatus?: GameState['preEvaluationStatus']; 
}

const GameBoard: React.FC<GameBoardProps> = ({ cards, onPlayCard, newlyDrawnCardId, preEvaluationStatus }) => {
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  if (!cards || cards.length === 0) {
    return <div className="my-10 text-center text-slate-500" role="status">手札にカードがありません。</div>;
  }

  const numCards = cards.length;
  const maxRotation = numCards > 1 ? 15 : 0; 
  const cardWidth = 240; 
  const fanWidth = cardWidth * (1 + (numCards -1) * 0.45) ; 
  const cardHeight = 340; 

  return (
    <div className="my-8 py-4">
      <h3 className="text-2xl font-semibold mb-2 text-center text-cyan-400"> 
          あなたの手札 (カードを選択してください)
      </h3>
      <div 
        className="relative flex justify-center items-end mx-auto" 
        style={{ height: `${cardHeight + 50}px`, width: `${Math.min(fanWidth, 800)}px`, minWidth: '300px', maxWidth: '100%'}}
        role="group" 
        aria-label="プレイヤーの手札（扇形配列）"
      >
        {cards.map((card, index) => {
          const middleIndex = (numCards - 1) / 2;
          let rotation = 0;
          let translateX = 0;
          let translateY = 0;
          
          if (numCards > 1) {
            const rotationFactor = middleIndex === 0 ? 0 : maxRotation / middleIndex; 
            rotation = (index - middleIndex) * rotationFactor;
            translateX = (index - middleIndex) * (cardWidth * 0.45); 
            translateY = Math.abs(index - middleIndex) * (numCards > 3 ? 18 : 15); 
          }

          const isHovered = card.id === hoveredCardId;
          const cardEvalStatus = preEvaluationStatus ? preEvaluationStatus[card.id] : undefined;
          const isNewlyDrawnForAnimation = card.id === newlyDrawnCardId;

          const fanLayoutTransform = `
            translateY(${isHovered ? -10 : translateY}px) 
            translateX(${translateX}px) 
            rotate(${isHovered ? 0 : rotation}deg)
            scale(${isHovered ? 1.1 : 1})
          `;

          const entryAnimationTransform = `
            translateY(-150px) 
            translateX(${translateX}px) 
            rotate(-20deg) 
            scale(0.7)
          `;
          
          const currentTransform = isNewlyDrawnForAnimation ? entryAnimationTransform : fanLayoutTransform;
          const currentOpacity = isNewlyDrawnForAnimation ? 0 : 1;
          const currentZIndex = isNewlyDrawnForAnimation ? 200 : (isHovered ? 100 : index);


          const style: React.CSSProperties = {
            position: 'absolute',
            zIndex: currentZIndex,
            transform: currentTransform,
            opacity: currentOpacity,
            transition: `transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.5s ease-out ${isNewlyDrawnForAnimation ? '0.1s' : '0s'}, z-index 0s linear 0.15s`,
            transformOrigin: 'bottom center',
          };

          return (
            <div
              key={card.id} 
              style={style}
              onMouseEnter={() => setHoveredCardId(card.id)}
              onMouseLeave={() => setHoveredCardId(null)}
              className="flex-shrink-0" 
            >
              <CardComponent
                card={card}
                onPlayCard={onPlayCard}
                isPlayable={true}
                isNew={card.id === newlyDrawnCardId} 
                evaluationStatus={cardEvalStatus}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
