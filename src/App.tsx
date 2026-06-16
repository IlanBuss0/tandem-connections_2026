import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CustomActivitiesProvider } from '@/contexts/CustomActivitiesContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import { EmotionsProvider } from '@/contexts/EmotionsContext';
import { RoutinesProvider } from '@/contexts/RoutinesContext';
import { CalendarProvider } from '@/contexts/CalendarContext';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import InviteLinkHandler from '@/pages/InviteLinkHandler';
import ProfessionalInviteLinkHandler from '@/pages/ProfessionalInviteLinkHandler';
import AppShell from '@/components/AppShell';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect, useState } from 'react';
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

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const [publicView, setPublicView] = useState<PublicView>(() => publicViewFromPath(window.location.pathname));
  const [inviteToken, setInviteToken] = useState<string | null>(() => inviteTokenFromPath(window.location.pathname));
  const [professionalInviteToken, setProfessionalInviteToken] = useState<string | null>(() => professionalInviteTokenFromPath(window.location.pathname));

  useEffect(() => {
    const syncPublicView = () => {
      setPublicView(publicViewFromPath(window.location.pathname));
      setInviteToken(inviteTokenFromPath(window.location.pathname));
      setProfessionalInviteToken(professionalInviteTokenFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', syncPublicView);
    return () => window.removeEventListener('popstate', syncPublicView);
  }, []);

  const navigatePublic = (nextView: PublicView) => {
    const path = nextView === 'login' ? '/login' : nextView === 'register' ? '/signup' : '/';

    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }

    setPublicView(nextView);
  };

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center text-sm font-medium text-muted-foreground">
          Cargando sesion...
        </div>
        <AccessibilityWidget />
      </>
    );
  }

  return (
    <>
      {professionalInviteToken && isAuthenticated ? (
        <ProfessionalInviteLinkHandler token={professionalInviteToken} />
      ) : professionalInviteToken ? (
        <Login initialView="login" />
      ) : inviteToken && isAuthenticated ? (
        <InviteLinkHandler token={inviteToken} />
      ) : inviteToken ? (
        <Login initialView="login" />
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
      )}
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
              <ChatProvider>
                <EmotionsProvider>
                  <RoutinesProvider>
                    <CalendarProvider>
                      <AuthGate />
                    </CalendarProvider>
                  </RoutinesProvider>
                </EmotionsProvider>
              </ChatProvider>
            </CustomActivitiesProvider>
          </WalletProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
