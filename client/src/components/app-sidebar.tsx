import { Link } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, SidebarSeparator,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Server, Package, Users, LogOut } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";

const navItems = [
  { title: "Mission Control", href: "/", icon: LayoutDashboard },
  { title: "Servers",         href: "/servers",   icon: Server },
  { title: "Modpacks",        href: "/modpacks",  icon: Package },
  { title: "Crew",            href: "/users",     icon: Users },
];

// Inline OrbitMC logo SVG
function OrbitMCMark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" width={size} height={size} aria-label="OrbitMC">
      <circle cx="16" cy="16" r="7" fill="hsl(258 80% 65% / 0.15)" stroke="hsl(258 80% 65%)" strokeWidth="1.2"/>
      <ellipse cx="16" cy="16" rx="14" ry="5" stroke="hsl(258 80% 65% / 0.45)" strokeWidth="1.2"
               fill="none" strokeDasharray="3 2" transform="rotate(-20 16 16)"/>
      <circle cx="28" cy="12" r="2.5" fill="hsl(220 15% 70%)"/>
      <rect x="13.5" y="14.5" width="2" height="2" fill="hsl(258 80% 65%)"/>
      <rect x="15.5" y="12.5" width="2" height="2" fill="hsl(258 80% 65%)"/>
      <rect x="17.5" y="14.5" width="2" height="2" fill="hsl(258 80% 65%)"/>
      <rect x="15.5" y="16.5" width="2" height="2" fill="hsl(258 80% 65%)"/>
    </svg>
  );
}

export function AppSidebar() {
  const [location] = useHashLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/auth/me"); return r.json(); },
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/stats"); return r.json(); },
    refetchInterval: 10000,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", "/api/auth/logout"); },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      // onboardedUsers Set lives in App.tsx module scope;
      // clearing the query cache is sufficient — next login triggers onboarding again
    },
  });

  const isActive = (href: string) => {
    if (href === "/") return location === "/" || location === "";
    return location.startsWith(href);
  };

  const roleColour: Record<string, string> = {
    admin: "text-primary",
    operator: "text-yellow-400",
    viewer: "text-muted-foreground",
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      {/* Logo */}
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center flex-shrink-0"
               style={{ boxShadow: "0 0 12px hsl(258 80% 65% / 0.2)" }}>
            <OrbitMCMark size={22} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-sidebar-foreground leading-none">OrbitMC</p>
            <p className="text-xs text-muted-foreground leading-none mt-0.5">Server Control</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Status pill */}
      {stats && (
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between px-3 py-2 rounded-md bg-sidebar-accent border border-sidebar-border text-xs">
            <span className="text-muted-foreground">Servers online</span>
            <Badge variant="outline" className={`h-5 text-xs ${
              stats.runningServers > 0
                ? "text-green-400 border-green-500/30 bg-green-500/10"
                : "text-muted-foreground border-border"
            }`}>
              {stats.runningServers}/{stats.totalServers}
            </Badge>
          </div>
        </div>
      )}

      {/* Nav */}
      <SidebarContent className="mt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground/50 uppercase tracking-wider px-4">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    className="mx-2 data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:border data-[active=true]:border-primary/20"
                  >
                    <Link href={item.href} className="flex items-center gap-2.5">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.href === "/servers" && stats?.runningServers > 0 && (
                        <Badge className="ml-auto h-4 text-xs bg-green-500/15 text-green-400 border-green-500/25" variant="outline">
                          {stats.runningServers}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* User footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                {user.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate leading-none">{user.username}</p>
              <p className={`text-xs capitalize leading-none mt-0.5 ${roleColour[user.role] || "text-muted-foreground"}`}>
                {user.role}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
