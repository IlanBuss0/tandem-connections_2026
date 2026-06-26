import { useMemo, useState, type ReactNode } from 'react';
import { MobileMenuContext } from '@/contexts/MobileMenuState';

export default function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const value = useMemo(() => ({ isMobileMenuOpen, setMobileMenuOpen }), [isMobileMenuOpen]);

  return (
    <MobileMenuContext.Provider value={value}>
      {children}
    </MobileMenuContext.Provider>
  );
}
