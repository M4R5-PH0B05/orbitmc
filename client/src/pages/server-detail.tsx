import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Power, Settings, Terminal, ScrollText, Users, Cpu, Puzzle, FolderOpen,
  Globe, ArchiveRestore, ShieldCheck, Play, Square, RotateCcw, Loader2,
  Send, File, Folder, Download, Trash2, Plus, Edit3, Save, ChevronRight,
  Home, ChevronLeft, Star, Gavel, List, LogOut, AlertCircle, X, Check,
  Database, HardDrive, Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Server as ServerType, FileEntry, Player, World, Backup, SoftwareVersion, ServerAccess } from "@shared/schema";

const TABS = [
  { id: "server",   label: "Server",   icon: Power },
  { id: "options",  label: "Options",  icon: Settings },
  { id: "console",  label: "Console",  icon: Terminal },
  { id: "log",      label: "Log",      icon: ScrollText },
  { id: "players",  label: "Players",  icon: Users },
  { id: "software", label: "Software", icon: Cpu },
  { id: "mods",     label: "Mods",     icon: Puzzle },
  { id: "files",    label: "Files",    icon: FolderOpen },
  { id: "worlds",   label: "Worlds",   icon: Globe },
  { id: "backups",  label: "Backups",  icon: ArchiveRestore },
  { id: "access",   label: "Access",   icon: ShieldCheck },
];

const MODDED_TYPES = ["forge", "fabric", "neoforge", "quilt", "modded"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    running: "bg-green-500/15 text-green-400 border-green-500/30",
    stopped: "bg-secondary text-muted-foreground border-border",
    starting: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    stopping: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    error: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return <Badge variant="outline" className={`text-xs capitalize ${map[status] || map.stopped}`}>{status}</Badge>;
}

interface LogLine { message: string; level: string; timestamp: string; }

export default function ServerDetailPage() {
  const { id, tab: tabParam } = useParams<{ id: string; tab?: string }>();
  const [, navigate] = useLocation();
  const serverId = parseInt(id || "0");
  const tab = tabParam || "server";
  const { toast } = useToast();

  const setTab = (t: string) => navigate(`/servers/${serverId}/${t}`);

  const { data: server, isLoading } = useQuery<ServerType>({
    queryKey: ["/api/servers", serverId],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}`); return r.json(); },
    refetchInterval: 3000,
  });

  const startMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/servers/${serverId}/start`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });
  const stopMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/servers/${serverId}/stop`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });
  const restartMutation = useMutation({
    mutationFn: async () => { await apiRequest("POST", `/api/servers/${serverId}/restart`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!server) return (
    <div className="p-6 text-center text-muted-foreground">Server not found</div>
  );

  const visibleTabs = TABS.filter(t => t.id !== "mods" || MODDED_TYPES.includes(server.type));

  return (
    <div className="flex flex-col h-full">
      {/* Top header — always visible */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/40">
        <div>
          <div className="flex items-center gap-2.5 mb-0.5">
            <h1 className="text-lg font-semibold text-foreground">{server.name}</h1>
            <StatusBadge status={server.status} />
          </div>
          <p className="text-xs text-muted-foreground">{server.type} · {server.version} · Port {server.port} · {server.maxRam} RAM</p>
        </div>
        <div className="flex items-center gap-2">
          {server.status === "stopped" && (
            <Button size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending} className="bg-green-600 hover:bg-green-700 text-white h-8">
              {startMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}Start
            </Button>
          )}
          {server.status === "running" && (<>
            <Button size="sm" variant="outline" onClick={() => restartMutation.mutate()} disabled={restartMutation.isPending} className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 h-8">
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />Restart
            </Button>
            <Button size="sm" variant="outline" onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending} className="border-red-500/30 text-red-400 hover:bg-red-500/10 h-8">
              <Square className="w-3.5 h-3.5 mr-1.5" />Stop
            </Button>
          </>)}
          {(server.status === "starting" || server.status === "stopping") && (
            <Button size="sm" disabled className="h-8"><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />{server.status}...</Button>
          )}
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar */}
        <nav className="w-44 flex-shrink-0 border-r border-border bg-card/30 flex flex-col py-2 overflow-y-auto">
          {visibleTabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                data-testid={`tab-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2.5 px-3 py-2 mx-2 my-0.5 rounded-lg text-sm transition-colors text-left ${
                  active
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {tab === "server"   && <TabServer server={server} />}
          {tab === "options"  && <TabOptions server={server} serverId={serverId} />}
          {tab === "console"  && <TabConsole server={server} serverId={serverId} />}
          {tab === "log"      && <TabLog serverId={serverId} />}
          {tab === "players"  && <TabPlayers server={server} serverId={serverId} />}
          {tab === "software" && <TabSoftware server={server} serverId={serverId} />}
          {tab === "mods"     && <TabMods server={server} serverId={serverId} />}
          {tab === "files"    && <TabFiles server={server} serverId={serverId} />}
          {tab === "worlds"   && <TabWorlds server={server} serverId={serverId} />}
          {tab === "backups"  && <TabBackups server={server} serverId={serverId} />}
          {tab === "access"   && <TabAccess server={server} serverId={serverId} />}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Server Overview ────────────────────────────────────────────────────

function TabServer({ server }: { server: ServerType }) {
  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Status", value: <StatusBadge status={server.status} /> },
          { label: "Players", value: `${server.onlinePlayers}/${server.maxPlayers}` },
          { label: "RAM", value: `${server.maxRam} / ${server.minRam} min` },
          { label: "Port", value: server.port.toString() },
        ].map(s => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <div className="text-sm font-medium text-foreground">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Server Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {[
            ["Software", `${server.type} ${server.version}`],
            ["MOTD", server.motd],
            ["Gamemode", server.gamemode],
            ["Difficulty", server.difficulty],
            ["Online Mode", server.onlineMode ? "Enabled" : "Disabled"],
            ["PvP", server.pvp ? "Enabled" : "Disabled"],
            ["Whitelist", server.whitelistEnabled ? "Enabled" : "Disabled"],
            ["Command Blocks", server.commandBlocksEnabled ? "Enabled" : "Disabled"],
            ["View Distance", `${server.viewDistance} chunks`],
            ["Simulation Distance", `${server.simulationDistance} chunks`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
              <span className="text-muted-foreground">{k}</span>
              <span className="text-foreground font-mono text-xs">{v}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {server.status === "stopped" && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Server is offline. Use the Start button above to launch it.
        </div>
      )}
    </div>
  );
}

// ─── Tab: Options ────────────────────────────────────────────────────────────

function TabOptions({ server, serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: server.name,
    motd: server.motd,
    port: server.port.toString(),
    maxPlayers: server.maxPlayers.toString(),
    difficulty: server.difficulty,
    gamemode: server.gamemode,
    forceGamemode: server.forceGamemode,
    hardcore: server.hardcore,
    pvp: server.pvp,
    onlineMode: server.onlineMode,
    whitelistEnabled: server.whitelistEnabled,
    commandBlocksEnabled: server.commandBlocksEnabled,
    flightEnabled: server.flightEnabled,
    announcePlayerAchievements: server.announcePlayerAchievements,
    levelType: server.levelType,
    levelSeed: server.levelSeed,
    generateStructures: server.generateStructures,
    allowNether: server.allowNether,
    spawnAnimals: server.spawnAnimals,
    spawnMonsters: server.spawnMonsters,
    spawnNpcs: server.spawnNpcs,
    spawnProtection: server.spawnProtection.toString(),
    viewDistance: server.viewDistance,
    simulationDistance: server.simulationDistance,
    networkCompressionThreshold: server.networkCompressionThreshold.toString(),
    entityBroadcastRangePercentage: server.entityBroadcastRangePercentage,
    maxRam: server.maxRam,
    minRam: server.minRam,
    jvmArgs: server.jvmArgs,
    maxTickTime: server.maxTickTime.toString(),
    enableRcon: server.enableRcon,
    rconPort: server.rconPort.toString(),
    rconPassword: server.rconPassword,
    enableQuery: server.enableQuery,
    queryPort: server.queryPort.toString(),
    resourcePack: server.resourcePack,
    resourcePackSha1: server.resourcePackSha1,
    requireResourcePack: server.requireResourcePack,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("PATCH", `/api/servers/${serverId}/config`, {
        ...form,
        port: parseInt(form.port),
        maxPlayers: parseInt(form.maxPlayers),
        spawnProtection: parseInt(form.spawnProtection),
        networkCompressionThreshold: parseInt(form.networkCompressionThreshold),
        maxTickTime: parseInt(form.maxTickTime),
        rconPort: parseInt(form.rconPort),
        queryPort: parseInt(form.queryPort),
      });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] });
      toast({ title: "Configuration saved" });
    },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }));

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-primary/70">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
      <Separator className="bg-border/50" />
    </div>
  );

  const Field = ({ label, desc, children, full }: { label: string; desc?: string; children: React.ReactNode; full?: boolean }) => (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <div>
        <Label className="text-sm">{label}</Label>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {children}
    </div>
  );

  const Toggle = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between gap-3">
      <div>
        <Label className="text-sm">{label}</Label>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} data-testid={`toggle-${label.toLowerCase().replace(/\s/g, "-")}`} />
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <Section title="General">
        <Field label="Server Name" full>
          <Input value={form.name} onChange={e => set("name", e.target.value)} data-testid="input-server-name" />
        </Field>
        <Field label="MOTD" desc="Supports legacy §-color codes" full>
          <Input value={form.motd} onChange={e => set("motd", e.target.value)} data-testid="input-motd" />
        </Field>
        <Field label="Server Port">
          <Input type="number" value={form.port} onChange={e => set("port", e.target.value)} data-testid="input-port" />
        </Field>
        <Field label="Max Players">
          <Input type="number" value={form.maxPlayers} onChange={e => set("maxPlayers", e.target.value)} data-testid="input-max-players" />
        </Field>
        <Field label="Difficulty">
          <Select value={form.difficulty} onValueChange={v => set("difficulty", v)}>
            <SelectTrigger data-testid="select-difficulty"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["peaceful", "easy", "normal", "hard"].map(d => <SelectItem key={d} value={d} className="capitalize">{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Default Gamemode">
          <Select value={form.gamemode} onValueChange={v => set("gamemode", v)}>
            <SelectTrigger data-testid="select-gamemode"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["survival", "creative", "adventure", "spectator"].map(g => <SelectItem key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Toggle label="Force Gamemode" desc="Force players into the default gamemode on join" value={form.forceGamemode} onChange={v => set("forceGamemode", v)} />
        <Toggle label="Hardcore Mode" desc="Players are banned on death" value={form.hardcore} onChange={v => set("hardcore", v)} />
        <Toggle label="PvP" value={form.pvp} onChange={v => set("pvp", v)} />
        <Toggle label="Allow Flight" desc="Required for some mods" value={form.flightEnabled} onChange={v => set("flightEnabled", v)} />
      </Section>

      <Section title="World">
        <Field label="Level Seed" desc="Leave empty for a random seed">
          <Input value={form.levelSeed} onChange={e => set("levelSeed", e.target.value)} placeholder="(random)" data-testid="input-seed" />
        </Field>
        <Field label="World Type">
          <Select value={form.levelType} onValueChange={v => set("levelType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="minecraft:normal">Default</SelectItem>
              <SelectItem value="minecraft:flat">Flat</SelectItem>
              <SelectItem value="minecraft:large_biomes">Large Biomes</SelectItem>
              <SelectItem value="minecraft:amplified">Amplified</SelectItem>
              <SelectItem value="minecraft:single_biome_surface">Single Biome</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Toggle label="Generate Structures" desc="Villages, dungeons, strongholds etc." value={form.generateStructures} onChange={v => set("generateStructures", v)} />
        <Toggle label="Allow Nether" value={form.allowNether} onChange={v => set("allowNether", v)} />
        <Toggle label="Spawn Animals" value={form.spawnAnimals} onChange={v => set("spawnAnimals", v)} />
        <Toggle label="Spawn Monsters" value={form.spawnMonsters} onChange={v => set("spawnMonsters", v)} />
        <Toggle label="Spawn NPCs" desc="Villagers and similar entities" value={form.spawnNpcs} onChange={v => set("spawnNpcs", v)} />
        <Field label="Spawn Protection Radius" desc="Blocks around the world spawn point that non-ops cannot modify">
          <Input type="number" value={form.spawnProtection} onChange={e => set("spawnProtection", e.target.value)} data-testid="input-spawn-protection" />
        </Field>
      </Section>

      <Section title="Network">
        <Toggle label="Online Mode" desc="Authenticate players against Mojang servers. Disable only on private LAN networks." value={form.onlineMode} onChange={v => set("onlineMode", v)} />
        <Toggle label="Whitelist" desc="Only whitelisted players can join" value={form.whitelistEnabled} onChange={v => set("whitelistEnabled", v)} />
        <Field label={`View Distance — ${form.viewDistance} chunks`} full desc="Maximum chunk render distance sent to clients">
          <Slider min={2} max={32} step={1} value={[form.viewDistance]} onValueChange={([v]) => set("viewDistance", v)} data-testid="slider-view-distance" />
        </Field>
        <Field label={`Simulation Distance — ${form.simulationDistance} chunks`} full desc="Distance within which game ticks are simulated">
          <Slider min={2} max={32} step={1} value={[form.simulationDistance]} onValueChange={([v]) => set("simulationDistance", v)} data-testid="slider-sim-distance" />
        </Field>
        <Field label="Network Compression Threshold" desc="Packets larger than this (bytes) are compressed. Set -1 to disable.">
          <Input type="number" value={form.networkCompressionThreshold} onChange={e => set("networkCompressionThreshold", e.target.value)} data-testid="input-compression" />
        </Field>
        <Field label={`Entity Broadcast Range — ${form.entityBroadcastRangePercentage}%`} full desc="How far entities are sent to clients (% of server view distance)">
          <Slider min={10} max={1000} step={10} value={[form.entityBroadcastRangePercentage]} onValueChange={([v]) => set("entityBroadcastRangePercentage", v)} />
        </Field>
      </Section>

      <Section title="Java / Performance">
        <Field label="Max RAM" desc="e.g. 4G, 2048M">
          <Input value={form.maxRam} onChange={e => set("maxRam", e.target.value)} placeholder="4G" data-testid="input-max-ram" />
        </Field>
        <Field label="Min RAM" desc="Initial heap size">
          <Input value={form.minRam} onChange={e => set("minRam", e.target.value)} placeholder="1G" data-testid="input-min-ram" />
        </Field>
        <Field label="JVM Arguments" desc="Additional flags passed to the Java process. Defaults are Aikar flags." full>
          <Textarea value={form.jvmArgs} onChange={e => set("jvmArgs", e.target.value)} className="font-mono text-xs min-h-24 bg-background" data-testid="textarea-jvm-args" />
        </Field>
        <Field label="Max Tick Time (ms)" desc="Server watchdog timeout. Set -1 to disable.">
          <Input type="number" value={form.maxTickTime} onChange={e => set("maxTickTime", e.target.value)} data-testid="input-max-tick" />
        </Field>
      </Section>

      <Section title="Features">
        <Toggle label="Command Blocks" desc="Allow command blocks to run commands" value={form.commandBlocksEnabled} onChange={v => set("commandBlocksEnabled", v)} />
        <Toggle label="Announce Achievements" desc="Broadcast achievement messages to all players" value={form.announcePlayerAchievements} onChange={v => set("announcePlayerAchievements", v)} />
      </Section>

      <Section title="RCON">
        <Toggle label="Enable RCON" desc="Remote console protocol — allows external tools to send commands" value={form.enableRcon} onChange={v => set("enableRcon", v)} />
        {form.enableRcon && (<>
          <Field label="RCON Port">
            <Input type="number" value={form.rconPort} onChange={e => set("rconPort", e.target.value)} data-testid="input-rcon-port" />
          </Field>
          <Field label="RCON Password">
            <Input type="password" value={form.rconPassword} onChange={e => set("rconPassword", e.target.value)} data-testid="input-rcon-password" />
          </Field>
        </>)}
      </Section>

      <Section title="Resource Pack">
        <Field label="Resource Pack URL" full>
          <Input value={form.resourcePack} onChange={e => set("resourcePack", e.target.value)} placeholder="https://example.com/pack.zip" data-testid="input-resource-pack-url" />
        </Field>
        <Field label="SHA1 Hash" desc="Used to verify the pack integrity">
          <Input value={form.resourcePackSha1} onChange={e => set("resourcePackSha1", e.target.value)} placeholder="(optional)" data-testid="input-resource-pack-sha1" />
        </Field>
        <Toggle label="Require Resource Pack" desc="Players who decline will be kicked" value={form.requireResourcePack} onChange={v => set("requireResourcePack", v)} />
      </Section>

      <Section title="Query">
        <Toggle label="Enable Query" desc="Allows server list queries via GameSpy4 protocol" value={form.enableQuery} onChange={v => set("enableQuery", v)} />
        {form.enableQuery && (
          <Field label="Query Port">
            <Input type="number" value={form.queryPort} onChange={e => set("queryPort", e.target.value)} data-testid="input-query-port" />
          </Field>
        )}
      </Section>

      <div className="flex justify-end pt-2 pb-8">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-options">
          {saveMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Configuration</>}
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Console ────────────────────────────────────────────────────────────

function TabConsole({ server, serverId }: { server: ServerType; serverId: number }) {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const portProxy = (window as any).__PORT_5000__;
    const host = portProxy
      ? `${window.location.host}${portProxy}`
      : `${window.location.hostname}:5000`;
    const wsUrl = portProxy
      ? `${proto}//${window.location.host}${portProxy.replace(/^\//, "")}/ws?serverId=${serverId}`
      : `${proto}//${window.location.hostname}:5000/ws?serverId=${serverId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "log") setLogs(prev => [...prev.slice(-499), { message: data.message, level: data.level, timestamp: data.timestamp }]);
      else if (data.type === "status" && data.serverId === serverId) queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] });
    };
    return () => ws.close();
  }, [serverId]);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const commandMutation = useMutation({
    mutationFn: async (cmd: string) => { await apiRequest("POST", `/api/servers/${serverId}/command`, { command: cmd }); },
  });

  const handleSend = () => {
    if (!command.trim() || server.status !== "running") return;
    commandMutation.mutate(command.trim());
    setCommand("");
  };

  const logClass = (level: string) => {
    if (level === "warn") return "text-yellow-400";
    if (level === "error") return "text-red-400";
    return "text-foreground/80";
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <Card className="border-border bg-[hsl(230_20%_4%)] flex-1 flex flex-col min-h-0">
        <CardHeader className="py-2 px-4 border-b border-border flex-row items-center justify-between flex-shrink-0">
          <CardTitle className="text-xs font-mono text-muted-foreground">console output</CardTitle>
          <StatusBadge status={server.status} />
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 console-text min-h-0" data-testid="console-output" style={{ maxHeight: "calc(100vh - 260px)" }}>
            {logs.length === 0 ? (
              <p className="text-muted-foreground/50 text-xs">Waiting for output...</p>
            ) : logs.map((l, i) => (
              <div key={i} className={`leading-relaxed text-xs ${logClass(l.level)}`}>{l.message}</div>
            ))}
            <div ref={logEndRef} />
          </div>
          <div className="border-t border-border p-3 flex gap-2 flex-shrink-0">
            <span className="text-primary console-text flex-shrink-0 self-center text-sm">$</span>
            <Input
              className="console-text bg-transparent border-0 focus-visible:ring-0 h-7 px-1 py-0 text-foreground placeholder:text-muted-foreground/40 text-xs"
              placeholder={server.status === "running" ? "Enter command..." : "Server must be running to send commands"}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              disabled={server.status !== "running"}
              data-testid="input-command"
            />
            <Button size="icon" variant="ghost" className="w-7 h-7 text-primary" onClick={handleSend}
              disabled={server.status !== "running" || !command.trim()} data-testid="button-send-command">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Tab: Log ────────────────────────────────────────────────────────────────

function TabLog({ serverId }: { serverId: number }) {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useQuery({
    queryKey: ["/api/servers", serverId, "logs"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/logs?limit=500`); return r.json() as Promise<Array<{id: number; message: string; level: string; timestamp: string}>>; },
    refetchInterval: 5000,
  });

  const filtered = (logs || []).filter(l => l.message.toLowerCase().includes(search.toLowerCase()));

  const levelBadge = (level: string) => {
    if (level === "warn") return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
    if (level === "error") return "bg-red-500/15 text-red-400 border-red-500/30";
    return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Input placeholder="Filter logs..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" data-testid="input-log-search" />
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>
      <Card className="border-border bg-[hsl(230_20%_4%)]">
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 250px)" }}>
          {isLoading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No log entries</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[hsl(230_20%_6%)] border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium w-36">Time</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium w-16">Level</th>
                  <th className="text-left px-4 py-2 text-muted-foreground font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[...filtered].reverse().map((l, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-1.5 text-muted-foreground font-mono whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-1.5">
                      <Badge variant="outline" className={`text-xs uppercase ${levelBadge(l.level)}`}>{l.level}</Badge>
                    </td>
                    <td className="px-4 py-1.5 font-mono text-foreground/80 break-all">{l.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

// ─── Tab: Players ────────────────────────────────────────────────────────────

function TabPlayers({ server, serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [banOpen, setBanOpen] = useState<number | null>(null);
  const [banReason, setBanReason] = useState("");
  const [newPlayer, setNewPlayer] = useState({ username: "", uuid: "" });

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ["/api/servers", serverId, "players"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/players`); return r.json(); },
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "players"] });

  const addMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/servers/${serverId}/players`, { ...newPlayer, serverId });
      return r.json();
    },
    onSuccess: () => { refetch(); setAddOpen(false); setNewPlayer({ username: "", uuid: "" }); toast({ title: "Player added" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const opMutation = useMutation({
    mutationFn: async (pid: number) => { await apiRequest("POST", `/api/servers/${serverId}/players/${pid}/op`); },
    onSuccess: refetch,
  });
  const whitelistMutation = useMutation({
    mutationFn: async (pid: number) => { await apiRequest("POST", `/api/servers/${serverId}/players/${pid}/whitelist`); },
    onSuccess: refetch,
  });
  const banMutation = useMutation({
    mutationFn: async ({ pid, reason }: { pid: number; reason: string }) => {
      await apiRequest("POST", `/api/servers/${serverId}/players/${pid}/ban`, { reason });
    },
    onSuccess: () => { refetch(); setBanOpen(null); setBanReason(""); },
  });
  const unbanMutation = useMutation({
    mutationFn: async (pid: number) => { await apiRequest("POST", `/api/servers/${serverId}/players/${pid}/unban`); },
    onSuccess: refetch,
  });
  const kickMutation = useMutation({
    mutationFn: async (pid: number) => { await apiRequest("POST", `/api/servers/${serverId}/players/${pid}/kick`); },
    onSuccess: () => toast({ title: "Player kicked" }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (pid: number) => { await apiRequest("DELETE", `/api/players/${pid}`); },
    onSuccess: refetch,
  });

  const total = players?.length || 0;
  const ops = players?.filter(p => p.isOp).length || 0;
  const banned = players?.filter(p => p.isBanned).length || 0;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {[["Total", total, "bg-secondary text-foreground"], ["Operators", ops, "bg-yellow-500/15 text-yellow-400"], ["Banned", banned, "bg-red-500/15 text-red-400"]].map(([label, count, cls]) => (
              <div key={label as string} className={`px-3 py-1 rounded-lg text-xs font-medium ${cls}`}>{label}: {count as number}</div>
            ))}
          </div>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-player">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Add Player
        </Button>
      </div>

      <Card className="border-border bg-card">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !players?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No players tracked yet. Add players to manage them.</div>
        ) : (
          <div className="divide-y divide-border">
            {players.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3" data-testid={`player-row-${p.id}`}>
                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {p.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{p.username}</span>
                    {p.isOp && <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">OP</Badge>}
                    {p.isWhitelisted && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">Whitelisted</Badge>}
                    {p.isBanned && <Badge variant="outline" className="text-xs bg-red-500/15 text-red-400 border-red-500/30">Banned{p.banReason ? `: ${p.banReason}` : ""}</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.uuid}</p>
                </div>
                {p.lastSeen && <span className="text-xs text-muted-foreground hidden sm:block">Last seen {new Date(p.lastSeen).toLocaleDateString()}</span>}
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="w-7 h-7" title="Toggle OP" onClick={() => opMutation.mutate(p.id)} data-testid={`button-op-${p.id}`}>
                    <Star className={`w-3.5 h-3.5 ${p.isOp ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" title="Toggle Whitelist" onClick={() => whitelistMutation.mutate(p.id)} data-testid={`button-whitelist-${p.id}`}>
                    <List className={`w-3.5 h-3.5 ${p.isWhitelisted ? "text-green-400" : "text-muted-foreground"}`} />
                  </Button>
                  {p.isBanned ? (
                    <Button size="icon" variant="ghost" className="w-7 h-7" title="Unban" onClick={() => unbanMutation.mutate(p.id)} data-testid={`button-unban-${p.id}`}>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" className="w-7 h-7" title="Ban" onClick={() => setBanOpen(p.id)} data-testid={`button-ban-${p.id}`}>
                      <Gavel className="w-3.5 h-3.5 text-muted-foreground hover:text-red-400" />
                    </Button>
                  )}
                  {server.status === "running" && (
                    <Button size="icon" variant="ghost" className="w-7 h-7" title="Kick" onClick={() => kickMutation.mutate(p.id)} data-testid={`button-kick-${p.id}`}>
                      <LogOut className="w-3.5 h-3.5 text-muted-foreground hover:text-orange-400" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="w-7 h-7" title="Remove" onClick={() => deleteMutation.mutate(p.id)} data-testid={`button-remove-player-${p.id}`}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Player Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Add Player</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Minecraft Username</Label>
              <Input value={newPlayer.username} onChange={e => setNewPlayer(p => ({ ...p, username: e.target.value }))} placeholder="Steve" data-testid="input-player-username" />
            </div>
            <div className="space-y-1.5">
              <Label>UUID</Label>
              <Input value={newPlayer.uuid} onChange={e => setNewPlayer(p => ({ ...p, uuid: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="font-mono text-xs" data-testid="input-player-uuid" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!newPlayer.username.trim() || !newPlayer.uuid.trim() || addMutation.isPending}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={banOpen !== null} onOpenChange={() => setBanOpen(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Ban Player</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label>Reason (optional)</Label>
            <Input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Reason for ban" data-testid="input-ban-reason" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanOpen(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => banOpen && banMutation.mutate({ pid: banOpen, reason: banReason })} disabled={banMutation.isPending}>
              <Gavel className="w-4 h-4 mr-2" />Ban Player
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Software ────────────────────────────────────────────────────────────

function TabSoftware({ server, serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();

  const { data: versions, isLoading } = useQuery<SoftwareVersion[]>({
    queryKey: ["/api/software"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/software"); return r.json(); },
  });

  const switchMutation = useMutation({
    mutationFn: async ({ type, version }: { type: string; version: string }) => {
      const r = await apiRequest("PATCH", `/api/servers/${serverId}/config`, { type, version });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId] });
      toast({ title: "Software updated — restart to apply changes" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const grouped = (versions || []).reduce<Record<string, SoftwareVersion[]>>((acc, v) => {
    if (!acc[v.software]) acc[v.software] = [];
    acc[v.software].push(v);
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5">
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Current Software</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground capitalize">{server.type}</p>
            <p className="text-xs text-muted-foreground">Version {server.version}</p>
          </div>
          {server.status !== "stopped" && (
            <Badge variant="outline" className="ml-auto text-xs text-yellow-400 border-yellow-500/30">Restart required to change software</Badge>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : (
        Object.entries(grouped).map(([software, vers]) => (
          <Card key={software} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm capitalize">{software}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {vers.map(v => {
                  const isCurrent = server.type === v.software && server.version === v.version;
                  return (
                    <div key={v.id} className="flex items-center gap-3 px-4 py-3" data-testid={`software-row-${v.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{v.mcVersion}</span>
                          {v.isLatest && <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">Latest</Badge>}
                          {isCurrent && <Badge variant="outline" className="text-xs bg-primary/15 text-primary border-primary/30">Active</Badge>}
                        </div>
                        {v.releasedAt && <p className="text-xs text-muted-foreground mt-0.5">Released {new Date(v.releasedAt).toLocaleDateString()}</p>}
                      </div>
                      {!isCurrent && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => switchMutation.mutate({ type: software, version: v.mcVersion })}
                          disabled={switchMutation.isPending}
                          data-testid={`button-switch-${v.id}`}
                        >
                          Switch to this version
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Tab: Mods ────────────────────────────────────────────────────────────────

function TabMods({ serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newMod, setNewMod] = useState({ name: "", filename: "", version: "", source: "manual" });

  const { data: modpacks } = useQuery<any[]>({
    queryKey: ["/api/modpacks"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/modpacks"); return r.json(); },
  });

  const firstPack = modpacks?.[0];

  const { data: mods, isLoading } = useQuery<any[]>({
    queryKey: ["/api/modpacks", firstPack?.id, "mods"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/modpacks/${firstPack.id}/mods`); return r.json(); },
    enabled: !!firstPack,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!firstPack) throw new Error("No modpack");
      await apiRequest("POST", `/api/modpacks/${firstPack.id}/mods`, newMod);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/modpacks", firstPack?.id, "mods"] });
      setAddOpen(false); setNewMod({ name: "", filename: "", version: "", source: "manual" });
      toast({ title: "Mod added" });
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/mods/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/modpacks", firstPack?.id, "mods"] }),
  });

  return (
    <div className="p-6 space-y-4">
      {firstPack && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-foreground">{firstPack.name}</h3>
            <p className="text-xs text-muted-foreground">{firstPack.loader} · MC {firstPack.mcVersion} · {mods?.length || 0} mods</p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-mod"><Plus className="w-3.5 h-3.5 mr-1.5" />Add Mod</Button>
        </div>
      )}
      <Card className="bg-card border-border">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !mods?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No mods yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {mods.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-2.5" data-testid={`mod-row-${m.id}`}>
                <Puzzle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{m.filename}</p>
                </div>
                <Badge variant="outline" className="text-xs">{m.version}</Badge>
                <span className="text-xs text-muted-foreground">{m.fileSize > 1048576 ? `${(m.fileSize / 1048576).toFixed(1)} MB` : `${(m.fileSize / 1024).toFixed(0)} KB`}</span>
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => deleteMutation.mutate(m.id)} data-testid={`button-delete-mod-${m.id}`}>
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Add Mod</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {[["name", "Mod Name", "JEI"], ["filename", "Filename", "jei-1.21.jar"], ["version", "Version", "1.0.0"]].map(([key, label, placeholder]) => (
              <div key={key} className="space-y-1.5">
                <Label>{label}</Label>
                <Input value={(newMod as any)[key]} onChange={e => setNewMod(m => ({ ...m, [key]: e.target.value }))} placeholder={placeholder} data-testid={`input-mod-${key}`} />
              </div>
            ))}
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={newMod.source} onValueChange={v => setNewMod(m => ({ ...m, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Upload</SelectItem>
                  <SelectItem value="curseforge">CurseForge</SelectItem>
                  <SelectItem value="modrinth">Modrinth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!newMod.name.trim() || addMutation.isPending}>Add Mod</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Files ───────────────────────────────────────────────────────────────

function TabFiles({ serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState("/");
  const [editingFile, setEditingFile] = useState<FileEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFileIsDir, setNewFileIsDir] = useState(false);

  const { data: files, isLoading: filesLoading } = useQuery<FileEntry[]>({
    queryKey: ["/api/servers", serverId, "files", currentPath],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/files?path=${encodeURIComponent(currentPath)}`); return r.json(); },
  });

  const saveFileMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => { const r = await apiRequest("PATCH", `/api/files/${id}`, { content }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "files", currentPath] }); setEditingFile(null); toast({ title: "File saved" }); },
    onError: (e: Error) => toast({ title: "Save failed", description: e.message, variant: "destructive" }),
  });
  const createFileMutation = useMutation({
    mutationFn: async ({ name, isDirectory }: { name: string; isDirectory: boolean }) => { const r = await apiRequest("POST", `/api/servers/${serverId}/files`, { name, path: currentPath, isDirectory, content: isDirectory ? null : "" }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "files", currentPath] }); setNewFileOpen(false); setNewFileName(""); toast({ title: "Created" }); },
    onError: (e: Error) => toast({ title: "Create failed", description: e.message, variant: "destructive" }),
  });
  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: number) => { await apiRequest("DELETE", `/api/files/${fileId}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "files", currentPath] }),
    onError: (e: Error) => toast({ title: "Delete failed", description: e.message, variant: "destructive" }),
  });

  const navigateToDir = (name: string) => setCurrentPath(currentPath === "/" ? `/${name}` : `${currentPath}/${name}`);
  const navigateUp = () => { if (currentPath === "/") return; const parts = currentPath.split("/").filter(Boolean); parts.pop(); setCurrentPath(parts.length === 0 ? "/" : "/" + parts.join("/")); };
  const openFile = (file: FileEntry) => { if (file.content === null) { toast({ title: "Binary or directory" }); return; } setEditingFile(file); setEditContent(file.content || ""); };
  const downloadFile = (file: FileEntry) => { if (!file.content) return; const blob = new Blob([file.content], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); };

  const pathParts = currentPath === "/" ? [] : currentPath.split("/").filter(Boolean);

  return (
    <div className="p-4 space-y-3">
      <Card className="border-border bg-card">
        <CardHeader className="py-3 px-4 border-b border-border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1 text-sm console-text">
              <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => setCurrentPath("/")} data-testid="breadcrumb-home"><Home className="w-3 h-3" /></Button>
              {pathParts.map((part, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setCurrentPath("/" + pathParts.slice(0, i + 1).join("/"))}>{part}</Button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {currentPath !== "/" && <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={navigateUp} data-testid="button-navigate-up"><ChevronLeft className="w-3 h-3 mr-1" />Up</Button>}
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setNewFileIsDir(true); setNewFileOpen(true); }} data-testid="button-new-folder"><Folder className="w-3 h-3 mr-1" />New Folder</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setNewFileIsDir(false); setNewFileOpen(true); }} data-testid="button-new-file"><Plus className="w-3 h-3 mr-1" />New File</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filesLoading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : !files?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Empty directory</div>
          ) : (
            <div className="divide-y divide-border">
              {[...files].sort((a, b) => (b.isDirectory ? 1 : 0) - (a.isDirectory ? 1 : 0) || a.name.localeCompare(b.name)).map(file => (
                <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/30 group cursor-pointer"
                  onClick={() => file.isDirectory ? navigateToDir(file.name) : openFile(file)} data-testid={`file-row-${file.id}`}>
                  {file.isDirectory ? <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" /> : <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <span className="text-sm text-foreground flex-1 font-mono">{file.name}</span>
                  {!file.isDirectory && <span className="text-xs text-muted-foreground">{file.size > 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${file.size} B`}</span>}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!file.isDirectory && file.content !== null && (<>
                      <Button size="icon" variant="ghost" className="w-6 h-6" onClick={e => { e.stopPropagation(); openFile(file); }} title="Edit"><Edit3 className="w-3 h-3 text-muted-foreground" /></Button>
                      <Button size="icon" variant="ghost" className="w-6 h-6" onClick={e => { e.stopPropagation(); downloadFile(file); }} title="Download"><Download className="w-3 h-3 text-muted-foreground" /></Button>
                    </>)}
                    <Button size="icon" variant="ghost" className="w-6 h-6" onClick={e => { e.stopPropagation(); if (confirm(`Delete ${file.name}?`)) deleteFileMutation.mutate(file.id); }} title="Delete">
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingFile} onOpenChange={open => !open && setEditingFile(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col bg-card border-border">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="font-mono text-sm flex items-center gap-2"><File className="w-4 h-4 text-muted-foreground" />{editingFile?.name}</DialogTitle>
          </DialogHeader>
          <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="flex-1 console-text resize-none bg-[hsl(230_20%_4%)] border-border min-h-80 font-mono text-xs" data-testid="textarea-file-content" />
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setEditingFile(null)}>Cancel</Button>
            <Button onClick={() => editingFile && saveFileMutation.mutate({ id: editingFile.id, content: editContent })} disabled={saveFileMutation.isPending} data-testid="button-save-file">
              {saveFileMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newFileOpen} onOpenChange={setNewFileOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>{newFileIsDir ? "New Folder" : "New File"}</DialogTitle></DialogHeader>
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder={newFileIsDir ? "folder-name" : "file.txt"} value={newFileName} onChange={e => setNewFileName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newFileName.trim()) createFileMutation.mutate({ name: newFileName.trim(), isDirectory: newFileIsDir }); }}
              data-testid="input-new-file-name" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFileOpen(false)}>Cancel</Button>
            <Button onClick={() => createFileMutation.mutate({ name: newFileName.trim(), isDirectory: newFileIsDir })} disabled={!newFileName.trim() || createFileMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Worlds ──────────────────────────────────────────────────────────────

function TabWorlds({ serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newWorld, setNewWorld] = useState({ name: "", type: "overworld", seed: "" });

  const { data: worlds, isLoading } = useQuery<World[]>({
    queryKey: ["/api/servers", serverId, "worlds"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/worlds`); return r.json(); },
  });

  const addMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", `/api/servers/${serverId}/worlds`, { ...newWorld, serverId }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "worlds"] }); setAddOpen(false); setNewWorld({ name: "", type: "overworld", seed: "" }); toast({ title: "World added" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/worlds/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "worlds"] }),
  });

  const typeColor: Record<string, string> = {
    overworld: "bg-green-500/15 text-green-400 border-green-500/30",
    nether: "bg-red-500/15 text-red-400 border-red-500/30",
    the_end: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    custom: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setAddOpen(true)} data-testid="button-add-world"><Plus className="w-3.5 h-3.5 mr-1.5" />Add World</Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : !worlds?.length ? (
        <div className="p-8 text-center text-sm text-muted-foreground">No worlds found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {worlds.map(w => (
            <Card key={w.id} className="bg-card border-border" data-testid={`world-card-${w.id}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{w.name}</span>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize ${typeColor[w.type] || typeColor.custom}`}>{w.type.replace("_", " ")}</Badge>
                  </div>
                  {w.isActive && <Badge variant="outline" className="text-xs bg-primary/15 text-primary border-primary/30">Active</Badge>}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {w.seed && <p>Seed: <span className="font-mono text-foreground/70">{w.seed}</span></p>}
                  <p>Size: {w.size > 1048576 ? `${(w.size / 1048576).toFixed(1)} MB` : w.size > 0 ? `${(w.size / 1024).toFixed(0)} KB` : "Unknown"}</p>
                  {w.lastBackup && <p>Backed up: {new Date(w.lastBackup).toLocaleDateString()}</p>}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs flex-1"><Download className="w-3 h-3 mr-1" />Download</Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => deleteMutation.mutate(w.id)} data-testid={`button-delete-world-${w.id}`}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Add World</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>World Name</Label>
              <Input value={newWorld.name} onChange={e => setNewWorld(w => ({ ...w, name: e.target.value }))} placeholder="world" data-testid="input-world-name" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={newWorld.type} onValueChange={v => setNewWorld(w => ({ ...w, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overworld">Overworld</SelectItem>
                  <SelectItem value="nether">Nether</SelectItem>
                  <SelectItem value="the_end">The End</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Seed (optional)</Label>
              <Input value={newWorld.seed} onChange={e => setNewWorld(w => ({ ...w, seed: e.target.value }))} placeholder="(random)" data-testid="input-world-seed" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => addMutation.mutate()} disabled={!newWorld.name.trim() || addMutation.isPending}>Add World</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Tab: Backups ─────────────────────────────────────────────────────────────

function TabBackups({ serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();

  const { data: backups, isLoading } = useQuery<Backup[]>({
    queryKey: ["/api/servers", serverId, "backups"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/backups`); return r.json(); },
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", `/api/servers/${serverId}/backups`, {
        name: `Manual Backup — ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        type: "manual",
      });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "backups"] }); toast({ title: "Backup started" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/backups/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "backups"] }),
  });

  const typeBadge: Record<string, string> = {
    manual: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    scheduled: "bg-green-500/10 text-green-400 border-green-500/20",
    "pre-update": "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Backups</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{backups?.length || 0} backups stored</p>
        </div>
        <Button size="sm" onClick={() => createMutation.mutate()} disabled={createMutation.isPending} data-testid="button-create-backup">
          {createMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />Creating...</> : <><HardDrive className="w-3.5 h-3.5 mr-1.5" />Create Backup</>}
        </Button>
      </div>

      <Card className="bg-card border-border">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !backups?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No backups yet. Create your first backup above.</div>
        ) : (
          <div className="divide-y divide-border">
            {[...backups].reverse().map(b => (
              <div key={b.id} className="flex items-center gap-3 px-4 py-3" data-testid={`backup-row-${b.id}`}>
                <div className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0">
                  {b.status === "in-progress" ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Database className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{b.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className={`text-xs capitalize ${typeBadge[b.type] || typeBadge.manual}`}>{b.type}</Badge>
                    {b.status === "in-progress" && <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">In Progress</Badge>}
                    <span className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString()}</span>
                  </div>
                  {b.notes && <p className="text-xs text-muted-foreground mt-0.5">{b.notes}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{b.size > 1048576 ? `${(b.size / 1048576).toFixed(1)} MB` : b.size > 0 ? `${(b.size / 1024).toFixed(0)} KB` : "—"}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="w-7 h-7" title="Download" disabled={b.status !== "complete"}>
                    <Download className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                  <Button size="icon" variant="ghost" className="w-7 h-7" title="Delete" onClick={() => deleteMutation.mutate(b.id)} data-testid={`button-delete-backup-${b.id}`}>
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Access ──────────────────────────────────────────────────────────────

function TabAccess({ serverId }: { server: ServerType; serverId: number }) {
  const { toast } = useToast();
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantForm, setGrantForm] = useState({ userId: "", permission: "viewer" });

  const { data: accessList, isLoading } = useQuery<Array<ServerAccess & { username: string; email: string }>>({
    queryKey: ["/api/servers", serverId, "access"],
    queryFn: async () => { const r = await apiRequest("GET", `/api/servers/${serverId}/access`); return r.json(); },
  });
  const { data: allUsers } = useQuery<Array<{ id: number; username: string; email: string }>>({
    queryKey: ["/api/users"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/users"); return r.json(); },
  });

  const grantedUserIds = new Set((accessList || []).map(a => a.userId));
  const grantableUsers = (allUsers || []).filter(u => !grantedUserIds.has(u.id));

  const grantMutation = useMutation({
    mutationFn: async () => { const r = await apiRequest("POST", `/api/servers/${serverId}/access`, { userId: parseInt(grantForm.userId), permission: grantForm.permission }); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "access"] }); setGrantOpen(false); setGrantForm({ userId: "", permission: "viewer" }); toast({ title: "Access granted" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const revokeMutation = useMutation({
    mutationFn: async (id: number) => { await apiRequest("DELETE", `/api/access/${id}`); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "access"] }),
  });
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, permission }: { id: number; permission: string }) => {
      const r = await apiRequest("PATCH", `/api/access/${id}`, { permission });
      return r.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/servers", serverId, "access"] }),
  });

  const permBadge: Record<string, string> = {
    admin: "bg-primary/15 text-primary border-primary/30",
    operator: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    viewer: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium text-foreground">Panel Access</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control who can manage this server</p>
        </div>
        <Button size="sm" onClick={() => setGrantOpen(true)} disabled={grantableUsers.length === 0} data-testid="button-grant-access">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Grant Access
        </Button>
      </div>

      <Card className="bg-card border-border">
        {isLoading ? (
          <div className="p-8 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : !accessList?.length ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No access entries. Grant access to crew members above.</div>
        ) : (
          <div className="divide-y divide-border">
            {accessList.map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3" data-testid={`access-row-${a.id}`}>
                <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {a.username?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.username}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </div>
                <Select value={a.permission} onValueChange={v => updateRoleMutation.mutate({ id: a.id, permission: v })}>
                  <SelectTrigger className="w-28 h-7 text-xs" data-testid={`select-permission-${a.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className={`text-xs capitalize ${permBadge[a.permission] || permBadge.viewer}`}>{a.permission}</Badge>
                <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => revokeMutation.mutate(a.id)} title="Revoke access" data-testid={`button-revoke-${a.id}`}>
                  <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Grant Server Access</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>User</Label>
              <Select value={grantForm.userId} onValueChange={v => setGrantForm(f => ({ ...f, userId: v }))}>
                <SelectTrigger data-testid="select-grant-user"><SelectValue placeholder="Select user..." /></SelectTrigger>
                <SelectContent>
                  {grantableUsers.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.username} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Permission Level</Label>
              <Select value={grantForm.permission} onValueChange={v => setGrantForm(f => ({ ...f, permission: v }))}>
                <SelectTrigger data-testid="select-grant-permission"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — read-only, can view console and files</SelectItem>
                  <SelectItem value="operator">Operator — can start/stop, run commands, manage players</SelectItem>
                  <SelectItem value="admin">Admin — full access including options and access management</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>Cancel</Button>
            <Button onClick={() => grantMutation.mutate()} disabled={!grantForm.userId || grantMutation.isPending}>Grant Access</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
