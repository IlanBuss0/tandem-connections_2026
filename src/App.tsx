import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CustomActivitiesProvider } from '@/contexts/CustomActivitiesContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { EmotionsProvider } from '@/contexts/EmotionsContext';
import { RoutinesProvider } from '@/contexts/RoutinesContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import MobileMenuProvider from '@/contexts/MobileMenuProvider';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import InviteLinkHandler from '@/pages/InviteLinkHandler';
import ProfessionalInviteLinkHandler from '@/pages/ProfessionalInviteLinkHandler';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import EmailVerificationGate from '@/pages/EmailVerificationGate';
import OnboardingQuestionnaire from '@/pages/OnboardingQuestionnaire';
import AppShell from '@/components/AppShell';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from 'react';
import { fetchOnboardingStatus } from '@/data/api';
import '@/styles/accessibility.css';

const queryClient = new QueryClient();
type PublicView = 'landing' | 'login' | 'register';

function publicViewFromPath(pathname: string): PublicView {
  if (pathname === '/login') return 'login';
  if (pathname === '/signup' || pathname === '/register') return 'register';
  return 'landing';
}

function inviteTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/vincular\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function professionalInviteTokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/vincular-profesional\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function verifyEmailTokenFromPath(pathname: string, search: string): string | null {
  if (pathname !== '/verificar-email') return null;
  return new URLSearchParams(search).get('token');
}

function AuthGate() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [publicView, setPublicView] = useState<PublicView>(() => publicViewFromPath(window.location.pathname));
  const [inviteToken, setInviteToken] = useState<string | null>(() => inviteTokenFromPath(window.location.pathname));
  const [professionalInviteToken, setProfessionalInviteToken] = useState<string | null>(() => professionalInviteTokenFromPath(window.location.pathname));
  const [verifyEmailToken, setVerifyEmailToken] = useState<string | null>(() => verifyEmailTokenFromPath(window.location.pathname, window.location.search));
  const [isVerifyEmailRoute, setIsVerifyEmailRoute] = useState(() => window.location.pathname === '/verificar-email');

  useEffect(() => {
    const syncPublicView = () => {
      setPublicView(publicViewFromPath(window.location.pathname));
      setInviteToken(inviteTokenFromPath(window.location.pathname));
      setProfessionalInviteToken(professionalInviteTokenFromPath(window.location.pathname));
      setVerifyEmailToken(verifyEmailTokenFromPath(window.location.pathname, window.location.search));
      setIsVerifyEmailRoute(window.location.pathname === '/verificar-email');
    };

    window.addEventListener('popstate', syncPublicView);
    return () => window.removeEventListener('popstate', syncPublicView);
  }, []);

  // Cuestionario de onboarding (Fase 6): se muestra una sola vez, solo a
  // pertenecientes (role 'user'), y solo despues de que el mail este
  // verificado. "checked" evita el parpadeo de mostrar AppShell y despues
  // saltar al cuestionario mientras se resuelve el fetch.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingPending, setOnboardingPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const needsCheck = isAuthenticated && user?.role === 'user' && user?.emailVerified !== false;

    if (!needsCheck) {
      setOnboardingChecked(true);
      setOnboardingPending(false);
      return;
    }

    setOnboardingChecked(false);
    fetchOnboardingStatus(user.id)
      .then(status => {
        if (cancelled) return;
        setOnboardingPending(!status.done && !status.skipped);
        setOnboardingChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setOnboardingPending(false);
        setOnboardingChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id, user?.role, user?.emailVerified]);

  const navigatePublic = (nextView: PublicView) => {
    const path = nextView === 'login' ? '/login' : nextView === 'register' ? '/signup' : '/';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }

    setPublicView(nextView);
    setIsVerifyEmailRoute(false);
  };

  const content = isVerifyEmailRoute ? (
    <VerifyEmailPage token={verifyEmailToken} onGoToLogin={() => navigatePublic('login')} />
  ) : isLoading ? (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm font-medium text-muted-foreground">
      Cargando sesión...
    </div>
  ) : professionalInviteToken && isAuthenticated ? (
    <ProfessionalInviteLinkHandler token={professionalInviteToken} />
  ) : professionalInviteToken ? (
    <Login initialView="login" />
  ) : inviteToken && isAuthenticated ? (
    <InviteLinkHandler token={inviteToken} />
  ) : inviteToken ? (
    <Login initialView="login" />
  ) : isAuthenticated && user?.emailVerified === false ? (
    <EmailVerificationGate email={user.email} />
  ) : isAuthenticated && user?.role === 'user' && !onboardingChecked ? (
    <div className="min-h-screen bg-background flex items-center justify-center text-sm font-medium text-muted-foreground">
      Cargando sesión...
    </div>
  ) : isAuthenticated && user?.role === 'user' && onboardingPending ? (
    <OnboardingQuestionnaire onFinish={() => setOnboardingPending(false)} />
  ) : isAuthenticated ? (
    <AppShell />
  ) : publicView === 'landing' ? (
    <Landing onNavigate={navigatePublic} />
  ) : (
    <Login
      initialView={publicView}
      onBackToLanding={() => navigatePublic('landing')}
      onViewChange={view => {
        if (view === 'login' || view === 'register') navigatePublic(view);
      }}
    />
  );

  return (
    <>
      <div className="accessibility-content-root">{content}</div>
      <AccessibilityWidget />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <AccessibilityProvider>
          <WalletProvider>
            <CustomActivitiesProvider>
              <EmotionsProvider>
                <RoutinesProvider>
                  <CalendarProvider>
                    <MobileMenuProvider>
                      <AuthGate />
                    </MobileMenuProvider>
                  </CalendarProvider>
                </RoutinesProvider>
              </EmotionsProvider>
            </CustomActivitiesProvider>
          </WalletProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
