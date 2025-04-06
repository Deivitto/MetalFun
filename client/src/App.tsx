import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import Home from "@/pages/Home";
import CoinDetail from "@/pages/CoinDetail";
// Removed standalone CreateToken page
import SearchResults from "@/pages/SearchResults";
import Advanced from "@/pages/Advanced";
import SendTokens from "@/pages/SendTokens";
import Mixer from "@/pages/Mixer";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import { Transaction } from "@shared/schema";
import HowItWorksModal from "@/components/modals/HowItWorksModal";
import CreateTokenModal from "@/components/modals/CreateTokenModal";
import Notification from "@/components/home/Notification";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

function App() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isCreateTokenOpen, setIsCreateTokenOpen] = useState(false);
  const [notification, setNotification] = useState<Transaction | null>(null);

  // Show notification for 5 seconds then hide it
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-[#242235] text-[#e6e6e6] font-sans">
          {/* Notification */}
          {notification && <Notification transaction={notification} />}

          <div className="flex min-h-screen">
            {/* Sidebar (hidden on mobile) */}
            <Sidebar />

            {/* Main Content */}
            <main className="flex-1 lg:ml-56 pb-16 lg:pb-0">
              <Header onCreateTokenClick={() => setIsHowItWorksOpen(true)} />

              <div className="container mx-auto px-4 py-4">
                <Switch>
                  <ProtectedRoute path="/" component={Home} />
                  <ProtectedRoute path="/coin/:id" component={CoinDetail} />
                  {/* Redirecting /create to homepage */}
                  <Route path="/create">
                    {() => {
                      window.location.href = "/";
                      return null;
                    }}
                  </Route>
                  <ProtectedRoute path="/search" component={SearchResults} />
                  <ProtectedRoute path="/advanced" component={Advanced} />
                  <ProtectedRoute path="/send-tokens" component={SendTokens} requireAuth={true} />
                  <ProtectedRoute path="/mixer" component={Mixer} requireAuth={true} />
                  <ProtectedRoute path="/send" component={SendTokens} requireAuth={true} />
                  <ProtectedRoute path="/profile" component={ProfilePage} requireAuth={true} />
                  <ProtectedRoute path="/profile/:id" component={ProfilePage} />
                  <Route path="/auth" component={AuthPage} />
                  <Route component={NotFound} />
                </Switch>
              </div>
            </main>

            {/* Mobile Navigation */}
            <MobileNav />
          </div>

          {/* Modals */}
          <HowItWorksModal
            isOpen={isHowItWorksOpen}
            onClose={() => setIsHowItWorksOpen(false)}
            onReady={() => {
              setIsHowItWorksOpen(false);
              setIsCreateTokenOpen(true);
            }}
          />
          
          <CreateTokenModal
            isOpen={isCreateTokenOpen}
            onClose={() => setIsCreateTokenOpen(false)}
          />

          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
