import { Info, Settings } from 'lucide-react';
import AccountDropdown from '@/components/shared/AccountDropdown';

export default function BelongingAccountMenu({
  open,
  onOpenChange,
  user,
  onNavigate,
  onLogout,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; avatar?: string | null };
  onNavigate: (tab: string) => void;
  onLogout: () => void;
}) {
  return (
    <AccountDropdown
      open={open}
      onOpenChange={onOpenChange}
      user={user}
      subtitle="Perteneciente"
      headerAction={{ label: 'Mi perfil', onClick: () => onNavigate('profile') }}
      items={[
        { id: 'settings', label: 'Configuración', icon: Settings, onSelect: () => onNavigate('profile-settings') },
        { id: 'about', label: 'Acerca de TÁNDEM', icon: Info, onSelect: () => onNavigate('about') },
      ]}
      onLogout={onLogout}
    />
  );
}