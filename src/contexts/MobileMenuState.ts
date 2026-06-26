import { createContext, useContext, useEffect } from 'react';

export type MobileMenuContextValue = {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
};

export const MobileMenuContext = createContext<MobileMenuContextValue | null>(null);

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MobileMenuProvider');
  }
  return context;
}

export function useSyncMobileMenuOpen(open: boolean) {
  const { setMobileMenuOpen } = useMobileMenu();

  useEffect(() => {
    setMobileMenuOpen(open);
    return () => setMobileMenuOpen(false);
  }, [open, setMobileMenuOpen]);
}
