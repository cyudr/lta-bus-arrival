import React from 'react';
import { ActiveTab } from './Header';
import { Map, Bookmark } from 'lucide-react';

interface MobileTabBarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onChangeTab }) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/80 px-4 h-14 flex items-center justify-around select-none">
      <button
        onClick={() => onChangeTab('radar')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
          activeTab === 'radar' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Map className="w-4 h-4" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Live Radar</span>
      </button>

      <button
        onClick={() => onChangeTab('bookmarks')}
        className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
          activeTab === 'bookmarks' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Bookmark className="w-4 h-4" />
        <span className="text-[10px] font-medium tracking-tight mt-0.5">Saved Stops</span>
      </button>
    </div>
  );
};
