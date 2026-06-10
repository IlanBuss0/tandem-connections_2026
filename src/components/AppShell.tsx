import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { Home, Calendar, CheckSquare, MessageCircle, Heart, Trophy, User, Sun, Bell, LogOut, Menu, X, Image, BookOpen, ShoppingBag, Settings } from 'lucide-react';
import AvatarPreview from '@/components/AvatarPreview';
import CoinBadge from '@/components/CoinBadge';
import NotificationBellButton, { useUnreadNotifications } from '@/components/NotificationBellButton';
import UserHome from '@/pages/user/UserHome';
import UserRoutines from '@/pages/user/UserRoutines';
import UserCalendar from '@/pages/user/UserCalendar';
import UserActivities from '@/pages/user/UserActivities';
import UserChat from '@/pages/user/UserChat';
import UserEmotions from '@/pages/user/UserEmotions';
import UserAchievements from '@/pages/user/UserAchievements';
import UserProfile from '@/pages/user/UserProfile';
import UserProfileSettings from '@/pages/user/UserProfileSettings';
import UserPictograms from '@/pages/user/UserPictograms';
import UserNotifications from '@/pages/user/UserNotifications';
import UserResources from '@/pages/user/UserResources';
import UserShop from '@/pages/user/UserShop';
import TutorDashboard from '@/pages/tutor/TutorDashboard';
import ProfessionalDashboard from '@/pages/professional/ProfessionalDashboard';
import SuperAdminDashboard from '@/pages/admin/SuperAdminDashboard';

const userNav = [
  { id: 'home', label: 'Inicio', icon: Home },
  { id: 'routines', label: 'Mi día', icon: Sun },
  { id: 'calendar', label: 'Calendario', icon: Calendar },
  { id: 'activities', label: 'Actividades', icon: CheckSquare },
  { id: 'shop', label: 'Tienda y avatar', icon: ShoppingBag },
  { id: 'pictograms', label: 'Pictogramas', icon: Image },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'emotions', label: 'Emociones', icon: Heart },
  { id: 'achievements', label: 'Logros', icon: Trophy },
  { id: 'notifications', label: 'Notificaciones', icon: Bell },
  { id: 'resources', label: 'Recursos', icon: BookOpen },
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'profile-settings', label: 'Configuracion', icon: Settings },
];

const ACTIVE_TAB_KEY = 'tandem_active_tab';
const validUserTabs = new Set(userNav.map(item => item.id));

function loadActiveTab() {
  try {
    const stored = localStorage.getItem(ACTIVE_TAB_KEY);
    return stored && validUserTabs.has(stored) ? stored : 'home';
  } catch {
    return 'home';
  }
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { state: wallet } = useWallet();
  const [activeTab, setActiveTab] = useState(loadActiveTab);
  const [editingProfilePersonalData, setEditingProfilePersonalData] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount: unreadNotifs, setUnreadCount: setUnreadNotifs } = useUnreadNotifications(
    user && user.role === 'user' ? { id: String(user.id) } : null
  );

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch {
      // Ignore storage failures; navigation still works in memory.
    }
  }, [activeTab]);

  if (!user) return null;

  if (user.role === 'admin') return <SuperAdminDashboard />;
  if (user.role === 'tutor') return <TutorDashboard />;
  if (user.role === 'professional') return <ProfessionalDashboard />;

  const goToTab = (tab: string) => {
    setEditingProfilePersonalData(false);
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <UserHome onNavigate={goToTab} />;
      case 'routines': return <UserRoutines />;
      case 'calendar': return <UserCalendar />;
      case 'activities': return <UserActivities />;
      case 'shop': return <UserShop />;
      case 'pictograms': return <UserPictograms />;
      case 'chat': return <UserChat />;
      case 'emotions': return <UserEmotions />;
      case 'achievements': return <UserAchievements />;
      case 'notifications': return <UserNotifications onUnreadCountChange={setUnreadNotifs} />;
      case 'resources': return <UserResources />;
      case 'profile':
        return editingProfilePersonalData
          ? <UserProfileSettings mode="personal" onBack={() => setEditingProfilePersonalData(false)} />
          : <UserProfile onConfigure={() => setEditingProfilePersonalData(true)} />;
      case 'profile-settings': return <UserProfileSettings onBack={() => goToTab('profile')} />;
      default: return <UserHome onNavigate={goToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border h-14 flex items-center justify-between px-3 sm:px-4 lg:hidden">
        <button onClick={() => setSidebarOpen(true)} className="text-foreground p-2 -ml-2" aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <h1 className="font-heading font-bold text-gradient text-lg">TÁNDEM</h1>
        <div className="flex items-center gap-2">
          <CoinBadge size="sm" onClick={() => goToTab('shop')} />
          <NotificationBellButton count={unreadNotifs} onClick={() => goToTab('notifications')} className="h-9 w-9 border-0 bg-transparent" />
        </div>
      </header>

      <div className="fixed right-4 top-4 z-50 hidden lg:block">
        <NotificationBellButton count={unreadNotifs} onClick={() => goToTab('notifications')} />
      </div>

      {/* Sidebar overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="w-[85%] max-w-xs h-full bg-card border-r border-border p-4 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-heading font-bold text-gradient text-xl">TÁNDEM</h1>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5" aria-label="Cerrar menú"><X size={20} /></button>
            </div>
            <button
              onClick={() => goToTab('shop')}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4 hover:bg-muted transition-colors text-left"
            >
              <AvatarPreview equipped={wallet.equipped} appearance={wallet.appearance} size={48} showBackground={false} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">Nivel {'level' in user ? user.level : 1}</p>
              </div>
              <CoinBadge size="sm" />
            </button>
            <nav className="space-y-1">
              {userNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => goToTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${activeTab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50'}`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.id === 'notifications' && unreadNotifs > 0 && <span className="ml-auto w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unreadNotifs}</span>}
                </button>
              ))}
            </nav>
            <div className="mt-6 pt-4 border-t border-border">
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-destructive hover:bg-destructive/10">
                <LogOut size={18} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-border bg-card flex-col fixed h-full z-40">
        <div className="p-4 border-b border-border">
          <h1 className="font-heading font-bold text-gradient text-xl">TÁNDEM</h1>
          <p className="text-xs text-muted-foreground">Avanzamos juntos</p>
        </div>
        <button
          onClick={() => goToTab('shop')}
          className="flex items-center gap-3 p-3 mx-3 mt-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
        >
          <AvatarPreview equipped={wallet.equipped} appearance={wallet.appearance} size={56} showBackground={false} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground">Nivel {'level' in user ? user.level : 1}</p>
            <CoinBadge size="sm" className="mt-1" />
          </div>
        </button>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {userNav.map(item => (
            <button
              key={item.id}
              onClick={() => goToTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeTab === item.id ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'}`}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.id === 'notifications' && unreadNotifs > 0 && <span className="ml-auto w-5 h-5 rounded-full gradient-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{unreadNotifs}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10">
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-w-0">
        <div className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around py-1.5 z-40 lg:hidden" aria-label="Navegación principal">
        {[userNav[0], userNav[1], userNav[3], userNav[4], userNav[6]].map(item => (
          <button
            key={item.id}
            onClick={() => goToTab(item.id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] min-w-[56px] transition-colors ${activeTab === item.id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <item.icon size={20} />
            <span className="truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
