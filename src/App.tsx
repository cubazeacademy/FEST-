import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Admin Components
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentManagement } from './components/admin/StudentManagement';
import { CategoryClassMapping } from './components/admin/CategoryClassMapping';
import { ChestNumberGenerator } from './components/admin/ChestNumberGenerator';
import { TeamManagement } from './components/admin/TeamManagement';
import { ProgramManagement } from './components/admin/ProgramManagement';
import { ControllerAssignment } from './components/admin/ControllerAssignment';
import { RegistrationMaster } from './components/admin/RegistrationMaster';
import { ResultApproval } from './components/admin/ResultApproval';
import { PointsConfig } from './components/admin/PointsConfig';
import { UserManagement } from './components/admin/UserManagement';
import { SettingsAuditLogs } from './components/admin/SettingsAuditLogs';

// Team Leader Components
import { TeamLeaderDashboard } from './components/teamLeader/TeamLeaderDashboard';
import { HouseStudentRoster } from './components/teamLeader/HouseStudentRoster';
import { IndividualRegistration } from './components/teamLeader/IndividualRegistration';
import { GroupRegistration } from './components/teamLeader/GroupRegistration';
import { RegistrationHistory } from './components/teamLeader/RegistrationHistory';

// Controller Components
import { ControllerDashboard } from './components/controller/ControllerDashboard';
import { ResultEntryMatrix } from './components/controller/ResultEntryMatrix';

// Public Components
import { LiveResultsFeed } from './components/public/LiveResultsFeed';
import { ArtsChampionship } from './components/public/ArtsChampionship';
import { SportsChampionship } from './components/public/SportsChampionship';
import { TeamLeaderboardView } from './components/public/TeamLeaderboardView';
import { ParticipantSearch } from './components/public/ParticipantSearch';
import { PublicHeaderNav } from './components/public/PublicHeaderNav';
import { PublicScheduleView } from './components/public/PublicScheduleView';
import { PublicDownloadsView } from './components/public/PublicDownloadsView';
import { PublicGalleryView } from './components/public/PublicGalleryView';
import { PublicResultsHub } from './components/public/PublicResultsHub';

// Auth Login View
import { LoginPortal } from './views/LoginPortal';

import { Menu, PanelLeftOpen } from 'lucide-react';

export function App() {
  const { currentUser, isSuperAdmin, isTeamLeader, isController, isPublic, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isSuperAdmin) return 'admin_dashboard';
    if (isTeamLeader) return 'tl_my_team';
    if (isController) return 'ctrl_assigned';
    return 'public_live';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [selectedProgramForEntry, setSelectedProgramForEntry] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Automatically update tab when switching roles if on an unauthorized tab
  useEffect(() => {
    if (isSuperAdmin && activeTab.startsWith('tl_')) {
      setActiveTab('admin_dashboard');
    } else if (isTeamLeader && !activeTab.startsWith('tl_') && !activeTab.startsWith('public') && activeTab !== 'leaderboards') {
      setActiveTab('tl_my_team');
    } else if (isController && !activeTab.startsWith('ctrl_') && !activeTab.startsWith('public') && activeTab !== 'leaderboards') {
      setActiveTab('ctrl_assigned');
    } else if (isPublic && !activeTab.startsWith('public') && activeTab !== 'leaderboards' && activeTab !== 'login_view') {
      setActiveTab('public_live');
    }
  }, [currentUser, isSuperAdmin, isTeamLeader, isController, isPublic]);

  const handleLoginSuccess = (role: string) => {
    setIsLoginModalOpen(false);
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
      setActiveTab('admin_dashboard');
    } else if (role === 'TEAM_LEADER') {
      setActiveTab('tl_my_team');
    } else if (role === 'CONTROLLER') {
      setActiveTab('ctrl_assigned');
    } else {
      setActiveTab('public_live');
    }
  };

  const renderContent = () => {
    if (activeTab === 'login_view') {
      return (
        <LoginPortal
          onSuccess={handleLoginSuccess}
          onContinueAsGuest={() => setActiveTab('public_live')}
        />
      );
    }

    // Route-level permission guards:
    if (activeTab.startsWith('admin_') && !isSuperAdmin) {
      if (isTeamLeader) return <TeamLeaderDashboard setActiveTab={setActiveTab} />;
      if (isController) return <ControllerDashboard setActiveTab={setActiveTab} setSelectedProgramForEntry={setSelectedProgramForEntry} />;
      return <LiveResultsFeed />;
    }

    if (activeTab.startsWith('tl_') && !isTeamLeader && !isSuperAdmin) {
      if (isController) return <ControllerDashboard setActiveTab={setActiveTab} setSelectedProgramForEntry={setSelectedProgramForEntry} />;
      return <LiveResultsFeed />;
    }

    if (activeTab.startsWith('ctrl_') && !isController && !isSuperAdmin) {
      if (isTeamLeader) return <TeamLeaderDashboard setActiveTab={setActiveTab} />;
      return <LiveResultsFeed />;
    }

    switch (activeTab) {
      // Admin views (Strictly for Super Admin / Admin)
      case 'admin_dashboard':
        return <AdminDashboard setActiveTab={setActiveTab} />;
      case 'admin_students':
        return <StudentManagement />;
      case 'admin_categories_classes':
        return <CategoryClassMapping />;
      case 'admin_chest_numbers':
        return <ChestNumberGenerator />;
      case 'admin_teams':
        return <TeamManagement />;
      case 'admin_programs':
        return <ProgramManagement />;
      case 'admin_controllers':
        return <ControllerAssignment />;
      case 'admin_registrations':
        return <RegistrationMaster />;
      case 'admin_results':
        return <ResultApproval />;
      case 'admin_points_config':
        return <PointsConfig />;
      case 'admin_users':
        return <UserManagement />;
      case 'admin_settings':
        return <SettingsAuditLogs />;

      // Team Leader views
      case 'tl_my_team':
        return <TeamLeaderDashboard setActiveTab={setActiveTab} />;
      case 'tl_students':
        return <HouseStudentRoster setActiveTab={setActiveTab} />;
      case 'tl_reg_individual':
        return <IndividualRegistration />;
      case 'tl_reg_group':
        return <GroupRegistration />;
      case 'tl_history':
        return <RegistrationHistory />;

      // Controller views
      case 'ctrl_assigned':
        return (
          <ControllerDashboard
            setActiveTab={setActiveTab}
            setSelectedProgramForEntry={setSelectedProgramForEntry}
          />
        );
      case 'ctrl_programs':
        return <ProgramManagement />;
      case 'ctrl_registrations':
        return <RegistrationMaster />;
      case 'ctrl_result_entry':
        return <ResultEntryMatrix initialProgramId={selectedProgramForEntry} />;
      case 'ctrl_candidates':
        return <StudentManagement />;

      // Public and Leaderboard views
      case 'public_live':
      case 'public_home':
        return <LiveResultsFeed />;
      case 'public_schedules':
        return <PublicScheduleView />;
      case 'public_results':
      case 'leaderboards':
        return <PublicResultsHub setActiveTab={setActiveTab} />;
      case 'public_my_result':
      case 'public_search':
        return <ParticipantSearch setActiveTab={setActiveTab} />;
      case 'public_downloads':
        return <PublicDownloadsView />;
      case 'public_gallery':
        return <PublicGalleryView />;
      case 'public_arts_board':
        return <ArtsChampionship />;
      case 'public_sports_board':
        return <SportsChampionship />;

      default:
        return <LiveResultsFeed />;
    }
  };

  // If full-screen login view is selected
  if (activeTab === 'login_view') {
    return (
      <LoginPortal
        onSuccess={handleLoginSuccess}
        onContinueAsGuest={() => setActiveTab('public_live')}
      />
    );
  }

  // Check if current view is public website
  const isPublicView = isPublic || activeTab.startsWith('public') || activeTab === 'leaderboards';

  // PUBLIC GUEST & PREVIEW PORTAL LAYOUT
  if (isPublicView) {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col selection:bg-red-500/20">
        {/* Floating Top Nav matching screenshot */}
        <PublicHeaderNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        {/* Main Public Content */}
        <main className="flex-1 w-full max-w-[98%] 2xl:max-w-[1750px] mx-auto px-2 sm:px-4 lg:px-6 pb-12">
          {renderContent()}
        </main>

        {/* Login Modal Popup */}
        {isLoginModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
            onClick={e => {
              if (e.target === e.currentTarget) setIsLoginModalOpen(false);
            }}
          >
            <div className="relative w-full max-w-md animate-in zoom-in-95 duration-150">
              <LoginPortal
                isModal={true}
                onClose={() => setIsLoginModalOpen(false)}
                onSuccess={handleLoginSuccess}
                onContinueAsGuest={() => setIsLoginModalOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  // AUTHENTICATED MANAGEMENT PORTAL LAYOUT (Super Admin, Team Leader, Controller)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        isSidebarHidden={isSidebarHidden}
        setIsSidebarHidden={setIsSidebarHidden}
      />

      <div className="flex-1 flex w-full relative">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpenMobile={isMobileMenuOpen}
          setIsOpenMobile={setIsMobileMenuOpen}
          isSidebarHidden={isSidebarHidden}
          setIsSidebarHidden={setIsSidebarHidden}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-300">
          {/* Mobile Menu Toggle Bar */}
          <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-4 h-4 text-indigo-600" />
              Menu Navigation
            </button>
            <span className="text-xs font-mono text-slate-500">
              Role: <strong className="text-slate-800">{currentUser.role.replace('_', ' ')}</strong>
            </span>
          </div>

          {/* Dynamic Active View */}
          {renderContent()}
        </main>

        {/* Quick floating expand button when sidebar is collapsed on desktop */}
        {isSidebarHidden && (
          <button
            onClick={() => setIsSidebarHidden(false)}
            title="Show Sidebar (Restore navigation panel)"
            className="hidden lg:flex fixed bottom-6 left-6 z-40 items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 text-xs font-bold shadow-lg shadow-slate-900/5 transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          >
            <PanelLeftOpen className="w-4 h-4 text-rose-500" />
            <span>Show Sidebar</span>
          </button>
        )}
      </div>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setIsLoginModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md animate-in zoom-in-95 duration-150">
            <LoginPortal
              isModal={true}
              onClose={() => setIsLoginModalOpen(false)}
              onSuccess={handleLoginSuccess}
              onContinueAsGuest={() => setIsLoginModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
export default App;

