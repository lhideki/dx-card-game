
"use client";

import React from 'react';
import { Theme }  from '../types';
import { LightBulbIcon, UserGroupIcon, BoltIcon, RocketLaunchIcon, UsersIcon, ChartPieIcon, TruckIcon, InformationCircleIcon } from './icons.tsx';

interface ThemeSelectorProps {
  themes: Theme[];
  onSelectTheme: (theme: Theme) => void;
}

const GameRulesOverview: React.FC = () => (
  <div className="bg-slate-700/50 p-6 rounded-lg shadow-lg mb-10 border border-slate-600 backdrop-blur-sm">
    <h3 className="text-2xl font-semibold text-cyan-400 mb-4 flex items-center">
      <InformationCircleIcon className="w-7 h-7 mr-2.5 text-cyan-500" aria-hidden="true" />
      ゲームのルール概要
    </h3>
    <ul className="list-none space-y-2 pl-1 text-slate-300 text-sm">
      {[
        '解決したいDXの「テーマ」を1つ選択します。',
        'ゲームマスター(GM)がテーマに沿った「課題」を提示します。',
        '最初に5枚の「DX用語カード」が配られ、毎ターン1枚新しいカードが引けます。',
        '手札から1枚カードを選択して使用し、課題解決に挑戦します。',
        'GMがカードの効果を評価し、課題の状況が変化します。',
        '全5ターンで、最終的な課題解決度をGMが評価します。',
        'ゲーム中1回だけ「シャッフル」ができ、手札が全て新しくなりますが、課題状況もランダムに変化します。',
        'ゲーム中2回まで専門家から「アドバイス」を受けられます。'
      ].map((rule, index) => (
        <li key={index} className="flex items-start">
          <span className="text-cyan-500 mr-2 leading-tight">›</span> 
          {rule}
        </li>
      ))}
    </ul>
  </div>
);

const ThemeIcon: React.FC<{themeId: string}> = ({ themeId }) => {
  const iconColor = "text-cyan-500 group-hover:text-cyan-400 group-focus:text-cyan-400";
  const iconColorAlt = "text-teal-500 group-hover:text-teal-400 group-focus:text-teal-400";
  const iconSize = "w-10 h-10 mb-3 transition-colors duration-200";
  switch (themeId) {
    case 'theme001': return <UserGroupIcon className={`${iconSize} ${iconColorAlt}`} />;
    case 'theme002': return <BoltIcon className={`${iconSize} ${iconColor}`} />;
    case 'theme003': return <RocketLaunchIcon className={`${iconSize} ${iconColorAlt}`} />;
    case 'theme004': return <UsersIcon className={`${iconSize} ${iconColor}`} />;
    case 'theme005': return <ChartPieIcon className={`${iconSize} ${iconColorAlt}`} />;
    case 'theme006': return <TruckIcon className={`${iconSize} ${iconColor}`} />;
    default: return <LightBulbIcon className={`${iconSize} text-slate-500`} />;
  }
};

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ themes, onSelectTheme }) => {
  return (
    <div className="w-full">
      <GameRulesOverview />
      <h2 className="text-3xl font-bold text-center mb-8 text-cyan-400">
        挑戦するテーマを選択
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onSelectTheme(theme)}
            className="group bg-slate-700 hover:bg-slate-600/70 p-5 rounded-lg shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-opacity-70 flex flex-col items-center text-center h-full border border-slate-600 hover:border-cyan-600"
            aria-label={`テーマ ${theme.name} を選択: ${theme.description}`}
          >
            <ThemeIcon themeId={theme.id} />
            <h3 className="text-xl font-semibold text-slate-100 group-hover:text-cyan-300 mb-1.5 transition-colors duration-200">{theme.name}</h3>
            <p className="text-sm text-slate-400 group-hover:text-slate-300 flex-grow transition-colors duration-200">{theme.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeSelector;