import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Tiny star component rendered as CSS blobs
function Stars() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: Math.sin(i * 137.5) * 50 + 50,
    y: Math.cos(i * 97.3) * 50 + 50,
    size: ((i * 7 + 1) % 3) + 1,
    opacity: 0.1 + ((i * 13) % 5) * 0.1,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}
      {/* Nebula blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-[0.06]"
           style={{ background: "hsl(258 80% 65%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.04]"
           style={{ background: "hsl(200 90% 55%)" }} />
    </div>
  );
}

// OrbitMC wordmark SVG
function OrbitLogo({ size = 48 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      aria-label="OrbitMC Logo"
    >
      {/* Planet */}
      <circle cx="32" cy="32" r="14" fill="hsl(258 80% 65% / 0.2)" stroke="hsl(258 80% 65%)" strokeWidth="1.5" />
      {/* Orbit ring */}
      <ellipse cx="32" cy="32" rx="28" ry="10" stroke="hsl(258 80% 65% / 0.5)" strokeWidth="1.5"
               fill="none" strokeDasharray="4 3" transform="rotate(-20 32 32)" />
      {/* Moon */}
      <circle cx="56" cy="26" r="4" fill="hsl(220 15% 70%)" />
      {/* MC pixel cross on planet */}
      <rect x="27" y="29" width="3" height="3" fill="hsl(258 80% 65%)" />
      <rect x="30" y="26" width="3" height="3" fill="hsl(258 80% 65%)" />
      <rect x="33" y="29" width="3" height="3" fill="hsl(258 80% 65%)" />
      <rect x="30" y="32" width="3" height="3" fill="hsl(258 80% 65%)" />
    </svg>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [needsOtp, setNeedsOtp] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const { toast } = useToast();

  const { data: setupStatus, isLoading: setupLoading } = useQuery({
    queryKey: ["/api/setup/status"],
    queryFn: async () => {
      const res = await fetch("/api/setup/status");
      if (!res.ok) throw new Error("Failed to load setup status");
      return res.json() as Promise<{ initialized: boolean }>;
    },
    retry: false,
    staleTime: 60000,
  });

  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string; otp?: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", creds);
      return res.json();
    },
    onSuccess: (user) => {
      if (user.requiresTwoFactor) {
        setNeedsOtp(true);
        toast({ title: "Authentication code required", description: "Enter the 6-digit code from your authenticator app." });
        return;
      }
      queryClient.setQueryData(["/api/auth/me"], user);
    },
    onError: (e: Error) => {
      setOtp("");
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: { username: string; email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/setup/initialize", data);
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
    onError: (e: Error) => {
      toast({ title: "Setup failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password, otp: needsOtp ? otp : undefined });
  };

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupForm.username || !setupForm.email || !setupForm.password) return;
    if (setupForm.password !== setupForm.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setupMutation.mutate({
      username: setupForm.username.trim(),
      email: setupForm.email.trim(),
      password: setupForm.password,
    });
  };

  if (setupLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden starfield">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const initialized = !!setupStatus?.initialized;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden starfield">
      <Stars />

      <div className="relative z-10 w-full max-w-sm px-5">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 select-none">
          <div className="mb-4 nebula-glow rounded-full p-1">
            <OrbitLogo size={64} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">OrbitMC</h1>
          <p className="text-sm text-muted-foreground mt-1">Minecraft Server Control Panel</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-sm border-border shadow-2xl">
          <CardContent className="p-6">
            {initialized ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-foreground/80">Username or email</Label>
                  <Input
                    id="username"
                    data-testid="input-username"
                    placeholder="marsphobos"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    autoComplete="username"
                    disabled={loginMutation.isPending || needsOtp}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-foreground/80">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    data-testid="input-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loginMutation.isPending || needsOtp}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                {needsOtp && (
                  <div className="space-y-2">
                    <Label className="text-foreground/80">Authentication code</Label>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup className="w-full justify-center">
                        {Array.from({ length: 6 }, (_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-xs text-muted-foreground text-center">
                      Enter the 6-digit code from your authenticator app.
                    </p>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  data-testid="button-login"
                  disabled={loginMutation.isPending || !username || !password || (needsOtp && otp.length !== 6)}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entering orbit...</>
                  ) : needsOtp ? "Verify and Launch" : "Launch Panel"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold text-foreground">Initialize OrbitMC</h2>
                  <p className="text-sm text-muted-foreground">
                    Create the first administrator account. This replaces the old hardcoded default login.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-username" className="text-foreground/80">Admin username</Label>
                  <Input
                    id="setup-username"
                    value={setupForm.username}
                    onChange={e => setSetupForm(f => ({ ...f, username: e.target.value }))}
                    disabled={setupMutation.isPending}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-email" className="text-foreground/80">Email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    value={setupForm.email}
                    onChange={e => setSetupForm(f => ({ ...f, email: e.target.value }))}
                    disabled={setupMutation.isPending}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-password" className="text-foreground/80">Password</Label>
                  <Input
                    id="setup-password"
                    type="password"
                    value={setupForm.password}
                    onChange={e => setSetupForm(f => ({ ...f, password: e.target.value }))}
                    disabled={setupMutation.isPending}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="setup-confirm-password" className="text-foreground/80">Confirm password</Label>
                  <Input
                    id="setup-confirm-password"
                    type="password"
                    value={setupForm.confirmPassword}
                    onChange={e => setSetupForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    disabled={setupMutation.isPending}
                    className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  disabled={setupMutation.isPending || !setupForm.username || !setupForm.email || !setupForm.password || !setupForm.confirmPassword}
                >
                  {setupMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Initializing...</>
                  ) : "Create Admin Account"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          <a href="https://www.perplexity.ai/computer" target="_blank" rel="noopener noreferrer"
             className="hover:text-muted-foreground transition-colors">
            Created with Perplexity Computer
          </a>
        </p>
      </div>
    </div>
  );
}
