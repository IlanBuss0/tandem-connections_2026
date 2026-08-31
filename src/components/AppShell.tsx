import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import {
  Home,
  Calendar,
  CheckSquare,
  MessageCircle,
  Mic,
  Heart,
  Trophy,
  LogOut,
  X,
  Image,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import AvatarPreview from "@/components/AvatarPreview";
import AppHeader from "@/components/AppHeader";
import CoinBadge from "@/components/CoinBadge";
import NotificationBellButton, {
  useUnreadNotifications,
} from "@/components/NotificationBellButton";
import UserHome from "@/pages/user/UserHome";
import UserEmotions from "@/pages/user/UserEmotions";
import { useSyncMobileMenuOpen } from "@/contexts/MobileMenuState";
import { ACTIVE_TAB_KEY, activeTabFromPath, pathForActiveTab } from "@/lib/activeTab";

const UserCalendar = lazy(() => import("@/pages/user/UserCalendar"));
const UserActivities = lazy(() => import("@/pages/user/UserActivities"));
const UserChat = lazy(() => import("@/pages/user/UserChat"));
const UserAchievements = lazy(() => import("@/pages/user/UserAchievements"));
const UserProfileSettings = lazy(
  () => import("@/pages/user/UserProfileSettings"),
);
const UserPictograms = lazy(() => import("@/pages/user/UserPictograms"));
const UserCommunicator = lazy(() => import("@/pages/user/UserCommunicator"));
import CantSpeakMode from "@/components/CantSpeakMode";
import type { CantSpeakModeHandle } from "@/components/CantSpeakMode";
import BelongingMobileBottomNav from "@/components/belonging/BelongingMobileBottomNav";
import BelongingQuickActionsMenu from "@/components/belonging/BelongingQuickActionsMenu";
import BelongingAccountMenu from "@/components/belonging/BelongingAccountMenu";
const UserExplainThis = lazy(() => import("@/pages/user/UserExplainThis"));
const UserNotifications = lazy(() => import("@/pages/user/UserNotifications"));
const AboutTandem = lazy(() => import("@/pages/AboutTandem"));
const BelongingProfileHub = lazy(
  () => import("@/components/belonging/BelongingProfileHub"),
);
const ProfessionalDirectory = lazy(
  () => import("@/components/ProfessionalDirectory"),
);
const TutorExperience = lazy(() => import("@/pages/tutor/TutorExperience"));
const ProfessionalDashboard = lazy(
  () => import("@/pages/professional/ProfessionalDashboard"),
);
const SuperAdminDashboard = lazy(
  () => import("@/pages/admin/SuperAdminDashboard"),
);

const userNav = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "calendar", label: "Calendario", icon: Calendar },
  { id: "activities", label: "Actividades", icon: CheckSquare },
  { id: "pictograms", label: "Pictogramas", icon: Image },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "emotions", label: "Registro personal", icon: Heart },
  { id: "achievements", label: "Logros", icon: Trophy },
  { id: "professional-directory", label: "Profesionales", icon: Stethoscope },
  { id: "communicator", label: "Comunicador", icon: Mic },
  { id: "explainThis", label: "Explicame esto", icon: Sparkles },
];

// Tabs a las que se puede volver al restaurar la sesion: el menu visible
// mas las pantallas internas (perfil/tienda, configuracion, acerca de,
// notificaciones) que se abren desde el header o el dropdown de cuenta.
const hiddenUserTabs = [
  "profile",
  "profile-settings",
  "about",
  "notifications",
];
const validUserTabs = new Set([
  ...userNav.map((item) => item.id),
  ...hiddenUserTabs,
]);

function ScreenFallback() {
  return (
    <div className="rounded-3xl border border-[#f0e8f8] bg-white p-6 text-sm font-medium text-[#8b7aa0] shadow-sm">
      Cargando...
    </div>
  );
}

function loadActiveTab() {
  const pathTab = activeTabFromPath(window.location.pathname);
  if (pathTab) return pathTab;

  try {
    const stored = localStorage.getItem(ACTIVE_TAB_KEY);
    return stored && validUserTabs.has(stored) ? stored : "home";
  } catch {
    return "home";
  }
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const { state: wallet } = useWallet();
  const [activeTab, setActiveTab] = useState(loadActiveTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount: unreadNotifs, setUnreadCount: setUnreadNotifs } =
    useUnreadNotifications(
      user && user.role === "user" ? { id: String(user.id) } : null,
    );
  const [navParams, setNavParams] = useState<Record<string, any> | null>(null);
  const [navKey, setNavKey] = useState(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const cantSpeakRef = useRef<CantSpeakModeHandle>(null);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTab);
    } catch {
      // Ignore storage failures; navigation still works in memory.
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      const pathTab = activeTabFromPath(window.location.pathname);
      setActiveTab(pathTab || "home");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useSyncMobileMenuOpen(sidebarOpen);

  if (!user) return null;

  if (user.role === "admin")
    return (
      <Suspense fallback={<ScreenFallback />}>
        <SuperAdminDashboard />
      </Suspense>
    );
  if (user.role === "tutor") {
    return (
      <Suspense fallback={<ScreenFallback />}>
        <TutorExperience />
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
    setActiveTab(tab);
    setSidebarOpen(false);
    setAccountMenuOpen(false);
    setNavParams(params || null);
    if (params) setNavKey((k) => k + 1);

    const nextPath = pathForActiveTab(tab);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <UserHome onNavigate={goToTab} />;
      case "calendar":
        return (
          <UserCalendar
            key={`calendar-${navKey}`}
            initialRoutineId={navParams?.routineId}
            initialItemId={navParams?.itemId}
          />
        );
      case "activities":
        return (
          <UserActivities
            key={`activities-${navKey}`}
            initialAssignedActivityId={navParams?.activityId}
          />
        );
      case "pictograms":
        return <UserPictograms />;
      case "communicator":
        return <UserCommunicator />;
      case "explainThis":
        return <UserExplainThis />;
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
      case "professional-directory":
        return <ProfessionalDirectory />;
      case "profile":
        return (
          <BelongingProfileHub
            initialSection="profile"
            onConfigureProfile={() => goToTab("profile-settings")}
          />
        );
      case "profile-settings":
        return <UserProfileSettings onBack={() => goToTab("profile")} />;
      case "about":
        return <AboutTandem />;
      default:
        return <UserHome onNavigate={goToTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF7FF] via-[#FAF7FF] to-white overflow-x-hidden">
      <AppHeader
        position="fixed"
        onMenuClick={() => setSidebarOpen(true)}
        menuButtonClassName="invisible pointer-events-none lg:visible lg:pointer-events-auto"
        onLogoClick={() => goToTab("home")}
        rightSlot={
          <div className="flex items-center gap-2">
            <BelongingAccountMenu
              open={accountMenuOpen}
              onOpenChange={setAccountMenuOpen}
              user={{ name: user.name, avatar: user.avatar }}
              onNavigate={goToTab}
              onLogout={logout}
            />
            <NotificationBellButton count={unreadNotifs} onClick={() => goToTab("notifications")} className="h-9 w-9 border-0 bg-transparent" />
          </div>
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
                  onClick={() => goToTab("profile")}
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
          <div className="max-w-7xl mx-auto p-3 pb-24 sm:p-4 sm:pb-24 lg:p-6">
            <Suspense fallback={<ScreenFallback />}>{renderContent()}</Suspense>
          </div>
        </main>

        <BelongingMobileBottomNav
          activeTab={activeTab}
          onNavigate={goToTab}
          forceExpanded={quickActionsOpen}
          center={(compactProgress) => <BelongingQuickActionsMenu activeTab={activeTab} onNavigate={goToTab} onOpenCantSpeak={() => cantSpeakRef.current?.open()} compactProgress={compactProgress} onOpenChange={setQuickActionsOpen} />}
        />
      </div>
      <CantSpeakMode ref={cantSpeakRef} hideMobileTrigger />
    </div>
  );
}
