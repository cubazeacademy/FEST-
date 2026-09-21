import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../utils/seedData';
import { supabase, USERS_STATE_KEY, fetchRelationalUsers, saveRelationalUsers } from '../lib/supabase';

interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

interface AuthContextType {
  currentUser: User;
  allUsers: User[];
  isAuthenticated: boolean;
  login: (username: string, password: string) => LoginResult;
  logout: () => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole, teamId?: string) => void;
  addUser: (userData: Omit<User, 'id'>) => { success: boolean; error?: string };
  updateUser: (user: User) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; error?: string };
  toggleUserStatus: (userId: string) => void;
  resetUserPassword: (userId: string, newPass: string) => { success: boolean; error?: string };
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTeamLeader: boolean;
  isController: boolean;
  isPublic: boolean;
}

export const PUBLIC_GUEST_USER: User = {
  id: 'usr_public',
  username: 'guest',
  name: 'Public Guest Viewer',
  email: 'guest@festportal.edu',
  role: 'PUBLIC',
  isActive: true
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'fest_app_users_v1';
const SESSION_USER_ID_KEY = 'fest_session_active_user_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isRemoteUpdatingRef = useRef(false);
  const isInitialLoadDoneRef = useRef(false);

  // Load users from localStorage or fallback to INITIAL_USERS
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load users from localStorage', e);
    }
    return INITIAL_USERS;
  });

  // Current session user
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const activeId = localStorage.getItem(SESSION_USER_ID_KEY);
      if (activeId === 'usr_public') return PUBLIC_GUEST_USER;
      if (activeId && ['usr_ctrl_stage', 'usr_ctrl_nonstage', 'usr_ctrl_sports'].includes(activeId)) {
        return allUsers.find(u => u.id === 'usr_ctrl_main') || INITIAL_USERS.find(u => u.id === 'usr_ctrl_main') || PUBLIC_GUEST_USER;
      }
      if (activeId) {
        const found = allUsers.find(u => u.id === activeId) || INITIAL_USERS.find(u => u.id === activeId);
        if (found) return found;
      }
    } catch (e) {
      console.error('Failed to load active session', e);
    }
    return PUBLIC_GUEST_USER; // Default to Public Guest so visitor lands on Public View first
  });

  // Supabase Initial Sync & Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    async function loadCloudUsers() {
      try {
        const cloudUsers = await fetchRelationalUsers();
        if (!isMounted) return;

        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          isRemoteUpdatingRef.current = true;
          setAllUsers(cloudUsers);
          setTimeout(() => {
            isRemoteUpdatingRef.current = false;
          }, 200);
        } else {
          // Seed initial users to relational table
          await saveRelationalUsers(allUsers);
        }
      } catch (err) {
        console.error('Failed to load users from cloud:', err);
      } finally {
        isInitialLoadDoneRef.current = true;
      }
    }

    loadCloudUsers();

    // Supabase Realtime for users
    const channel = supabase
      .channel('public:users_state')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fest_state', filter: `id=eq.${USERS_STATE_KEY}` },
        (payload) => {
          const updated = payload.new as { id?: string; data?: any };
          if (updated && Array.isArray(updated.data) && !isRemoteUpdatingRef.current) {
            isRemoteUpdatingRef.current = true;
            setAllUsers(updated.data);
            setTimeout(() => {
              isRemoteUpdatingRef.current = false;
            }, 300);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Sync users to Supabase whenever allUsers changes
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers));

    if (!isInitialLoadDoneRef.current || isRemoteUpdatingRef.current) return;

    const timer = setTimeout(() => {
      saveRelationalUsers(allUsers);
    }, 600);

    return () => clearTimeout(timer);
  }, [allUsers]);

  // Sync session ID to storage
  useEffect(() => {
    localStorage.setItem(SESSION_USER_ID_KEY, currentUser.id);
  }, [currentUser]);

  // Authenticate with username and password
  const login = (username: string, password: string): LoginResult => {
    let cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, error: 'Please enter both username and password.' };
    }

    // Map legacy controller aliases to unified controller
    if (['stage_ctrl', 'nonstage_ctrl', 'sports_ctrl'].includes(cleanUser)) {
      cleanUser = 'controller';
    }

    const matched = allUsers.find(
      u => u.username.toLowerCase() === cleanUser
    );

    if (!matched) {
      return { success: false, error: 'Invalid username or password.' };
    }

    if (matched.isActive === false) {
      return { success: false, error: 'This user account has been deactivated by the Administrator.' };
    }

    if (matched.password && matched.password !== cleanPass) {
      return { success: false, error: 'Incorrect password.' };
    }

    const updatedUser: User = {
      ...matched,
      lastLogin: new Date().toISOString()
    };

    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    return { success: true, user: updatedUser };
  };

  const logout = () => {
    setCurrentUser(PUBLIC_GUEST_USER);
  };

  const switchUser = (userId: string) => {
    if (userId === 'usr_public') {
      setCurrentUser(PUBLIC_GUEST_USER);
      return;
    }
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const switchRole = (role: UserRole, teamId?: string) => {
    if (role === 'PUBLIC') {
      setCurrentUser(PUBLIC_GUEST_USER);
      return;
    }
    if (role === 'TEAM_LEADER' && teamId) {
      const match = allUsers.find(u => u.role === 'TEAM_LEADER' && u.teamId === teamId);
      if (match) {
        setCurrentUser(match);
        return;
      }
    }
    const match = allUsers.find(u => u.role === role);
    if (match) {
      setCurrentUser(match);
    }
  };

  // User Management Methods
  const addUser = (userData: Omit<User, 'id'>) => {
    const cleanUsername = userData.username.trim().toLowerCase();
    if (allUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: `Username "${userData.username}" is already taken.` };
    }

    const newUser: User = {
      ...userData,
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      username: cleanUsername,
      isActive: userData.isActive !== undefined ? userData.isActive : true
    };

    setAllUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  const updateUser = (user: User) => {
    const cleanUsername = user.username.trim().toLowerCase();
    const conflict = allUsers.find(u => u.username.toLowerCase() === cleanUsername && u.id !== user.id);
    if (conflict) {
      return { success: false, error: `Username "${user.username}" is already in use by another account.` };
    }

    setAllUsers(prev => prev.map(u => u.id === user.id ? { ...user, username: cleanUsername } : u));
    if (currentUser.id === user.id) {
      setCurrentUser(user);
    }
    return { success: true };
  };

  const deleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      return { success: false, error: 'Cannot delete the currently logged-in account.' };
    }
    setAllUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
    );
  };

  const resetUserPassword = (userId: string, newPass: string) => {
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    setAllUsers(prev =>
      prev.map(u => (u.id === userId ? { ...u, password: newPass.trim() } : u))
    );
    return { success: true };
  };

  const isAuthenticated = currentUser.role !== 'PUBLIC';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isTeamLeader = currentUser.role === 'TEAM_LEADER';
  const isController = currentUser.role === 'CONTROLLER';
  const isPublic = currentUser.role === 'PUBLIC';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        allUsers,
        isAuthenticated,
        login,
        logout,
        switchUser,
        switchRole,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        resetUserPassword,
        isSuperAdmin,
        isAdmin,
        isTeamLeader,
        isController,
        isPublic
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
