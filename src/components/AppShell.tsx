import { Suspense, lazy, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import {
  Home,
  Calendar,
  CheckSquare,
  MessageCircle,
  Heart,
  Trophy,
  User,
  Sun,
  Bell,
  LogOut,
  X,
  Image,
  BookOpen,
  ShoppingBag,
  Settings,
  Stethoscope,
} from "lucide-react";
import AvatarPreview from "@/components/AvatarPreview";
import AppHeader from "@/components/AppHeader";
import CoinBadge from "@/components/CoinBadge";
import HeaderUserAvatar from "@/components/HeaderUserAvatar";
import NotificationBellButton, {
  useUnreadNotifications,
} from "@/components/NotificationBellButton";
import UserHome from "@/pages/user/UserHome";
import { useSyncMobileMenuOpen } from "@/contexts/MobileMenuState";

const UserRoutines = lazy(() => import("@/pages/user/UserRoutines"));
const UserCalendar = lazy(() => import("@/pages/user/UserCalendar"));
const UserActivities = lazy(() => import("@/pages/user/UserActivities"));
const UserChat = lazy(() => import("@/pages/user/UserChat"));
const UserEmotions = lazy(() => import("@/pages/user/UserEmotions"));
const UserAchievements = lazy(() => import("@/pages/user/UserAchievements"));
const UserProfile = lazy(() => import("@/pages/user/UserProfile"));
const UserProfileSettings = lazy(
  () => import("@/pages/user/UserProfileSettings"),
);
const UserPictograms = lazy(() => import("@/pages/user/UserPictograms"));
const UserNotifications = lazy(() => import("@/pages/user/UserNotifications"));
const UserResources = lazy(() => import("@/pages/user/UserResources"));
const UserShop = lazy(() => import("@/pages/user/UserShop"));
const ProfessionalDirectory = lazy(
  () => import("@/components/ProfessionalDirectory"),
);
const TutorLanding = lazy(() => import("@/pages/tutor/TutorLanding"));
const TutorDashboard = lazy(() => import("@/pages/tutor/TutorDashboard"));
const ProfessionalDashboard = lazy(
  () => import("@/pages/professional/ProfessionalDashboard"),
);
const SuperAdminDashboard = lazy(
  () => import("@/pages/admin/SuperAdminDashboard"),
);

const userNav = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "routines", label: "Mi día", icon: Sun },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "activities", label: "Actividades", icon: CheckSquare },
  { id: "shop", label: "Tienda y avatar", icon: ShoppingBag },
  { id: "pictograms", label: "Pictogramas", icon: Image },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "emotions", label: "Emociones", icon: Heart },
  { id: "achievements", label: "Logros", icon: Trophy },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "resources", label: "Recursos", icon: BookOpen },
  { id: "professional-directory", label: "Profesionales", icon: Stethoscope },
  { id: "profile", label: "Perfil", icon: User },
  { id: "profile-settings", label: "Configuración", icon: Settings },
];

const ACTIVE_TAB_KEY = "tandem_active_tab";
const validUserTabs = new Set(userNav.map((item) => item.id));

function ScreenFallback() {
  return (
    <div className="rounded-3xl border border-[#f0e8f8] bg-white p-6 text-sm font-medium text-[#8b7aa0] shadow-sm">
      Cargando...
    </div>
  );
}

function loadActiveTab() {
  try {
    const stored = localStorage.getItem(ACTIVE_TAB_KEY);
    return stored && validUserTabs.has(stored) ? stored : "home";
  } catch {
    return "home";
  }
}

type TutorView =
  | { view: "landing" }
  | { view: "dashboard"; selectedUserId?: number; initialTab?: string };

export default function AppShell() {
  const { user, logout } = useAuth();
  const { state: wallet } = useWallet();
  const [activeTab, setActiveTab] = useState(loadActiveTab);
  const [editingProfilePersonalData, setEditingProfilePersonalData] =
    useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount: unreadNotifs, setUnreadCount: setUnreadNotifs } =
    useUnreadNotifications(
      user && user.role === "user" ? { id: String(user.id) } : null,
    );
  const [tutorView, setTutorView] = useState<TutorView>({ view: "landing" });
  const [navParams, setNavParams] = useState<Record<string, any> | null>(null);
  const [navKey, setNavKey] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch {
      // Ignore storage failures; navigation still works in memory.
    }
  }, [activeTab]);

  useSyncMobileMenuOpen(sidebarOpen);

  if (!user) return null;

  if (user.role === "admin")
    return (
      <Suspense fallback={<ScreenFallback />}>
        <SuperAdminDashboard />
      </Suspense>
    );
  if (user.role === "tutor") {
    if (tutorView.view === "landing") {
      return (
        <Suspense fallback={<ScreenFallback />}>
          <TutorLanding
            onSelectPerteneciente={(userId) =>
              setTutorView({
                view: "dashboard",
                selectedUserId: userId,
                initialTab: "overview",
              })
            }
            onNavigateTo={(tab) =>
              setTutorView({ view: "dashboard", initialTab: tab })
            }
          />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<ScreenFallback />}>
        <TutorDashboard
          initialUserId={tutorView.selectedUserId}
          initialTab={tutorView.initialTab}
          onBack={() => setTutorView({ view: "landing" })}
        />
      </Suspense>
    );
  }
  if (user.role === "professional")
    return (
      <Suspense fallback={<ScreenFallback />}>
        <ProfessionalDashboard />
      </Suspense>
    );

  const goToTab = (tab: string, params?: Record<string, any>) => {
    setEditingProfilePersonalData(false);
    setActiveTab(tab);
    setSidebarOpen(false);
    setNavParams(params || null);
    if (params) setNavKey((k) => k + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <UserHome onNavigate={goToTab} />;
      case "routines":
        return (
          <UserRoutines
            key={`routines-${navKey}`}
            initialRoutineId={navParams?.routineId}
            initialItemId={navParams?.itemId}
          />
        );
      case "calendar":
        return <UserCalendar />;
      case "activities":
        return (
          <UserActivities
            key={`activities-${navKey}`}
            initialAssignedActivityId={navParams?.activityId}
          />
        );
      case "shop":
        return <UserShop />;
      case "pictograms":
        return <UserPictograms />;
      case "chat":
        return (
          <UserChat
            key={`chat-${navKey}`}
            initialSelectedId={navParams?.chatId}
          />
        );
      case "emotions":
        return <UserEmotions />;
      case "achievements":
        return <UserAchievements />;
      case "notifications":
        return (
          <UserNotifications
            onUnreadCountChange={setUnreadNotifs}
            onNavigate={goToTab}
          />
        );
      case "resources":
        return <UserResources />;
      case "professional-directory":
        return <ProfessionalDirectory />;
      case "profile":
        return editingProfilePersonalData ? (
          <UserProfileSettings
            mode="personal"
            onBack={() => setEditingProfilePersonalData(false)}
          />
        ) : (
          <UserProfile
            onConfigure={() => setEditingProfilePersonalData(true)}
          />
        );
      case "profile-settings":
        return <UserProfileSettings onBack={() => goToTab("profile")} />;
      default:
        return <UserHome onNavigate={goToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7FF] via-[#FAF7FF] to-white overflow-x-hidden">
      <AppHeader
        position="fixed"
        onMenuClick={() => setSidebarOpen(true)}
        rightSlot={
          <>
            <HeaderUserAvatar avatar={user.avatar} name={user.name} />
            <NotificationBellButton
              count={unreadNotifs}
              onClick={() => goToTab("notifications")}
              className="h-9 w-9 border-0 bg-transparent"
            />
          </>
        }
      />
      <div className="flex min-h-screen pt-16">
        {/* Mobile sidebar drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                className="w-[85%] max-w-sm h-full bg-white rounded-r-3xl shadow-2xl shadow-black/10 p-6 flex flex-col overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.26, ease: "easeOut" }}
              >
                <div className="flex items-center justify-between mb-8">
                  <h1 className="font-heading font-bold text-gradient text-xl">
                    TÁNDEM
                  </h1>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-xl hover:bg-muted transition-colors"
                    aria-label="Cerrar menú"
                  >
                    <X size={20} />
                  </button>
                </div>
                <button
                  onClick={() => goToTab("shop")}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-muted/50 mb-6 hover:bg-muted transition-colors text-left"
                >
                  <AvatarPreview
                    equipped={wallet.equipped}
                    appearance={wallet.appearance}
                    size={48}
                    showBackground={false}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Nivel {"level" in user ? user.level : 1}
                    </p>
                  </div>
                  <CoinBadge size="sm" />
                </button>
                <nav className="flex-1 space-y-1">
                  {userNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goToTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${activeTab === item.id ? "text-[#7C3AED] font-semibold" : "text-muted-foreground"} hover:bg-[#C9A7EB]/60 hover:text-[#7C3AED]`}
                    >
                      <item.icon size={18} className="shrink-0" />
                      <span className="truncate">{item.label}</span>
                      {item.id === "notifications" && unreadNotifs > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-bold flex items-center justify-center">
                          {unreadNotifs}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
                <div className="mt-auto pt-4 border-t border-border">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#7C3AED] hover:bg-[#C9A7EB]/40 transition-colors"
                  >
                    <LogOut size={18} /> Cerrar sesión
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
            <Suspense fallback={<ScreenFallback />}>{renderContent()}</Suspense>
          </div>
        </main>

        {/* Mobile bottom nav */}
        <nav
          className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border flex justify-around py-1.5 z-40 lg:hidden"
          aria-label="Navegación principal"
        >
          {[userNav[0], userNav[1], userNav[3], userNav[4], userNav[6]].map(
            (item) => (
              <button
                key={item.id}
                onClick={() => goToTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] min-w-[56px] transition-colors ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon size={20} />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            ),
          )}
        </nav>
      </div>
    </div>
  );
}
