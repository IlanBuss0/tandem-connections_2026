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

const hiddenUserTabs = ["shop", "notifications", "resources", "profile", "profile-settings", "about"];
const validUserTabs = new Set([...userNav.map((item) => item.id), ...hiddenUserTabs]);

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
    if (stored === "routines") return "calendar";
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
        return <UserProfile onOpenShop={() => goToTab("shop")} />;
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
            <BelongingProfileAccountPanel
              open={profilePanelOpen}
              onOpenChange={setProfilePanelOpen}
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
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <motion.div
                className="flex h-full w-[min(88vw,22rem)] flex-col overflow-y-auto rounded-r-[32px] border-r border-violet-100 bg-[#fbf9ff] p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.26, ease: "easeOut" }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <h1 className="font-heading text-xl font-bold text-primary">
                    TÁNDEM
                  </h1>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Cerrar menú"
                  >
                    <X aria-hidden />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => goToTab("profile")}
                  className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-violet-100 bg-white/70 p-3 text-left transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      type="button"
                      key={item.id}
                      onClick={() => goToTab(item.id)}
                      aria-current={activeTab === item.id ? "page" : undefined}
                      className={`flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === item.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-primary/5 hover:text-primary"}`}
                    >
                      <item.icon size={20} className="shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="mt-auto border-t border-violet-100 pt-4">
                  <button
                    type="button"
                    onClick={logout}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut size={20} aria-hidden /> Cerrar sesión
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
