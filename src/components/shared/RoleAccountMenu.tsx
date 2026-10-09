import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import HeaderUserAvatar from '@/components/HeaderUserAvatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export type RoleAccountMenuOption = {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; avatar?: string | null };
  /** Texto de rol mostrado debajo del nombre (ej. "Tutor", "Perteneciente"). */
  roleLabel: string;
  /** Opciones del menú, en orden, entre el encabezado y "Cerrar sesión". */
  options: RoleAccountMenuOption[];
  onLogout: () => void;
};

/**
 * Menú desplegable de cuenta del header, compartido por todos los roles.
 * La estética de referencia es el menú del tutor: mismo ancho, sombra,
 * tipografía, espaciados y separadores para todos los perfiles.
 */
export default function RoleAccountMenu({ open, onOpenChange, user, roleLabel, options, onLogout }: Props) {
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
          <span className="min-w-0">
            <span className="block truncate font-bold">{user.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{roleLabel}</span>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(option => (
          <DropdownMenuItem key={option.id} onSelect={option.onSelect} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold focus:bg-primary/10 focus:text-primary">
            <option.icon className="mr-3 h-5 w-5 text-primary" aria-hidden />
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => { onOpenChange(false); onLogout(); }} className="min-h-11 cursor-pointer rounded-xl text-sm font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive">
          <LogOut className="mr-3 h-5 w-5" aria-hidden />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
