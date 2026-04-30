import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CustomActivitiesProvider } from '@/contexts/CustomActivitiesContext';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
import AccessibilityWidget from '@/components/AccessibilityWidget';
import Login from '@/pages/Login';
import AppShell from '@/components/AppShell';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/styles/accessibility.css';

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      {isAuthenticated ? <AppShell /> : <Login />}
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
              <AuthGate />
            </CustomActivitiesProvider>
          </WalletProvider>
        </AccessibilityProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
