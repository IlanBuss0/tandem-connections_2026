import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { WalletProvider } from '@/contexts/WalletContext';
import { CustomActivitiesProvider } from '@/contexts/CustomActivitiesContext';
import Login from '@/pages/Login';
import AppShell from '@/components/AppShell';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

const queryClient = new QueryClient();

function AuthGate() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <AppShell /> : <Login />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <WalletProvider>
          <CustomActivitiesProvider>
            <AuthGate />
          </CustomActivitiesProvider>
        </WalletProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
