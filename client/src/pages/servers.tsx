import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Plus, Play, Square, Trash2, ArrowRight, Search, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Server as ServerType } from "@shared/schema";

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    running: "bg-green-500/15 text-green-400 border-green-500/30",
    stopped: "bg-secondary text-muted-foreground border-border",
    starting: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    stopping: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    error: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return (
    <Badge variant="outline" className={`text-xs capitalize h-5 ${variants[status] || variants.stopped}`}>
      {status}
    </Badge>
  );
}

const MC_VERSIONS = ["1.21.4", "1.21.3", "1.21.1", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.16.5", "1.12.2", "1.8.9"];
const SERVER_TYPES = ["paper", "vanilla", "spigot", "forge", "fabric", "purpur", "waterfall"];

export default function ServersPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "paper", version: "1.21.4", port: "25565", maxRam: "2G", minRam: "1G", maxPlayers: "20", motd: "A Minecraft Server" });
  const { toast } = useToast();

  const { data: servers, isLoading } = useQuery<ServerType[]>({
    queryKey: ["/api/servers"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/servers"); return r.json(); },
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/servers", { ...data, port: parseInt(data.port), maxPlayers: parseInt(data.maxPlayers) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreateOpen(false);
      setForm({ name: "", type: "paper", version: "1.21.4", port: "25565", maxRam: "2G", minRam: "1G", maxPlayers: "20", motd: "A Minecraft Server" });
      toast({ title: "Server created" });
    },
    onError: (e: Error) => toast({ title: "Failed to create server", description: e.message, variant: "destructive" }),
  });

  const startMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/servers/${id}/start`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers"] }),
    onError: (e: Error) => toast({ title: "Failed to start server", description: e.message, variant: "destructive" }),
  });

  const stopMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("POST", `/api/servers/${id}/stop`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers"] }),
    onError: (e: Error) => toast({ title: "Failed to stop server", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/servers/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Server deleted" });
    },
    onError: (e: Error) => toast({ title: "Failed to delete server", description: e.message, variant: "destructive" }),
  });

  const filtered = servers?.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.type.toLowerCase().includes(search.toLowerCase()) ||
    s.version.includes(search)
  ) || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Servers</h1>
          <p className="text-sm text-muted-foreground">{servers?.length ?? 0} servers configured</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-server">
          <Plus className="w-4 h-4 mr-1.5" />New Server
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search servers..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-servers"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Server className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No servers match your search" : "No servers yet. Create your first server to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((server) => (
            <Card key={server.id} className="border-border bg-card group" data-testid={`card-server-${server.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${
                  server.status === "running" ? "bg-green-500/15 border border-green-500/30" : "bg-secondary border border-border"
                }`}>
                  <Server className={`w-4 h-4 ${server.status === "running" ? "text-green-400" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{server.name}</p>
                    <StatusBadge status={server.status} />
                    <Badge variant="outline" className="text-xs h-5 border-border text-muted-foreground capitalize">
                      {server.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs h-5 border-border text-muted-foreground">
                      {server.version}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Port {server.port} · {server.maxRam} max RAM · {server.onlinePlayers}/{server.maxPlayers} players
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {server.status === "running" || server.status === "starting" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      onClick={e => { e.preventDefault(); stopMutation.mutate(server.id); }}
                      disabled={stopMutation.isPending || server.status === "stopping"}
                      data-testid={`button-stop-${server.id}`}
                    >
                      <Square className="w-3 h-3 mr-1" />Stop
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-green-500/30 text-green-400 hover:bg-green-500/10"
                      onClick={e => { e.preventDefault(); startMutation.mutate(server.id); }}
                      disabled={startMutation.isPending || server.status === "starting"}
                      data-testid={`button-start-${server.id}`}
                    >
                      <Play className="w-3 h-3 mr-1" />Start
                    </Button>
                  )}
                  <Link href={`/servers/${server.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs" data-testid={`button-manage-${server.id}`}>
                      Manage <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={e => { e.preventDefault(); if (confirm(`Delete ${server.name}?`)) deleteMutation.mutate(server.id); }}
                    data-testid={`button-delete-${server.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Server Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Server</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1.5">
              <Label>Server Name</Label>
              <Input placeholder="My Survival Server" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-server-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Server Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-server-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Minecraft Version</Label>
              <Select value={form.version} onValueChange={v => setForm(f => ({ ...f, version: v }))}>
                <SelectTrigger data-testid="select-mc-version"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MC_VERSIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input type="number" placeholder="25565" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} data-testid="input-port" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Players</Label>
              <Input type="number" placeholder="20" value={form.maxPlayers} onChange={e => setForm(f => ({ ...f, maxPlayers: e.target.value }))} data-testid="input-max-players" />
            </div>
            <div className="space-y-1.5">
              <Label>Max RAM</Label>
              <Select value={form.maxRam} onValueChange={v => setForm(f => ({ ...f, maxRam: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["512M", "1G", "2G", "4G", "6G", "8G", "12G", "16G"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Min RAM</Label>
              <Select value={form.minRam} onValueChange={v => setForm(f => ({ ...f, minRam: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["256M", "512M", "1G", "2G"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>MOTD</Label>
              <Input placeholder="A Minecraft Server" value={form.motd} onChange={e => setForm(f => ({ ...f, motd: e.target.value }))} data-testid="input-motd" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name} data-testid="button-confirm-create">
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Server"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
