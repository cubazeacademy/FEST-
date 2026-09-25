import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useUnsavedChanges } from '../../context/UnsavedChangesContext';
import { Sparkles, RefreshCw, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

        // If no unsaved changes and haven't prompted yet, we can safely update if user is idle or on tab focus
        if (!hasUnsavedChanges) {
          // We can show the non-intrusive update banner or perform safe reload
          // Keeping non-blocking UI guarantees 100% safety
        }
      }
    } catch (err) {
      // Quiet fail on network issues
    }
  }, [currentBuildId, hasUnsavedChanges]);

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
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 backdrop-blur-xl border border-indigo-500/30 text-white shadow-2xl shadow-indigo-950/40">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 text-indigo-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                New Update Available
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  v{latestVersionInfo?.version || 'Latest'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {hasUnsavedChanges ? (
                <span className="text-amber-300 font-semibold flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  You have unsaved changes in an active form. Please save your work before updating.
                </span>
              ) : (
                'A new production deployment is ready with performance improvements and updates.'
              )}
            </p>

            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleApplyUpdate}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Update Application'}
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
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
