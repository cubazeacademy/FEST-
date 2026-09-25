import React, { useState, useEffect, useCallback } from 'react';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { Sparkles, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface VersionInfo {
  buildId: string;
  version: string;
  builtAt: string;
}

export const DeploymentUpdateNotification: React.FC = () => {
  const { hasUnsavedChanges } = useUnsavedChanges();
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [latestVersionInfo, setLatestVersionInfo] = useState<VersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Current build ID embedded into this bundle
  const currentBuildId = typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : 'dev_build';

  const checkLatestVersion = useCallback(async () => {
    // In local development or without version.json, gracefully ignore
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache'
        }
      });

      if (!res.ok) return;

      const data: VersionInfo = await res.json();
      if (data && data.buildId && data.buildId !== currentBuildId) {
        setLatestVersionInfo(data);
        setNewVersionAvailable(true);
      }
    } catch (err) {
      // Quiet fail on network issues
    }
  }, [currentBuildId]);

  // Periodic check (every 50s) + check on tab focus/visibility change
  useEffect(() => {
    // Initial check after 10 seconds
    const initialTimer = setTimeout(checkLatestVersion, 10000);

    const interval = setInterval(checkLatestVersion, 50000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkLatestVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkLatestVersion);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkLatestVersion);
    };
  }, [checkLatestVersion]);

  // Handle reload
  const handleApplyUpdate = () => {
    setIsUpdating(true);
    // Hard reload bypassing cache
    window.location.reload();
  };

  if (!newVersionAvailable || isDismissed) {
    return null;
  }

  return (
    <aside aria-label="Application update notification" className="fixed bottom-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="p-4 sm:p-5 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 text-slate-900 shadow-2xl shadow-slate-900/15">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
            <Sparkles className="w-5 h-5 animate-pulse text-indigo-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                New Update Available
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  v{latestVersionInfo?.version || '2.6.0'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {hasUnsavedChanges ? (
                <span className="text-amber-800 font-semibold flex items-center gap-1.5 mt-1 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  You have unsaved changes. Please save your work before updating.
                </span>
              ) : (
                'A new production deployment is ready with performance improvements and updates.'
              )}
            </p>

            <div className="flex items-center gap-2 mt-3.5 pt-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Update Application'}
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
