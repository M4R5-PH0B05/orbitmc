import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Plus, Trash2, Search, Loader2, Box } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Modpack, Mod } from "@shared/schema";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

const SOURCES = ["manual", "curseforge", "modrinth"];

export default function ModpackDetailPage() {
  const { id } = useParams<{ id: string }>();
  const packId = parseInt(id || "0");
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [addModOpen, setAddModOpen] = useState(false);
  const [modForm, setModForm] = useState({ name: "", filename: "", version: "", source: "manual" });

  const { data: pack, isLoading } = useQuery<Modpack>({
    queryKey: ["/api/modpacks", packId],
    queryFn: async () => { const r = await apiRequest("GET", `/api/modpacks/${packId}`); return r.json(); },
  });

  const { data: mods, isLoading: modsLoading } = useQuery<Mod[]>({
    queryKey: ["/api/modpacks", packId, "mods"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/modpacks/${packId}/mods`); return r.json(); },
  });

  const addModMutation = useMutation({
    mutationFn: async (data: typeof modForm) => {
      const r = await apiRequest("POST", `/api/modpacks/${packId}/mods`, data);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks", packId, "mods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks", packId] });
      setAddModOpen(false);
      setModForm({ name: "", filename: "", version: "", source: "manual" });
      toast({ title: "Mod added" });
    },
    onError: (e: Error) => toast({ title: "Failed to add mod", description: e.message, variant: "destructive" }),
  });

  const deleteModMutation = useMutation({
    mutationFn: async (modId: number) => { await apiRequest("DELETE", `/api/mods/${modId}`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks", packId, "mods"] });
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks", packId] });
      toast({ title: "Mod removed" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const filtered = mods?.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.filename.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const loaderColor: Record<string, string> = {
    forge: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    fabric: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    quilt: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    neoforge: "text-green-400 border-green-500/30 bg-green-500/10",
    vanilla: "text-muted-foreground border-border bg-secondary",
  };

  const sourceColor: Record<string, string> = {
    manual: "bg-secondary text-muted-foreground border-border",
    curseforge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    modrinth: "bg-green-500/10 text-green-400 border-green-500/30",
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!pack) return <div className="p-6 text-center text-muted-foreground">Modpack not found</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-foreground">{pack.name}</h1>
            <Badge variant="outline" className={`text-xs ${loaderColor[pack.loader] || ""}`}>{pack.loader}</Badge>
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">MC {pack.mcVersion}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">v{pack.version} · {pack.modCount} mods{pack.fileSize ? ` · ${formatBytes(pack.fileSize)}` : ""}</p>
          {pack.description && <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>}
        </div>
        <Button size="sm" onClick={() => setAddModOpen(true)} data-testid="button-add-mod">
          <Plus className="w-4 h-4 mr-1.5" />Add Mod
        </Button>
      </div>

      {/* Mod list */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search mods..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-mods"
          />
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="py-3 px-4 border-b border-border">
            <CardTitle className="text-sm text-muted-foreground">{filtered.length} mods</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {modsLoading ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center">
                <Box className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {search ? "No mods match your search" : "No mods in this pack yet. Add your first mod."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-3 px-4 py-3 group" data-testid={`mod-row-${mod.id}`}>
                    <div className="w-7 h-7 rounded bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <Box className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mod.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">{mod.filename}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {mod.version && (
                        <span className="text-xs text-muted-foreground">v{mod.version}</span>
                      )}
                      <Badge variant="outline" className={`text-xs h-5 ${sourceColor[mod.source] || sourceColor.manual}`}>
                        {mod.source}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatBytes(mod.fileSize)}</span>
                      <Button
                        size="icon" variant="ghost" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => deleteModMutation.mutate(mod.id)}
                        data-testid={`button-remove-mod-${mod.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Mod Dialog */}
      <Dialog open={addModOpen} onOpenChange={setAddModOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Mod</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Mod Name</Label>
              <Input
                placeholder="Just Enough Items"
                value={modForm.name}
                onChange={e => setModForm(f => ({ ...f, name: e.target.value, filename: e.target.value.toLowerCase().replace(/\s+/g, "-") + ".jar" }))}
                data-testid="input-mod-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Filename (.jar)</Label>
              <Input
                placeholder="jei-1.21.1.jar"
                value={modForm.filename}
                onChange={e => setModForm(f => ({ ...f, filename: e.target.value }))}
                data-testid="input-mod-filename"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Version</Label>
                <Input placeholder="1.0.0" value={modForm.version} onChange={e => setModForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={modForm.source} onValueChange={v => setModForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addModMutation.mutate(modForm)}
              disabled={addModMutation.isPending || !modForm.name}
              data-testid="button-confirm-add-mod"
            >
              {addModMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : "Add Mod"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
