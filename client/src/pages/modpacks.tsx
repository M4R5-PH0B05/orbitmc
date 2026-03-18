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
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Trash2, ArrowRight, Search, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Modpack } from "@shared/schema";

const LOADERS = ["forge", "fabric", "quilt", "neoforge", "vanilla"];
const MC_VERSIONS = ["1.21.4", "1.21.3", "1.21.1", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.16.5", "1.12.2"];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Unknown";
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export default function ModpacksPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", version: "1.0.0", mcVersion: "1.21.1", loader: "forge", modCount: "0" });
  const { toast } = useToast();

  const { data: modpacks, isLoading } = useQuery<Modpack[]>({
    queryKey: ["/api/modpacks"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/modpacks"); return r.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const r = await apiRequest("POST", "/api/modpacks", { ...data, modCount: parseInt(data.modCount) || 0 });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreateOpen(false);
      setForm({ name: "", description: "", version: "1.0.0", mcVersion: "1.21.1", loader: "forge", modCount: "0" });
      toast({ title: "Modpack created" });
    },
    onError: (e: Error) => toast({ title: "Failed to create modpack", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/modpacks/${id}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "Modpack deleted" });
    },
    onError: (e: Error) => toast({ title: "Failed to delete modpack", description: e.message, variant: "destructive" }),
  });

  const filtered = modpacks?.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.loader.toLowerCase().includes(search.toLowerCase()) ||
    p.mcVersion.includes(search)
  ) || [];

  const loaderColor: Record<string, string> = {
    forge: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    fabric: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    quilt: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    neoforge: "text-green-400 border-green-500/30 bg-green-500/10",
    vanilla: "text-muted-foreground border-border bg-secondary",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Modpacks</h1>
          <p className="text-sm text-muted-foreground">{modpacks?.length ?? 0} modpacks</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-modpack">
          <Plus className="w-4 h-4 mr-1.5" />New Modpack
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search modpacks..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-modpacks"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Package className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No modpacks match your search" : "No modpacks yet. Create your first modpack."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pack) => (
            <Card key={pack.id} className="border-border bg-card hover:bg-secondary/30 transition-colors hover-elevate" data-testid={`card-modpack-${pack.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="w-9 h-9 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{pack.name}</p>
                    <p className="text-xs text-muted-foreground">v{pack.version}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className={`text-xs h-5 ${loaderColor[pack.loader] || "text-muted-foreground border-border"}`}>
                    {pack.loader}
                  </Badge>
                  <Badge variant="outline" className="text-xs h-5 border-border text-muted-foreground">
                    MC {pack.mcVersion}
                  </Badge>
                  <Badge variant="outline" className="text-xs h-5 border-border text-muted-foreground">
                    {pack.modCount} mods
                  </Badge>
                </div>
                {pack.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pack.description}</p>
                )}
                {pack.fileSize && (
                  <p className="text-xs text-muted-foreground mb-3">{formatBytes(pack.fileSize)}</p>
                )}
                <div className="flex items-center gap-1.5 justify-end">
                  <Button
                    size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm(`Delete ${pack.name}?`)) deleteMutation.mutate(pack.id); }}
                    data-testid={`button-delete-modpack-${pack.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Link href={`/modpacks/${pack.id}`}>
                    <Button size="sm" variant="outline" className="h-7 text-xs" data-testid={`button-manage-modpack-${pack.id}`}>
                      Manage <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modpack Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create New Modpack</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="All The Mods 9" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-modpack-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Loader</Label>
                <Select value={form.loader} onValueChange={v => setForm(f => ({ ...f, loader: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOADERS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>MC Version</Label>
                <Select value={form.mcVersion} onValueChange={v => setForm(f => ({ ...f, mcVersion: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MC_VERSIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Pack Version</Label>
                <Input placeholder="1.0.0" value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Mod Count</Label>
                <Input type="number" placeholder="0" value={form.modCount} onChange={e => setForm(f => ({ ...f, modCount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional description..."
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="resize-none h-20"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name} data-testid="button-confirm-create-modpack">
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Modpack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
