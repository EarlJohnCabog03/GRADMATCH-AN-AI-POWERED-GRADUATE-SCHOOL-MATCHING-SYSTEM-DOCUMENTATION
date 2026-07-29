import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in · GradMatch AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') || '/dashboard' : '/dashboard';
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Preserve `next` so the user can be redirected after confirming email
            // Use current host so Supabase email/OAuth redirects work on localhost + deployed domains.
            emailRedirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Account created — you're in!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      navigate({ to: next });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') || '/dashboard' : '/dashboard';
      // 1) Try Supabase hosted OAuth first (preferred when provider is configured).
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth?next=${encodeURIComponent(next)}`,
          },
        } as any);
        if (error) {
          // If provider isn't configured, fall through to other methods.
          const msg = String(
            (error as { message?: string }).message ?? error
          );
          if (
            !msg.toLowerCase().includes('missing oauth secret') &&
            !msg.toLowerCase().includes('unsupported provider')
          ) {
            throw error;
          }
        } else {
          if (data?.url) {
            window.location.href = data.url;
            return;
          }
          navigate({ to: next });
          return;
        }
      } catch (supErr) {
        // Continue to other fallbacks
        console.warn('Supabase hosted OAuth failed, falling back', supErr);
      }

      // 2) Try Google Identity Services (ID token) if a client ID is configured.
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (googleClientId) {
        try {
          await loadGoogleClient();
          const idToken = await requestGoogleIdToken(googleClientId);
          if (idToken) {
            const { data: idData, error: idErr } = await (supabase.auth as any).signInWithIdToken({ provider: 'google', token: idToken });
            if (idErr) throw idErr;
            navigate({ to: next });
            return;
          }
        } catch (gErr) {
          console.warn('GSI sign-in failed, falling back', gErr);
        }
      }

      // 3) Last resort: Lovable OAuth helper (may open broker at /~oauth/initiate).
      try {
        const res = await lovable.auth.signInWithOAuth('google', { redirect_uri: `${window.location.origin}/auth?next=${encodeURIComponent(next)}` });
        const resAny = res as any;
        if (resAny.redirected && resAny.url) {
          window.location.href = resAny.url;
          return;
        }
        if (res.error) throw res.error;
        // lovable integration may set Supabase session directly
        navigate({ to: next });
        return;
      } catch (lovErr) {
        throw lovErr;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  // Load Google Identity Services client script
  function loadGoogleClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No window'));
      const w = window as any;
      if (w.google && w.google.accounts && w.google.accounts.id) return resolve();
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', (e) => reject(new Error('Failed to load Google client')));
        return;
      }
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Google client'));
      document.head.appendChild(s);
    });
  }

  // Request an ID token via Google Identity Services (one-tap/popup). Resolves with a JWT id_token.
  function requestGoogleIdToken(clientId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') return reject(new Error('No window'));
      const w = window as any;
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for Google credential')), 20000);
      let resolved = false;
      function cleanup() {
        clearTimeout(timeout);
        try { w.google?.accounts?.id?.cancel(); } catch (_e) {}
      }
      const callback = (resp: any) => {
        if (resolved) return;
        resolved = true;
        cleanup();
        if (resp && resp.credential) return resolve(resp.credential);
        return reject(new Error('No credential returned'));
      };
      try {
        w.google.accounts.id.initialize({ client_id: clientId, callback });
        // Show prompt/pop-up; user interaction may be required.
        w.google.accounts.id.prompt();
      } catch (e) {
        cleanup();
        return reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="flex items-center justify-center gap-2 mb-8"
        >
          <div className="size-10 rounded-lg bg-primary/15 grid place-items-center">
            <GraduationCap className="size-5 text-primary" />
          </div>
          <span className="font-display text-2xl">
            <span className="text-foreground">GradMatch</span>{" "}
            <span className="text-primary">AI</span>
          </span>
        </Link>
        <Card className="p-6">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as "signin" | "signup")}
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-4">
              <div className="space-y-3">
                <Button className="w-full" onClick={handleGoogle} disabled={loading}>
                  {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Continue with Google
                </Button>
              </div>
              <form onSubmit={handleEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <div className="space-y-3">
                <Button className="w-full" onClick={handleGoogle} disabled={loading}>
                  {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Continue with Google
                </Button>
              </div>
              <form onSubmit={handleEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input
                    id="email-signup"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input
                    id="password-signup"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing you agree to our terms. We never sell your data.
        </p>
      </div>
    </div>
  );
}
