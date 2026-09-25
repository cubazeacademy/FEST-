import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setFormDirty: (formId: string, isDirty: boolean) => void;
  clearAllDirtyForms: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  hasUnsavedChanges: false,
  setFormDirty: () => {},
  clearAllDirtyForms: () => {}
});

export const UnsavedChangesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dirtyForms, setDirtyForms] = useState<Record<string, boolean>>({});

  const setFormDirty = useCallback((formId: string, isDirty: boolean) => {
    setDirtyForms(prev => {
      if (isDirty) {
        return { ...prev, [formId]: true };
      }
      const next = { ...prev };
      delete next[formId];
      return next;
    });
  }, []);

  const clearAllDirtyForms = useCallback(() => {
    setDirtyForms({});
  }, []);

  const hasUnsavedChanges = Object.values(dirtyForms).some(Boolean);

  // Warn user before closing or reloading if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return (
    <UnsavedChangesContext.Provider value={{ hasUnsavedChanges, setFormDirty, clearAllDirtyForms }}>
      {children}
    </UnsavedChangesContext.Provider>
  );
};

export const useUnsavedChanges = () => useContext(UnsavedChangesContext);

/**
 * Convenient React hook to auto-register and unregister dirty state for a component
 */
export const useRegisterUnsavedChanges = (formId: string, isDirty: boolean) => {
  const { setFormDirty } = useUnsavedChanges();

  useEffect(() => {
    setFormDirty(formId, isDirty);
    return () => {
      setFormDirty(formId, false);
    };
  }, [formId, isDirty, setFormDirty]);
};
