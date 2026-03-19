import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Rocket, Server, Users, Package, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Globe, Cpu, Zap,
  ShieldCheck, Eye, Terminal, Star
} from "lucide-react";

const MC_VERSIONS = ["1.21.4", "1.21.1", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.16.5"];
const SERVER_TYPES = ["paper", "vanilla", "fabric", "forge", "neoforge", "spigot", "purpur"];

interface OnboardingProps {
  username: string;
  role: string; // "admin" | "operator" | "viewer"
  onComplete: () => void;
}

// ─── ADMIN ONBOARDING ────────────────────────────────────────────────────────

const ADMIN_STEPS = [
  { id: "welcome", label: "Welcome",     icon: Rocket },
  { id: "server",  label: "First Server", icon: Server },
  { id: "invite",  label: "Invite Crew", icon: Users },
  { id: "done",    label: "Ready",       icon: CheckCircle2 },
];

// ─── INVITEE ONBOARDING ──────────────────────────────────────────────────────

const INVITEE_STEPS = [
  { id: "welcome",  label: "Welcome",    icon: Rocket },
  { id: "password", label: "Password",   icon: ShieldCheck },
  { id: "done",     label: "Ready",      icon: CheckCircle2 },
];

// ─── Shared: Step Indicator ──────────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: typeof ADMIN_STEPS }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium border transition-all duration-300
              ${done  ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]" : ""}
              ${active ? "bg-primary/15 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]" : ""}
              ${!done && !active ? "bg-secondary border-border text-muted-foreground" : ""}
            `}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-10 h-px mx-1 transition-all duration-500 ${done ? "bg-primary/60" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Admin: Welcome ──────────────────────────────────────────────────────────

function AdminWelcomeStep({ username, onNext }: { username: string; onNext: () => void }) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center nebula-glow">
            <Rocket className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Welcome to OrbitMC, {username}</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Your mission control for Minecraft servers. We'll walk you through the basics — everything can be changed at any time.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-left">
        {[
          { icon: Server, title: "Any server type", desc: "Vanilla, Paper, Forge, Fabric & more" },
          { icon: Globe, title: "Share access", desc: "Invite friends with role-based permissions" },
          { icon: Package, title: "Modpacks", desc: "Build & manage mod collections" },
        ].map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="bg-secondary/40 border-border">
            <CardContent className="p-3">
              <Icon className="w-5 h-5 text-primary mb-1.5" />
              <p className="text-xs font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={onNext} className="w-full bg-primary hover:bg-primary/90 font-semibold" data-testid="button-onboard-begin">
        Begin Setup <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ─── Admin: Server Step ──────────────────────────────────────────────────────

function AdminServerStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "paper",
    version: "1.21.4",
    port: "25565",
    maxRam: "2G",
    minRam: "1G",
    maxPlayers: "20",
    motd: "A Minecraft Server",
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Deploy your first server</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the basics — you can change every setting later in the Options tab.
        </p>
      </div>

      {!creating ? (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center">
            <Server className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-center text-muted-foreground max-w-xs">
            You can create a server now or skip this and add one from the Servers page whenever you're ready.
          </p>
          <div className="flex gap-2 w-full">
            <Button variant="outline" onClick={() => onNext(null)} className="flex-1" data-testid="button-skip-server">
              Skip for now
            </Button>
            <Button onClick={() => setCreating(true)} className="flex-1 bg-primary hover:bg-primary/90" data-testid="button-setup-server">
              <Server className="w-4 h-4 mr-1.5" />Set up a server
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Server Name <span className="text-destructive">*</span></Label>
            <Input placeholder="Survival World" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="bg-secondary/60" data-testid="onboard-server-name" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Server Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>MC Version</Label>
              <Select value={form.version} onValueChange={v => setForm(f => ({ ...f, version: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MC_VERSIONS.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Port</Label>
              <Input value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
                     className="bg-secondary/60" placeholder="25565" />
            </div>
            <div className="space-y-1.5">
              <Label>Max RAM</Label>
              <Select value={form.maxRam} onValueChange={v => setForm(f => ({ ...f, maxRam: v }))}>
                <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["512M","1G","2G","4G","6G","8G","12G","16G"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <button type="button" onClick={() => setCreating(false)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            Actually, skip for now
          </button>
        </div>
      )}

      {creating && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
          <Button onClick={() => onNext(form)} disabled={!form.name.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90 font-semibold" data-testid="button-onboard-server-next">
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {!creating && (
        <Button variant="outline" onClick={onBack} className="w-full"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
      )}
    </div>
  );
}

// ─── Admin: Invite Step ──────────────────────────────────────────────────────

function AdminInviteStep({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [invites, setInvites] = useState([{ username: "", email: "", role: "operator" }]);
  const addRow = () => setInvites(i => [...i, { username: "", email: "", role: "operator" }]);
  const removeRow = (idx: number) => setInvites(i => i.filter((_, j) => j !== idx));
  const updateRow = (idx: number, field: string, val: string) =>
    setInvites(i => i.map((row, j) => j === idx ? { ...row, [field]: val } : row));
  const validInvites = invites.filter(i => i.username.trim() && i.email.trim());

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Invite your crew</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Give friends panel access. They'll receive a temporary password of <code className="text-xs bg-secondary px-1 rounded">ChangeMe123!</code> — they'll be prompted to change it on first login.
        </p>
      </div>

      <div className="space-y-3">
        {invites.map((inv, idx) => (
          <div key={idx} className="p-3 bg-secondary/40 rounded-lg border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Crew member {idx + 1}</span>
              {invites.length > 1 && (
                <button onClick={() => removeRow(idx)} className="text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="username" value={inv.username} onChange={e => updateRow(idx, "username", e.target.value)}
                     className="bg-background/50 text-sm h-8" data-testid={`onboard-invite-username-${idx}`} />
              <Input placeholder="email@example.com" value={inv.email} onChange={e => updateRow(idx, "email", e.target.value)}
                     className="bg-background/50 text-sm h-8" data-testid={`onboard-invite-email-${idx}`} />
            </div>
            <Select value={inv.role} onValueChange={v => updateRow(idx, "role", v)}>
              <SelectTrigger className="bg-background/50 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator — start/stop, console, manage players</SelectItem>
                <SelectItem value="viewer">Viewer — read-only access</SelectItem>
                <SelectItem value="admin">Admin — full control</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
        {invites.length < 6 && (
          <button onClick={addRow} className="text-xs text-primary hover:text-primary/80 transition-colors underline underline-offset-2">
            + Add another crew member
          </button>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
        <Button onClick={() => onNext(validInvites.length > 0 ? invites : null)}
                className="flex-1 bg-primary hover:bg-primary/90 font-semibold" data-testid="button-onboard-invite-next">
          {validInvites.length > 0 ? `Invite ${validInvites.length}` : "Skip"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Admin: Done Step ────────────────────────────────────────────────────────

function AdminDoneStep({ serverData, inviteCount, onComplete, isLoading }: {
  serverData: any;
  inviteCount: number;
  onComplete: () => void;
  isLoading: boolean;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center"
             style={{ boxShadow: "0 0 40px hsl(142 70% 45% / 0.3)" }}>
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">You're in orbit!</h2>
        <p className="text-sm text-muted-foreground mt-2">OrbitMC is ready. Here's what we set up:</p>
      </div>
      <div className="space-y-2 text-left">
        {[
          { icon: Server, done: !!serverData, ok: "Server configured — ready to launch", skip: "No server yet — add one from Servers" },
          { icon: Users, done: inviteCount > 0, ok: `${inviteCount} crew member${inviteCount > 1 ? "s" : ""} invited`, skip: "No crew yet — invite from Users page" },
        ].map(({ icon: Icon, done, ok, skip }) => (
          <div key={ok} className={`flex items-center gap-3 p-3 rounded-lg border ${done ? "border-green-500/20 bg-green-500/5" : "border-border bg-secondary/30 opacity-60"}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? "bg-green-500/20" : "bg-secondary"}`}>
              <Icon className={`w-3 h-3 ${done ? "text-green-400" : "text-muted-foreground"}`} />
            </div>
            <p className="text-sm font-medium text-foreground flex-1">{done ? ok : skip}</p>
            {done && <CheckCircle2 className="w-4 h-4 text-green-400" />}
          </div>
        ))}
      </div>
      <Button onClick={onComplete} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 font-semibold py-5" data-testid="button-complete-onboarding">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Setting up...</> : <><Rocket className="w-4 h-4 mr-2" />Enter Mission Control</>}
      </Button>
    </div>
  );
}

// ─── Invitee: Welcome ────────────────────────────────────────────────────────

function InviteeWelcomeStep({ username, role, onNext }: { username: string; role: string; onNext: () => void }) {
  const roleInfo: Record<string, { icon: any; label: string; desc: string; color: string }> = {
    admin:    { icon: ShieldCheck, label: "Admin",    desc: "Full panel access — you can manage servers, users, and all settings.", color: "text-primary" },
    operator: { icon: Terminal,    label: "Operator", desc: "You can start/stop servers, run commands, manage players and files.",   color: "text-blue-400" },
    viewer:   { icon: Eye,         label: "Viewer",   desc: "Read-only access — you can view console logs and server status.",       color: "text-muted-foreground" },
  };
  const info = roleInfo[role] || roleInfo.viewer;
  const Icon = info.icon;

  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center nebula-glow">
            <Rocket className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
            <Zap className="w-3 h-3 text-white" />
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">Welcome aboard, {username}!</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          You've been invited to OrbitMC — a Minecraft server control panel. Let's get you set up.
        </p>
      </div>

      <div className="p-4 bg-secondary/40 rounded-lg border border-border text-left space-y-2">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Your role</p>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${info.color}`} />
          <span className={`text-sm font-semibold ${info.color}`}>{info.label}</span>
        </div>
        <p className="text-sm text-muted-foreground">{info.desc}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-left">
        {[
          { icon: Terminal, title: "Live Console", desc: "Watch server output" },
          { icon: Users,    title: "Player Mgmt", desc: "Op, ban, whitelist" },
          { icon: Star,     title: "Files & Mods", desc: "Edit & manage content" },
        ].map(({ icon: I, title, desc }) => (
          <Card key={title} className="bg-secondary/40 border-border">
            <CardContent className="p-3">
              <I className="w-4 h-4 text-primary mb-1" />
              <p className="text-xs font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button onClick={onNext} className="w-full bg-primary hover:bg-primary/90 font-semibold" data-testid="button-invitee-next">
        Continue <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

// ─── Invitee: Change Password ─────────────────────────────────────────────────

function InviteePasswordStep({ username, onNext, onBack }: { username: string; onNext: (data: any) => void; onBack: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [skip, setSkip] = useState(false);
  const { toast } = useToast();

  const mismatch = pw && confirm && pw !== confirm;
  const weak = pw && pw.length < 8;

  const handleNext = () => {
    if (skip) return onNext(null);
    if (!pw || mismatch || weak) return;
    onNext({ password: pw });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Set your password</h2>
        <p className="text-sm text-muted-foreground mt-1">
          You were given a temporary password. Choose a secure one now — or skip and do it later in your profile.
        </p>
      </div>

      {!skip ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>New Password</Label>
            <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters"
                   className="bg-secondary/60" data-testid="input-new-password" autoFocus />
            {weak && <p className="text-xs text-red-400">Must be at least 8 characters</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                   className="bg-secondary/60" data-testid="input-confirm-password" />
            {mismatch && <p className="text-xs text-red-400">Passwords don't match</p>}
          </div>
          <button type="button" onClick={() => setSkip(true)} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
            Skip for now
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-4">
          <ShieldCheck className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground text-center">You can change your password later from the account settings.</p>
          <button type="button" onClick={() => setSkip(false)} className="text-xs text-primary underline underline-offset-2">Set it now</button>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="flex-1"><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
        <Button onClick={handleNext} disabled={!skip && (!pw || !!mismatch || !!weak)}
                className="flex-1 bg-primary hover:bg-primary/90 font-semibold" data-testid="button-password-next">
          {skip ? "Skip" : "Set Password"} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

// ─── Invitee: Done ───────────────────────────────────────────────────────────

function InviteeDoneStep({ passwordSet, onComplete, isLoading }: { passwordSet: boolean; onComplete: () => void; isLoading: boolean }) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/40 flex items-center justify-center"
             style={{ boxShadow: "0 0 40px hsl(142 70% 45% / 0.3)" }}>
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-bold text-foreground">All set!</h2>
        <p className="text-sm text-muted-foreground mt-2">You're ready to manage Minecraft servers from orbit.</p>
      </div>
      <div className="space-y-2 text-left">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center"><Rocket className="w-3 h-3 text-green-400" /></div>
          <p className="text-sm font-medium text-foreground flex-1">Account activated</p>
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        </div>
        <div className={`flex items-center gap-3 p-3 rounded-lg border ${passwordSet ? "border-green-500/20 bg-green-500/5" : "border-border bg-secondary/30 opacity-60"}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${passwordSet ? "bg-green-500/20" : "bg-secondary"}`}>
            <ShieldCheck className={`w-3 h-3 ${passwordSet ? "text-green-400" : "text-muted-foreground"}`} />
          </div>
          <p className="text-sm font-medium text-foreground flex-1">{passwordSet ? "Password updated" : "Using temporary password — change it in settings"}</p>
          {passwordSet && <CheckCircle2 className="w-4 h-4 text-green-400" />}
        </div>
      </div>
      <Button onClick={onComplete} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 font-semibold py-5" data-testid="button-complete-invitee-onboarding">
        {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Finishing...</> : <><Rocket className="w-4 h-4 mr-2" />Enter Mission Control</>}
      </Button>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────

export function OnboardingModal({ username, role, onComplete }: OnboardingProps) {
  const { toast } = useToast();
  const isAdmin = role === "admin";

  // Admin flow state
  const [adminStep, setAdminStep] = useState(0);
  const [serverData, setServerData] = useState<any>(null);
  const [inviteData, setInviteData] = useState<any[]>([]);

  // Invitee flow state
  const [inviteeStep, setInviteeStep] = useState(0);
  const [passwordData, setPasswordData] = useState<any>(null);

  const [completing, setCompleting] = useState(false);

  const handleAdminComplete = async () => {
    setCompleting(true);
    if (serverData) {
      try {
        await apiRequest("POST", "/api/servers", {
          ...serverData,
          port: parseInt(serverData.port),
          maxPlayers: parseInt(serverData.maxPlayers || "20"),
        });
        queryClient.invalidateQueries({ queryKey: ["/api/servers"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      } catch { /* silent */ }
    }
    if (inviteData?.length) {
      for (const inv of inviteData) {
        if (!inv.username.trim() || !inv.email.trim()) continue;
        try {
          await apiRequest("POST", "/api/users", {
            username: inv.username.trim(),
            email: inv.email.trim(),
            password: "ChangeMe123!",
            role: inv.role,
          });
        } catch { /* silent */ }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    }
    setCompleting(false);
    onComplete();
  };

  const handleInviteeComplete = async () => {
    setCompleting(true);
    if (passwordData?.password) {
      try {
        const me = await (await apiRequest("GET", "/api/auth/me")).json();
        await apiRequest("POST", "/api/auth/change-password", {
          currentPassword: "ChangeMe123!",
          newPassword: passwordData.password,
        });
        queryClient.setQueryData(["/api/auth/me"], { ...me, requiresPasswordChange: false });
        toast({ title: "Password updated" });
      } catch { /* silent */ }
    }
    setCompleting(false);
    onComplete();
  };

  const steps = isAdmin ? ADMIN_STEPS : INVITEE_STEPS;
  const currentStep = isAdmin ? adminStep : inviteeStep;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-4 starfield">
      {/* Background nebula */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
           style={{ background: "hsl(258 80% 65%)" }} />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-[0.05] pointer-events-none"
           style={{ background: "hsl(200 90% 55%)" }} />

      <div className="relative w-full max-w-md">
        <Card className="bg-card/90 backdrop-blur-sm border-border shadow-2xl">
          <CardContent className="p-7">
            <StepIndicator current={currentStep} steps={steps} />
            <div className="min-h-[340px] flex flex-col justify-between">

              {/* Admin flow */}
              {isAdmin && adminStep === 0 && <AdminWelcomeStep username={username} onNext={() => setAdminStep(1)} />}
              {isAdmin && adminStep === 1 && <AdminServerStep onNext={(d) => { setServerData(d); setAdminStep(2); }} onBack={() => setAdminStep(0)} />}
              {isAdmin && adminStep === 2 && <AdminInviteStep onNext={(d) => { setInviteData(d || []); setAdminStep(3); }} onBack={() => setAdminStep(1)} />}
              {isAdmin && adminStep === 3 && (
                <AdminDoneStep
                  serverData={serverData}
                  inviteCount={(inviteData || []).filter((i: any) => i.username && i.email).length}
                  onComplete={handleAdminComplete}
                  isLoading={completing}
                />
              )}

              {/* Invitee flow */}
              {!isAdmin && inviteeStep === 0 && <InviteeWelcomeStep username={username} role={role} onNext={() => setInviteeStep(1)} />}
              {!isAdmin && inviteeStep === 1 && <InviteePasswordStep username={username} onNext={(d) => { setPasswordData(d); setInviteeStep(2); }} onBack={() => setInviteeStep(0)} />}
              {!isAdmin && inviteeStep === 2 && <InviteeDoneStep passwordSet={!!passwordData?.password} onComplete={handleInviteeComplete} isLoading={completing} />}
            </div>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground/50 mt-3">
          Step {currentStep + 1} of {steps.length} — {steps[currentStep].label}
        </p>
      </div>
    </div>
  );
}
