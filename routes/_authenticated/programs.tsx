import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { PROGRAMS, type Program } from "@/lib/programs-data";
import { getProfile } from "@/lib/profile.functions";
import { createApplication } from "@/lib/applications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, MapPin, Calendar, Plus, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/programs")({
  head: () => ({ meta: [{ title: "Programs · GradMatch AI" }] }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const getProfileFn = useServerFn(getProfile);
  const createAppFn = useServerFn(createApplication);
  const qc = useQueryClient();
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => getProfileFn() });

  const [search, setSearch] = useState("");
  const [degree, setDegree] = useState("all");
  const [country, setCountry] = useState("all");
  const [funding, setFunding] = useState("all");
  const [open, setOpen] = useState<Program | null>(null);

  const countries = useMemo(() => Array.from(new Set(PROGRAMS.map((p) => p.country))).sort(), []);

  const filtered = PROGRAMS.filter((p) => {
    const q = search.toLowerCase();
    if (q && !`${p.school} ${p.program} ${p.field} ${p.keywords.join(" ")}`.toLowerCase().includes(q)) return false;
    if (degree !== "all" && p.degree !== degree) return false;
    if (country !== "all" && p.country !== country) return false;
    if (funding !== "all" && p.funding !== funding) return false;
    return true;
  });

  const scored = filtered.map((p) => ({ p, score: fitScore(p, profileQ.data) })).sort((a, b) => b.score - a.score);

  const add = useMutation({
    mutationFn: (p: Program) => createAppFn({ data: { school: p.school, program: p.program, degree: p.degree, deadline: p.deadline, status: "researching", priority: "target", fee: null, link: "", notes: `Added from Programs · ${p.notes}` } }),
    onSuccess: () => { toast.success("Added to your applications"); qc.invalidateQueries({ queryKey: ["applications"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Program Explorer</h1>
        <p className="text-muted-foreground mt-1">Browse {PROGRAMS.length}+ graduate programs and add them to your application tracker.</p>
      </div>

      <Card className="p-4 grid sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="School, program, field..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={degree} onValueChange={setDegree}><SelectTrigger><SelectValue placeholder="Degree" /></SelectTrigger><SelectContent>
          <SelectItem value="all">All degrees</SelectItem>
          {["MS","PhD","MEng","MBA","MA"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
        </SelectContent></Select>
        <Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger><SelectContent>
          <SelectItem value="all">All countries</SelectItem>
          {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent></Select>
        <Select value={funding} onValueChange={setFunding}><SelectTrigger><SelectValue placeholder="Funding" /></SelectTrigger><SelectContent>
          <SelectItem value="all">Any funding</SelectItem>
          {["Full","Partial","Varies","None"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
        </SelectContent></Select>
      </Card>

      {scored.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No programs match those filters.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scored.map(({ p, score }) => (
            <Card key={p.id} className="p-4 flex flex-col gap-2 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <button onClick={() => setOpen(p)} className="font-semibold hover:underline text-left">{p.school}</button>
                  <p className="text-xs text-muted-foreground">{p.program}</p>
                </div>
                <Badge className="bg-primary/15 text-primary">{score}% fit</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <Badge variant="outline">{p.degree}</Badge>
                <Badge variant="outline">{p.funding}</Badge>
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><MapPin className="size-3" />{p.city}</span>
                <span className="flex items-center gap-1"><Calendar className="size-3" />{format(parseISO(p.deadline), "MMM d")}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(p)}>Details</Button>
                <Button size="sm" className="flex-1" onClick={() => add.mutate(p)}><Plus className="size-3 mr-1" />Add</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        {open && (
          <DialogContent>
            <DialogHeader><DialogTitle>{open.school}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-base">{open.program} · <span className="text-muted-foreground">{open.degree}</span></p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{open.country}</Badge>
                <Badge variant="outline">{open.city}</Badge>
                <Badge variant="outline">Funding: {open.funding}</Badge>
                <Badge variant="outline">GRE {open.greRequired ? "required" : "optional"}</Badge>
              </div>
              <p><span className="text-muted-foreground">Deadline:</span> {format(parseISO(open.deadline), "MMMM d, yyyy")}</p>
              <p className="text-muted-foreground">{open.notes}</p>
              <div className="flex flex-wrap gap-1.5">
                {open.keywords.map((k) => <Badge key={k} variant="secondary">{k}</Badge>)}
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={() => { add.mutate(open); setOpen(null); }}><Plus className="size-4 mr-1.5" />Add to applications</Button>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(open.school + " " + open.program + " admissions")}`} target="_blank" rel="noreferrer">
                  <Button variant="outline"><ExternalLink className="size-4 mr-1.5" />Visit</Button>
                </a>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

type Profile = Awaited<ReturnType<typeof getProfile>>;
function fitScore(p: Program, profile: Profile | undefined): number {
  if (!profile) return 50;
  let score = 50;
  if (profile.degree_goal && p.degree === profile.degree_goal) score += 15;
  if (profile.field_of_interest) {
    const field = profile.field_of_interest.toLowerCase();
    if (`${p.field} ${p.keywords.join(" ")}`.toLowerCase().split(/[,\s]+/).some((w) => w && field.includes(w))) score += 15;
  }
  if (profile.gpa != null && profile.gpa >= 3.7) score += 5;
  if (profile.publications && profile.publications > 0) score += 5;
  if (profile.preferred_locations && p.country && profile.preferred_locations.toLowerCase().includes(p.country.toLowerCase())) score += 10;
  if (profile.funding_expectation === "Full funding required" && p.funding === "Full") score += 5;
  return Math.min(99, Math.max(20, score));
}
