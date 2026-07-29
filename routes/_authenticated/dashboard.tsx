import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProfile } from "@/lib/profile.functions";
import { listApplications, listDeadlines } from "@/lib/applications.functions";
import { listSops } from "@/lib/sop.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Calendar, Sparkles, Compass, ArrowRight, Target, CheckCircle2, Clock } from "lucide-react";
import { differenceInCalendarDays, parseISO, format } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · GradMatch AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const getProfileFn = useServerFn(getProfile);
  const listAppsFn = useServerFn(listApplications);
  const listDlsFn = useServerFn(listDeadlines);
  const listSopsFn = useServerFn(listSops);

  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });
  const appsQ = useQuery({ queryKey: ["applications"], queryFn: () => listAppsFn() });
  const dlsQ = useQuery({ queryKey: ["deadlines"], queryFn: () => listDlsFn() });
  const sopsQ = useQuery({ queryKey: ["sops"], queryFn: () => listSopsFn() });

  const profile = profileQ.data;
  const apps = appsQ.data ?? [];
  const sops = sopsQ.data ?? [];

  const profileFields = profile ? [
    profile.full_name, profile.undergrad_institution, profile.undergrad_major, profile.gpa,
    profile.field_of_interest, profile.research_interests, profile.degree_goal, profile.target_start,
  ] : [];
  const completed = profileFields.filter((f) => f != null && f !== "").length;
  const profilePct = profile ? Math.round((completed / profileFields.length) * 100) : 0;

  const today = new Date();
  const upcoming = [
    ...(dlsQ.data?.applications ?? []).map((a) => ({ id: `a-${a.id}`, title: `${a.school} — ${a.program}`, due: a.deadline as string })),
    ...(dlsQ.data?.custom ?? []).filter((d) => !d.completed).map((d) => ({ id: `d-${d.id}`, title: d.title, due: d.due_date })),
  ].filter((d) => d.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);

  const statusCount = (s: string) => apps.filter((a) => a.status === s).length;

  if (profilePct < 25) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="size-16 rounded-2xl bg-primary/15 grid place-items-center mx-auto"><Target className="size-7 text-primary" /></div>
          <h1 className="font-display text-3xl mt-6">Set Up Your Profile First</h1>
          <p className="text-muted-foreground mt-3">Add your academic details, test scores, and research interests so GradMatch AI can generate personalized program matches.</p>
          <Button className="mt-6" size="lg" onClick={() => navigate({ to: "/profile" })}>Complete Your Profile <ArrowRight className="size-4 ml-2" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
        <p className="text-muted-foreground mt-1">Here's your application snapshot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<FileText className="size-4" />} label="Applications" value={apps.length} sub={`${statusCount("submitted")} submitted`} to="/applications" />
        <StatCard icon={<Calendar className="size-4" />} label="Upcoming" value={upcoming.length} sub="next 5 deadlines" to="/deadlines" />
        <StatCard icon={<Sparkles className="size-4" />} label="SOP drafts" value={sops.length} sub={sops[0]?.title ?? "—"} to="/sop" />
        <StatCard icon={<Target className="size-4" />} label="Profile" value={`${profilePct}%`} sub="complete" to="/profile" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="size-4 text-primary" /> Upcoming deadlines</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deadlines yet — add one in <Link to="/deadlines" className="underline">Deadlines</Link>.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((d) => {
                const days = differenceInCalendarDays(parseISO(d.due), today);
                return (
                  <li key={d.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(d.due), "MMM d, yyyy")}</p>
                    </div>
                    <span className={`text-xs font-medium ${days < 7 ? "text-destructive" : days < 30 ? "text-primary" : "text-muted-foreground"}`}>
                      {days < 0 ? "overdue" : days === 0 ? "today" : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Application pipeline</h2>
          {apps.length === 0 ? (
            <div className="text-sm text-muted-foreground">No applications yet. <Link to="/applications" className="text-primary underline">Add one</Link> or <Link to="/programs" className="text-primary underline">explore programs</Link>.</div>
          ) : (
            <div className="space-y-3">
              {(["researching","drafting","submitted","interview","accepted","rejected","waitlisted"] as const).map((s) => {
                const n = statusCount(s);
                const pct = apps.length ? (n / apps.length) * 100 : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs mb-1"><span className="capitalize">{s}</span><span className="text-muted-foreground">{n}</span></div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3 flex items-center gap-2"><Compass className="size-4 text-primary" /> Quick actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/applications" label="Add application" />
          <QuickAction to="/sop" label="Draft an SOP" />
          <QuickAction to="/programs" label="Explore programs" />
          <QuickAction to="/chat" label="Ask GradMatch AI" />
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value, sub, to }: { icon: React.ReactNode; label: string; value: string | number; sub: string; to: string }) {
  return (
    <Link to={to} className="block">
      <Card className="p-4 hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between text-muted-foreground text-sm"><span>{label}</span><span className="text-primary">{icon}</span></div>
        <p className="font-display text-3xl mt-1">{value}</p>
        <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>
      </Card>
    </Link>
  );
}

function QuickAction({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="rounded-lg border border-border px-4 py-3 hover:border-primary/40 hover:bg-accent/40 flex items-center justify-between text-sm">
      {label} <ArrowRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
