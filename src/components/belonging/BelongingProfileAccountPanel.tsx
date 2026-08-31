import { Info, LogOut, Settings } from 'lucide-react';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Abrir opciones de cuenta" aria-expanded={open} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <HeaderUserAvatar avatar={user.avatar} name={user.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="z-[80] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border-violet-100 p-2 shadow-xl">
        <DropdownMenuLabel className="flex items-center gap-3 p-3">
          <HeaderUserAvatar avatar={user.avatar} name={user.name} />
          <span className="min-w-0"><span className="block truncate font-bold">{user.name}</span><span className="block text-xs font-normal text-muted-foreground">Perteneciente</span></span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => select('profile-settings')} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary"><Settings className="mr-3 h-5 w-5 text-primary" aria-hidden />Configuración</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => select('about')} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary"><Info className="mr-3 h-5 w-5 text-primary" aria-hidden />Acerca de TÁNDEM</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { onOpenChange(false); onLogout(); }} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive"><LogOut className="mr-3 h-5 w-5" aria-hidden />Cerrar sesión</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
