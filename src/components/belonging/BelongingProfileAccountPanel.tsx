import { Info, Settings, UserRound } from 'lucide-react';
import RoleAccountMenu from '@/components/shared/RoleAccountMenu';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; avatar?: string | null };
  onNavigate: (tab: string) => void;
  onLogout: () => void;
};

export default function BelongingProfileAccountPanel({ open, onOpenChange, user, onNavigate, onLogout }: Props) {
  const select = (tab: string) => { onOpenChange(false); onNavigate(tab); };

  return (
    <RoleAccountMenu
      open={open}
      onOpenChange={onOpenChange}
      user={user}
      roleLabel="Perteneciente"
      onLogout={onLogout}
      options={[
        { id: 'profile', label: 'Mi perfil', icon: UserRound, onSelect: () => select('profile') },
        { id: 'settings', label: 'Configuración', icon: Settings, onSelect: () => select('profile-settings') },
        { id: 'about', label: 'Acerca de TÁNDEM', icon: Info, onSelect: () => select('about') },
      ]}
    />
  );
}
