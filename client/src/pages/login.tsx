import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
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
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (creds: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", creds);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/me"], user);
    },
    onError: (e: Error) => {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    loginMutation.mutate({ username, password });
  };

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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-foreground/80">Username or email</Label>
                <Input
                  id="username"
                  data-testid="input-username"
                  placeholder="admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loginMutation.isPending}
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
                  disabled={loginMutation.isPending}
                  className="bg-secondary/60 border-border focus-visible:ring-primary/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                data-testid="button-login"
                disabled={loginMutation.isPending || !username || !password}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Entering orbit...</>
                ) : "Launch Panel"}
              </Button>
            </form>

            <div className="mt-5 pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                Default credentials: <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground/70">admin</code> / <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground/70">admin123</code>
              </p>
            </div>
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
