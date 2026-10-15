import React from 'react';
import { Radio, Server, Map, Compass, Route, Bookmark, Sparkles } from 'lucide-react';

export type ActiveTab = 'radar' | 'nearby' | 'routes' | 'bookmarks';

interface HeaderProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenBackendConfig: () => void;
  isBackendMode: boolean;
  activeBusCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onChangeTab,
  onOpenBackendConfig,
  isBackendMode,
  activeBusCount,
}) => {
  return (
    <header className="h-14 sm:h-16 px-4 sm:px-6 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between gap-4 sm:gap-8 z-30 shrink-0 select-none">
      {/* Zone 1: Brand Wordmark (Single text element) */}
      <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
          SG Bus Radar
        </span>
      </div>

      {/* Zone 2: Nav Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onChangeTab('radar')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'radar' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <Map className="w-4 h-4" />
          <span>Live Radar</span>
        </button>

        <button
          onClick={() => onChangeTab('nearby')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'nearby' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Nearby Stops</span>
        </button>

        <button
          onClick={() => onChangeTab('routes')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'routes' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Bus Routes</span>
        </button>

        <button
          onClick={() => onChangeTab('bookmarks')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            activeTab === 'bookmarks' ? 'text-emerald-400 font-semibold' : ''
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks</span>
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action (Backend & Data Source Config) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenBackendConfig}
          className="px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg hover:border-emerald-500/50 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
        >
          <Server className={`w-3.5 h-3.5 ${isBackendMode ? 'text-emerald-400' : 'text-slate-400'}`} />
          <span>{isBackendMode ? 'Backend Connected' : 'LTA Data Settings'}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendMode ? 'bg-emerald-400' : 'bg-slate-500'
            }`}
          />
        </button>
      </div>
    </header>
  );
};
