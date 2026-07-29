import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listApplications, createApplication, updateApplication, deleteApplication } from "@/lib/applications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO, differenceInCalendarDays } from "date-fns";

type App = Awaited<ReturnType<typeof listApplications>>[number];

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({ meta: [{ title: "Applications · GradMatch AI" }] }),
  component: AppsPage,
});

const STATUSES = ["researching","drafting","submitted","interview","accepted","rejected","waitlisted"] as const;
const PRIORITIES = ["reach","target","safety"] as const;

const STATUS_STYLE: Record<string,string> = {
  researching: "bg-muted text-muted-foreground",
  drafting: "bg-chart-2/15 text-chart-2",
  submitted: "bg-primary/15 text-primary",
  interview: "bg-chart-4/15 text-chart-4",
  accepted: "bg-primary/20 text-primary",
  rejected: "bg-destructive/15 text-destructive",
  waitlisted: "bg-chart-3/15 text-chart-3",
};

function AppsPage() {
  const listFn = useServerFn(listApplications);
  const createFn = useServerFn(createApplication);
  const updateFn = useServerFn(updateApplication);
  const deleteFn = useServerFn(deleteApplication);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["applications"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<string>("all");
  const [editing, setEditing] = useState<App | null>(null);
  const [open, setOpen] = useState(false);

  const apps = (q.data ?? []).filter((a) => filter === "all" || a.status === filter);

  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["applications"] }); toast.success("Deleted"); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Applications</h1>
          <p className="text-muted-foreground mt-1">{q.data?.length ?? 0} schools on your list.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> Add</Button></DialogTrigger>
            <AppDialog editing={editing} onSubmit={async (vals) => {
              try {
                if (editing) await updateFn({ data: { id: editing.id, ...vals } });
                else await createFn({ data: vals });
                qc.invalidateQueries({ queryKey: ["applications"] });
                qc.invalidateQueries({ queryKey: ["deadlines"] });
                toast.success(editing ? "Updated" : "Added");
                setOpen(false); setEditing(null);
              } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
            }} />
          </Dialog>
        </div>
      </div>

      {q.isLoading ? (
        <div className="flex items-center justify-center min-h-[30vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : apps.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="size-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold">No applications yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add your first school to start tracking.</p>
          <Button className="mt-4" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="size-4 mr-1.5" />Add application</Button>
        </Card>
      ) : (
        <div className="grid gap-3">
          {apps.map((a) => {
            const days = a.deadline ? differenceInCalendarDays(parseISO(a.deadline), new Date()) : null;
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold truncate">{a.school}</h3>
                      <Badge className={STATUS_STYLE[a.status]}>{a.status}</Badge>
                      <Badge variant="outline" className="capitalize">{a.priority}</Badge>
                      {a.degree && <Badge variant="outline">{a.degree}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{a.program}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
                      {a.deadline && (
                        <span className={days! < 7 && days! >= 0 ? "text-destructive font-medium" : ""}>
                          Due {format(parseISO(a.deadline), "MMM d, yyyy")}{days != null && ` (${days < 0 ? "overdue" : days === 0 ? "today" : `${days}d left`})`}
                        </span>
                      )}
                      {a.fee != null && <span>Fee ${Number(a.fee).toFixed(0)}</span>}
                      {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 hover:underline">Portal <ExternalLink className="size-3" /></a>}
                    </div>
                    {a.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(a); setOpen(true); }}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this application?")) del.mutate(a.id); }}><Trash2 className="size-4 text-destructive" /></Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AppDialog({ editing, onSubmit }: { editing: App | null; onSubmit: (v: { school: string; program: string; degree: string | null; deadline: string | null; status: typeof STATUSES[number]; priority: typeof PRIORITIES[number]; fee: number | null; link: string; notes: string | null }) => Promise<void> | void }) {
  const [school, setSchool] = useState(editing?.school ?? "");
  const [program, setProgram] = useState(editing?.program ?? "");
  const [degree, setDegree] = useState(editing?.degree ?? "MS");
  const [deadline, setDeadline] = useState(editing?.deadline ?? "");
  const [status, setStatus] = useState<typeof STATUSES[number]>((editing?.status as typeof STATUSES[number]) ?? "researching");
  const [priority, setPriority] = useState<typeof PRIORITIES[number]>((editing?.priority as typeof PRIORITIES[number]) ?? "target");
  const [fee, setFee] = useState(editing?.fee?.toString() ?? "");
  const [link, setLink] = useState(editing?.link ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{editing ? "Edit application" : "Add application"}</DialogTitle></DialogHeader>
      <form className="grid sm:grid-cols-2 gap-4" onSubmit={async (e) => {
        e.preventDefault();
        if (!school.trim() || !program.trim()) { toast.error("School and program are required"); return; }
        setBusy(true);
        try {
          await onSubmit({ school, program, degree: degree || null, deadline: deadline || null, status, priority, fee: fee ? Number(fee) : null, link: link || "", notes: notes || null });
        } finally { setBusy(false); }
      }}>
        <div className="space-y-1.5 sm:col-span-1"><Label>School *</Label><Input value={school} onChange={(e) => setSchool(e.target.value)} required /></div>
        <div className="space-y-1.5 sm:col-span-1"><Label>Program *</Label><Input value={program} onChange={(e) => setProgram(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Degree</Label>
          <Select value={degree} onValueChange={setDegree}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["MS","PhD","MEng","MBA","MA","MFA"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Deadline</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as typeof STATUSES[number])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Priority</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as typeof PRIORITIES[number])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-1.5"><Label>Fee (USD)</Label><Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="90" /></div>
        <div className="space-y-1.5"><Label>Portal link</Label><Input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></div>
        <div className="sm:col-span-2 space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <DialogFooter className="sm:col-span-2">
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}{editing ? "Save changes" : "Add application"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
