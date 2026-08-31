import { LogOut, type LucideIcon } from 'lucide-react';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type AccountDropdownItem = { id: string; label: string; icon: LucideIcon; onSelect: () => void };

type AccountDropdownProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; avatar?: string | null };
  subtitle: string;
  headerAction?: { label: string; onClick: () => void };
  items: AccountDropdownItem[];
  onLogout: () => void;
};

export default function AccountDropdown({ open, onOpenChange, user, subtitle, headerAction, items, onLogout }: AccountDropdownProps) {
  const close = (onSelect: () => void) => {
    onOpenChange(false);
    onSelect();
  };

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="Abrir opciones de cuenta" aria-expanded={open} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <HeaderUserAvatar avatar={user.avatar} name={user.name} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="z-[80] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border-violet-100 p-2 shadow-xl">
        {headerAction ? (
          <DropdownMenuItem onSelect={() => close(headerAction.onClick)} className="cursor-pointer p-0 focus:bg-transparent">
            <button type="button" className="flex w-full items-center gap-3 p-3 text-left">
              <HeaderUserAvatar avatar={user.avatar} name={user.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{user.name}</span>
                <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>
              </span>
              <span className="shrink-0 text-xs font-semibold text-primary">{headerAction.label}</span>
            </button>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuLabel className="flex items-center gap-3 p-3">
            <HeaderUserAvatar avatar={user.avatar} name={user.name} />
            <span className="min-w-0">
              <span className="block truncate font-bold">{user.name}</span>
              <span className="block text-xs font-normal text-muted-foreground">{subtitle}</span>
            </span>
          </DropdownMenuLabel>
        )}
        <DropdownMenuSeparator />
        {items.map(item => (
          <DropdownMenuItem key={item.id} onSelect={() => close(item.onSelect)} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary">
            <item.icon className="mr-3 h-5 w-5 text-primary" aria-hidden />
            {item.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => close(onLogout)} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-3 h-5 w-5" aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}