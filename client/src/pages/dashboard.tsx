import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Package, Users, Activity, Play, Square, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Server as ServerType } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { PerplexityAttribution } from "@/components/PerplexityAttribution";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; cls: string }> = {
    running: { label: "Running", cls: "bg-green-500/15 text-green-400 border-green-500/30" },
    stopped: { label: "Stopped", cls: "bg-secondary text-muted-foreground border-border" },
    starting: { label: "Starting", cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
    stopping: { label: "Stopping", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
    error: { label: "Error", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  };
  const v = variants[status] || variants.stopped;
  return <Badge variant="outline" className={`text-xs h-5 ${v.cls}`}>{v.label}</Badge>;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/stats"); return r.json(); },
    refetchInterval: 10000,
  });
  const { data: servers, isLoading: serversLoading } = useQuery<ServerType[]>({
    queryKey: ["/api/servers"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/servers"); return r.json(); },
    refetchInterval: 10000,
  });

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/auth/me"); return r.json(); },
    staleTime: 60000,
  });

  const statCards = [
    { label: "Total Servers", value: stats?.totalServers ?? "-", icon: Server, sub: `${stats?.runningServers ?? 0} running`, color: "text-primary" },
    { label: "Modpacks", value: stats?.totalModpacks ?? "-", icon: Package, sub: "available", color: "text-blue-400" },
    { label: "Panel Users", value: stats?.totalUsers ?? "-", icon: Users, sub: "accounts", color: "text-purple-400" },
    { label: "Online Players", value: stats?.totalPlayers ?? 0, icon: Activity, sub: "right now", color: "text-yellow-400" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">
          Mission Control
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Welcome back, {user?.username || "..."}. Your servers are ready for launch.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-12 mt-1" />
                  ) : (
                    <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
                <div className={`p-2 rounded-md bg-secondary ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Servers list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-foreground">Servers</h2>
          <Link href="/servers">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
        <div className="space-y-2">
          {serversLoading ? (
            Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)
          ) : servers?.length === 0 ? (
            <Card className="border-dashed border-border">
              <CardContent className="p-6 text-center text-muted-foreground text-sm">
                No servers yet. <Link href="/servers"><span className="text-primary cursor-pointer hover:underline">Create your first server</span></Link>
              </CardContent>
            </Card>
          ) : (
            servers?.map((server) => (
              <Link key={server.id} href={`/servers/${server.id}`}>
                <Card className="border-border bg-card hover:bg-secondary/30 cursor-pointer transition-colors hover-elevate">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <Server className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{server.name}</p>
                        <StatusBadge status={server.status} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {server.type} {server.version} · Port {server.port} · {server.maxRam} RAM
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono text-muted-foreground">
                        {server.onlinePlayers}/{server.maxPlayers}
                      </p>
                      <p className="text-xs text-muted-foreground">players</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>

      <PerplexityAttribution />
    </div>
  );
}
