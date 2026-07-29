import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate, useRouter } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, FileText, Calendar, Sparkles, User, Compass, MessageSquare, BookOpen, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applications", label: "Applications", icon: FileText },
  { to: "/deadlines", label: "Deadlines", icon: Calendar },
  { to: "/sop", label: "SOPs", icon: Sparkles },
  { to: "/programs", label: "Programs", icon: Compass },
  { to: "/chat", label: "AI Chat", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/research", label: "Research", icon: BookOpen },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-lg bg-primary/15 grid place-items-center"><GraduationCap className="size-4 text-primary" /></div>
            <span className="font-display text-lg"><span className="text-foreground">GradMatch</span> <span className="text-primary">AI</span></span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => {
              const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors", active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>
                  <Icon className="size-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={signOut} className="hidden lg:inline-flex" title="Sign out"><LogOut className="size-4" /></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden border-t border-border bg-background">
            <nav className="px-2 py-2 grid grid-cols-2 gap-1">
              {NAV.map((item) => {
                const active = loc.pathname === item.to || loc.pathname.startsWith(item.to + "/");
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-sm", active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent")}>
                    <Icon className="size-4" /> {item.label}
                  </Link>
                );
              })}
              <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-accent">
                <LogOut className="size-4" /> Sign out
              </button>
            </nav>
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">{children}</main>
    </div>
  );
}
