import { useState } from 'react';
import { ShoppingBag, UserRound } from 'lucide-react';
import UserProfile from '@/pages/user/UserProfile';
import UserShop from '@/pages/user/UserShop';

// Pagina hub del rol Perteneciente: une "Perfil" y "Tienda y avatar" en un
// solo acceso desde el header/menu. Perfil es la seccion por defecto.
export default function BelongingProfileHub({
  initialSection = 'profile',
  onConfigureProfile,
}: {
  initialSection?: 'profile' | 'shop';
  onConfigureProfile?: () => void;
}) {
  const [section, setSection] = useState<'profile' | 'shop'>(initialSection);

  return (
    <div className="pb-24 lg:pb-6 space-y-6">
      <div className="flex gap-1 rounded-2xl bg-[#f5f0ff] p-1">
        <button
          type="button"
          onClick={() => setSection('profile')}
          aria-pressed={section === 'profile'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
            section === 'profile' ? 'bg-white text-[#6b4c9a] shadow-md' : 'text-[#8b7aa0] hover:text-[#6b4c9a]'
          }`}
        >
          <UserRound size={14} aria-hidden />
          Mi perfil
        </button>
        <button
          type="button"
          onClick={() => setSection('shop')}
          aria-pressed={section === 'shop'}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:text-sm ${
            section === 'shop' ? 'bg-white text-[#6b4c9a] shadow-md' : 'text-[#8b7aa0] hover:text-[#6b4c9a]'
          }`}
        >
          <ShoppingBag size={14} aria-hidden />
          Tienda y avatar
        </button>
      </div>

      {section === 'profile' ? (
        <UserProfile embedded onConfigure={onConfigureProfile} />
      ) : (
        <UserShop embedded />
      )}
    </div>
  );
}