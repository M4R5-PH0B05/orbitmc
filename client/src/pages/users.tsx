import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Trash2, Edit3, Search, Loader2, Shield, ShieldCheck, Eye, KeyRound, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

const ROLES = ["admin", "operator", "viewer"];

const roleConfig: Record<string, { label: string; icon: any; cls: string }> = {
  admin: { label: "Admin", icon: ShieldCheck, cls: "bg-red-500/10 text-red-400 border-red-500/30" },
  operator: { label: "Operator", icon: Shield, cls: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  viewer: { label: "Viewer", icon: Eye, cls: "bg-secondary text-muted-foreground border-border" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [disableTwoFactorOpen, setDisableTwoFactorOpen] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", role: "viewer" });
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "viewer", password: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [disableTwoFactorForm, setDisableTwoFactorForm] = useState({ password: "", token: "" });
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/auth/me"); return r.json(); },
    staleTime: 60000,
  });

  const { data: twoFactorSetup, refetch: refetchTwoFactorSetup, isFetching: loadingTwoFactorSetup } = useQuery({
    queryKey: ["/api/auth/2fa/setup"],
    queryFn: async () => {
      const r = await apiRequest("GET", "/api/auth/2fa/setup");
      return r.json() as Promise<{ secret: string; otpAuthUrl: string; issuer: string }>;
    },
    enabled: false,
  });

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => { const r = await apiRequest("GET", "/api/users"); return r.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const r = await apiRequest("POST", "/api/users", data);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCreateOpen(false);
      setForm({ username: "", email: "", password: "", role: "viewer" });
      toast({ title: "User created" });
    },
    onError: (e: Error) => toast({ title: "Failed to create user", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof editForm> }) => {
      const payload: any = { ...data };
      if (!payload.password) delete payload.password;
      const r = await apiRequest("PATCH", `/api/users/${id}`, payload);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setEditUser(null);
      toast({ title: "User updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to update user", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await apiRequest("DELETE", `/api/users/${id}`);
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({ title: "User deleted" });
    },
    onError: (e: Error) => toast({ title: "Failed to delete user", description: e.message, variant: "destructive" }),
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/change-password", passwordForm);
      return r.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setPasswordOpen(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast({ title: "Password updated" });
    },
    onError: (e: Error) => toast({ title: "Failed to update password", description: e.message, variant: "destructive" }),
  });

  const enableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      if (!twoFactorSetup) throw new Error("No setup secret available");
      const r = await apiRequest("POST", "/api/auth/2fa/enable", {
        secret: twoFactorSetup.secret,
        token: twoFactorCode,
      });
      return r.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setTwoFactorCode("");
      setTwoFactorOpen(false);
      toast({ title: "Two-factor authentication enabled" });
    },
    onError: (e: Error) => toast({ title: "Failed to enable 2FA", description: e.message, variant: "destructive" }),
  });

  const disableTwoFactorMutation = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/auth/2fa/disable", disableTwoFactorForm);
      return r.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setDisableTwoFactorOpen(false);
      setDisableTwoFactorForm({ password: "", token: "" });
      toast({ title: "Two-factor authentication disabled" });
    },
    onError: (e: Error) => toast({ title: "Failed to disable 2FA", description: e.message, variant: "destructive" }),
  });

  const filtered = users?.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditForm({ username: user.username, email: user.email, role: user.role, password: "" });
  };

  const passwordMismatch = passwordForm.newPassword !== passwordForm.confirmPassword;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">Manage panel access for your team</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} data-testid="button-create-user">
          <Plus className="w-4 h-4 mr-1.5" />Add User
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Account security</p>
            <p className="text-xs text-muted-foreground">
              Change your password and manage two-factor authentication for this panel account.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setPasswordOpen(true)}>
              <KeyRound className="w-4 h-4 mr-1.5" />Change Password
            </Button>
            {currentUser?.twoFactorEnabled ? (
              <Button size="sm" variant="outline" onClick={() => {
                setDisableTwoFactorForm({ password: "", token: "" });
                setDisableTwoFactorOpen(true);
              }}>
                <Smartphone className="w-4 h-4 mr-1.5" />2FA Enabled
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={async () => {
                  await refetchTwoFactorSetup();
                  setTwoFactorOpen(true);
                }}
                disabled={loadingTwoFactorSetup}
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-users"
        />
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {ROLES.map(role => {
          const cfg = roleConfig[role];
          const RoleIcon = cfg.icon;
          return (
            <div key={role} className="flex items-center gap-1.5">
              <Badge variant="outline" className={`text-xs h-5 ${cfg.cls}`}>
                <RoleIcon className="w-3 h-3 mr-1" />{cfg.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {role === "admin" ? "Full control" : role === "operator" ? "Start/stop servers, edit files" : "View only"}
              </span>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border">
          <CardContent className="p-12 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const cfg = roleConfig[user.role] || roleConfig.viewer;
            const RoleIcon = cfg.icon;
            const isSelf = user.id === currentUser?.id;
            return (
              <Card key={user.id} className="border-border bg-card" data-testid={`card-user-${user.id}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="w-9 h-9 flex-shrink-0">
                    <AvatarFallback className={`text-sm ${cfg.cls}`}>
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{user.username}</p>
                      {isSelf && <Badge variant="outline" className="text-xs h-4 border-primary/30 text-primary bg-primary/10">you</Badge>}
                      <Badge variant="outline" className={`text-xs h-5 ${cfg.cls}`}>
                        <RoleIcon className="w-3 h-3 mr-1" />{cfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground"
                      onClick={() => openEdit(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    {!isSelf && (
                      <Button
                        size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-destructive"
                        onClick={() => { if (confirm(`Delete user ${user.username}?`)) deleteMutation.mutate(user.id); }}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="steveminecraft" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} data-testid="input-new-username" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="steve@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-new-email" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} data-testid="input-new-password" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.username || !form.email || !form.password}
              data-testid="button-confirm-create-user"
            >
              {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))} />
              {passwordMismatch && <p className="text-xs text-destructive">Passwords do not match.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancel</Button>
            <Button
              onClick={() => changePasswordMutation.mutate()}
              disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword.length < 8 || passwordMismatch}
            >
              {changePasswordMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Add the manual key below to your authenticator app, then enter the current 6-digit code to enable 2FA.
            </p>
            <div className="space-y-1.5">
              <Label>Manual setup key</Label>
              <Textarea readOnly value={twoFactorSetup?.secret || ""} className="min-h-20 font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>Authentication code</Label>
              <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
                <InputOTPGroup className="w-full justify-center">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFactorOpen(false)}>Cancel</Button>
            <Button onClick={() => enableTwoFactorMutation.mutate()} disabled={enableTwoFactorMutation.isPending || twoFactorCode.length !== 6}>
              {enableTwoFactorMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enabling...</> : "Enable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disableTwoFactorOpen} onOpenChange={(open) => {
        setDisableTwoFactorOpen(open);
        if (!open) setDisableTwoFactorForm({ password: "", token: "" });
      }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Current Password</Label>
              <Input type="password" value={disableTwoFactorForm.password} onChange={e => setDisableTwoFactorForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Authentication code</Label>
              <InputOTP maxLength={6} value={disableTwoFactorForm.token} onChange={value => setDisableTwoFactorForm(f => ({ ...f, token: value }))}>
                <InputOTPGroup className="w-full justify-center">
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot key={index} index={index} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDisableTwoFactorOpen(false);
              setDisableTwoFactorForm({ password: "", token: "" });
            }}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => disableTwoFactorMutation.mutate()}
              disabled={disableTwoFactorMutation.isPending || !disableTwoFactorForm.password || disableTwoFactorForm.token.length !== 6}
            >
              {disableTwoFactorMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Disabling...</> : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={open => !open && setEditUser(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit User: {editUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} data-testid="input-edit-username" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} data-testid="input-edit-email" />
            </div>
            <div className="space-y-1.5">
              <Label>New Password (leave blank to keep)</Label>
              <Input type="password" placeholder="••••••••" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancel</Button>
            <Button
              onClick={() => editUser && updateMutation.mutate({ id: editUser.id, data: editForm })}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-edit-user"
            >
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
