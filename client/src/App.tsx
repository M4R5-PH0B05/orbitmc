import { useState, useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { OnboardingModal } from "@/components/onboarding";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import ServersPage from "@/pages/servers";
import ServerDetailPage from "@/pages/server-detail";
import ModpacksPage from "@/pages/modpacks";
import ModpackDetailPage from "@/pages/modpack-detail";
import UsersPage from "@/pages/users";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

// Track which user IDs have completed onboarding this session (in-memory only)
const onboardedUsers = new Set<number>();

function AppRoutes() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/auth/me");
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 60000,
  });

  // Trigger onboarding on first login this session
  useEffect(() => {
    if (user && !user.error && !onboardedUsers.has(user.id)) {
      setShowOnboarding(true);
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      onboardedUsers.add(user.id);
    }
    setShowOnboarding(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background starfield">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="absolute inset-0 blur-md opacity-50">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Entering orbit...</p>
        </div>
      </div>
    );
  }

  if (!user || user.error) {
    return <LoginPage />;
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingModal
          username={user.username}
          role={user.role}
          onComplete={handleOnboardingComplete}
        />
      )}

      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar />
          <div className="flex flex-col flex-1 min-w-0">
            <header className="flex items-center h-12 px-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-40">
              <SidebarTrigger data-testid="button-sidebar-toggle" className="mr-2" />
            </header>
            <main className="flex-1 overflow-auto scrollbar-thin">
              <Switch>
                <Route path="/" component={DashboardPage} />
                <Route path="/servers" component={ServersPage} />
                <Route path="/servers/:id/:tab?" component={ServerDetailPage} />
                <Route path="/modpacks" component={ModpacksPage} />
                <Route path="/modpacks/:id" component={ModpackDetailPage} />
                <Route path="/users" component={UsersPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router hook={useHashLocation}>
          <AppRoutes />
        </Router>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
