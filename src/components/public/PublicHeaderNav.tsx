import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFestData } from '../../context/FestDataContext';
import {
  Home,
  Calendar,
  Trophy,
  Search,
  Download,
  Camera,
  LogIn,
  Flame,
  Globe,
  LayoutDashboard
} from 'lucide-react';

interface PublicHeaderNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenLoginModal: () => void;
}

export const PublicHeaderNav: React.FC<PublicHeaderNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenLoginModal
}) => {
  const { isPublic, isAuthenticated, isSuperAdmin, isTeamLeader, isController, currentUser } = useAuth();
  const { settings } = useFestData();

  const isHomeActive = activeTab === 'public_live' || activeTab === 'public_home';
  const isSchedulesActive = activeTab === 'public_schedules';
  const isResultsActive =
    activeTab === 'public_results' ||
    activeTab === 'leaderboards' ||
    activeTab === 'public_arts_board' ||
    activeTab === 'public_sports_board';
  const isMyResultActive = activeTab === 'public_my_result' || activeTab === 'public_search';
  const isDownloadsActive = activeTab === 'public_downloads';
  const isGalleryActive = activeTab === 'public_gallery';

  return (
    <header className="sticky top-3 sm:top-4 z-40 w-full px-2 sm:px-4 lg:px-6 mb-6">
      <div className="max-w-[98%] 2xl:max-w-[1750px] mx-auto bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-lg shadow-slate-900/5 px-2.5 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 transition-all">
        {/* Left Side: Logo & Main Nav Pill Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar py-0.5">
          {/* Logo Badge */}
          <button
            onClick={() => setActiveTab('public_live')}
            className="flex items-center gap-2 pr-2 sm:pr-3 border-r border-slate-200/80 shrink-0 cursor-pointer group"
            title={`${settings.festName} Home`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-amber-500 p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center font-black text-rose-600 text-xs">
                <Flame className="w-4 h-4 text-rose-600" />
              </div>
            </div>
            <span className="font-extrabold text-sm text-slate-900 hidden md:inline-block tracking-tight">
              {settings.festName}
            </span>
          </button>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Home */}
            <button
              onClick={() => setActiveTab('public_live')}
              className={`inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isHomeActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            {/* Schedules */}
            <button
              onClick={() => setActiveTab('public_schedules')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSchedulesActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedules</span>
            </button>

            {/* Results */}
            <button
              onClick={() => setActiveTab('public_results')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isResultsActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Results</span>
            </button>

            {/* My Result */}
            <button
              onClick={() => setActiveTab('public_my_result')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isMyResultActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>My Result</span>
            </button>

            {/* Downloads */}
            <button
              onClick={() => setActiveTab('public_downloads')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isDownloadsActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Downloads</span>
            </button>

            {/* Gallery */}
            <button
              onClick={() => setActiveTab('public_gallery')}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isGalleryActive
                  ? 'bg-red-600 text-white shadow-md shadow-red-600/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Gallery</span>
            </button>
          </div>
        </div>

        {/* Right Side: Sign In / Dashboard Button */}
        <div className="shrink-0 flex items-center gap-2">
          {isAuthenticated ? (
            <button
              onClick={() => {
                if (isSuperAdmin) setActiveTab('admin_dashboard');
                else if (isTeamLeader) setActiveTab('tl_my_team');
                else if (isController) setActiveTab('ctrl_assigned');
                else setActiveTab('admin_dashboard');
              }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
              title="Return to management portal"
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span>Dashboard</span>
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-red-600/25 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              <span className="hidden sm:inline">Portal</span> Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
