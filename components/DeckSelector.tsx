import React from 'react';
import { Deck }  from '../types';
import {
  CpuChipIcon,
  CircleStackIcon,
  UserCircleIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  UserGroupIcon, // Added
  BoltIcon,        // Added
  RocketLaunchIcon, // Added
  ChartPieIcon     // Added
} from './icons';

interface DeckSelectorProps {
  decks: Deck[];
  onSelectDeck: (deckId: string) => void;
  selectingDeckSlot: 1 | 2;
  deck1IdAlreadySelected?: string | null;
}

const DeckIcon: React.FC<{deckId: string}> = ({ deckId }) => {
  const iconColor = "text-cyan-500 group-hover:text-cyan-400 group-focus:text-cyan-400";
  const iconColorAlt = "text-teal-500 group-hover:text-teal-400 group-focus:text-teal-400";
  const iconSize = "w-10 h-10 mb-3 transition-colors duration-200";

  switch (deckId) {
    case 'deck_core_dx_strategy':
      return <LightBulbIcon className={`${iconSize} ${iconColor}`} />;
    case 'deck_customer_experience_innovator':
      return <UserGroupIcon className={`${iconSize} ${iconColorAlt}`} />;
    case 'deck_operational_excellence_automation':
      return <BoltIcon className={`${iconSize} ${iconColor}`} />;
    case 'deck_agile_product_development':
      return <RocketLaunchIcon className={`${iconSize} ${iconColorAlt}`} />;
    case 'deck_data_analytics_ai':
      return <ChartPieIcon className={`${iconSize} ${iconColor}`} />;
    case 'deck_secure_digital_infrastructure':
      return <ShieldCheckIcon className={`${iconSize} ${iconColorAlt}`} />;
    // Fallback for any potentially unmapped old IDs or new ones during transition
    case 'deck_agile_innovator': return <CpuChipIcon className={`${iconSize} ${iconColor}`} />; // old
    case 'deck_data_strategist': return <CircleStackIcon className={`${iconSize} ${iconColorAlt}`} />; // old
    case 'deck_enterprise_transformer': return <UserCircleIcon className={`${iconSize} ${iconColor}`} />; // old
    case 'deck_secure_infra_ops': return <ShieldCheckIcon className={`${iconSize} ${iconColorAlt}`} />; // old, maps to new
    case 'deck_customer_centric': return <BuildingStorefrontIcon className={`${iconSize} ${iconColor}`} />; // old
    case 'deck_future_tech_pioneer': return <GlobeAltIcon className={`${iconSize} ${iconColorAlt}`} />; // old
    default:
      return <LightBulbIcon className={`${iconSize} text-slate-500`} />;
  }
};

const DeckSelectorComponent: React.FC<DeckSelectorProps> = ({ decks, onSelectDeck, selectingDeckSlot, deck1IdAlreadySelected }) => {
  const titleText = `専門スキルセットを選択 (${selectingDeckSlot}/2)`;

  return (
    <div className="w-full mt-6">
      <h2 className="text-3xl font-bold text-center mb-8 text-cyan-400">
        {titleText}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {decks.map((deck) => {
          const isAlreadySelectedForSlot2 = selectingDeckSlot === 2 && deck.id === deck1IdAlreadySelected;
          const buttonBaseClasses = "group bg-slate-700 p-5 rounded-lg shadow-xl flex flex-col items-center text-center h-full border border-slate-600 focus:outline-none";
          const enabledButtonClasses = "hover:bg-slate-600/70 hover:shadow-teal-500/10 transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:ring-2 focus:ring-teal-500 focus:ring-opacity-70 hover:border-teal-600";
          const disabledButtonClasses = "opacity-50 cursor-not-allowed saturate-50 border-slate-700 shadow-inner";

          return (
            <button
              key={deck.id}
              onClick={() => !isAlreadySelectedForSlot2 && onSelectDeck(deck.id)}
              className={`${buttonBaseClasses} ${isAlreadySelectedForSlot2 ? disabledButtonClasses : enabledButtonClasses}`}
              aria-label={`デッキ ${deck.name} を選択: ${deck.description}${isAlreadySelectedForSlot2 ? ' (1つ目で選択済みのため選択不可)' : ''}`}
              disabled={isAlreadySelectedForSlot2}
            >
              <DeckIcon deckId={deck.id} />
              <h3 className={`text-xl font-semibold text-slate-100 mb-1.5 transition-colors duration-200 ${!isAlreadySelectedForSlot2 ? 'group-hover:text-teal-300' : 'text-slate-400'}`}>{deck.name}</h3>
              <p className={`text-sm text-slate-400 flex-grow transition-colors duration-200 ${!isAlreadySelectedForSlot2 ? 'group-hover:text-slate-300' : 'text-slate-500'}`}>{deck.description}</p>
              {isAlreadySelectedForSlot2 && <span className="mt-2 text-xs text-amber-500">(1つ目で選択済み)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DeckSelectorComponent;