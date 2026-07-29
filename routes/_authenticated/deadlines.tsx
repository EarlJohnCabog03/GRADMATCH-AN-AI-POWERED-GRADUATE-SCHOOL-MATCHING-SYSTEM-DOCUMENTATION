import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listDeadlines, createDeadline, toggleDeadline, deleteDeadline } from "@/lib/applications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar as CalIcon, Download, Trash2, Loader2 } from "lucide-react";
import { format, parseISO, differenceInCalendarDays, addDays } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/deadlines")({
  head: () => ({ meta: [{ title: "Deadlines · GradMatch AI" }] }),
  component: DeadlinesPage,
});

type Item = { id: string; title: string; due: string; category?: string | null; completed?: boolean; source: "app" | "custom" };

function DeadlinesPage() {
  const listFn = useServerFn(listDeadlines);
  const createFn = useServerFn(createDeadline);
  const toggleFn = useServerFn(toggleDeadline);
  const delFn = useServerFn(deleteDeadline);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["deadlines"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);
  const [horizon, setHorizon] = useState(60);

  const items: Item[] = [
    ...(q.data?.applications ?? []).map((a) => ({ id: `a-${a.id}`, title: `${a.school} — ${a.program}`, due: a.deadline as string, category: "Application", source: "app" as const })),
    ...(q.data?.custom ?? []).map((d) => ({ id: `d-${d.id}`, title: d.title, due: d.due_date, category: d.category, completed: d.completed, source: "custom" as const })),
  ].filter((d) => d.due);
  const today = new Date();
  const horizonDate = addDays(today, horizon);
  const upcoming = items.filter((d) => parseISO(d.due) <= horizonDate && (d.source === "app" || !d.completed)).sort((a, b) => a.due.localeCompare(b.due));
  const past = items.filter((d) => parseISO(d.due) < today && (d.source === "custom" && d.completed)).sort((a, b) => b.due.localeCompare(a.due));

  function exportICS() {
    const ics = [
      "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//GradMatch AI//EN",
      ...upcoming.flatMap((d) => {
        const date = d.due.replace(/-/g, "");
        return ["BEGIN:VEVENT", `UID:${d.id}@gradmatch.ai`, `DTSTART;VALUE=DATE:${date}`, `DTEND;VALUE=DATE:${date}`, `SUMMARY:${d.title}`, `DESCRIPTION:${d.category ?? ""}`, "END:VEVENT"];
      }),
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "gradmatch-deadlines.ics"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Deadlines</h1>
          <p className="text-muted-foreground mt-1">Application due dates and your custom tasks, all in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="border border-input bg-background rounded-md px-3 py-2 text-sm" value={horizon} onChange={(e) => setHorizon(Number(e.target.value))}>
            <option value={30}>Next 30 days</option><option value={60}>Next 60 days</option><option value={90}>Next 90 days</option><option value={365}>Next 12 months</option>
          </select>
          <Button variant="outline" onClick={exportICS}><Download className="size-4 mr-1.5" /> Export .ics</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> Add deadline</Button></DialogTrigger>
            <DeadlineDialog onSubmit={async (v) => {
              try { await createFn({ data: v }); qc.invalidateQueries({ queryKey: ["deadlines"] }); toast.success("Added"); setOpen(false); }
              catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
            }} />
          </Dialog>
        </div>
      </div>

      {q.isLoading ? <div className="flex items-center justify-center min-h-[30vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> : (
        <>
          <Card className="p-5">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><CalIcon className="size-4 text-primary" /> Upcoming</h2>
            {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nothing in the next {horizon} days.</p> : (
              <ul className="space-y-2">
                {upcoming.map((d) => {
                  const days = differenceInCalendarDays(parseISO(d.due), today);
                  return (
                    <li key={d.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2">
                      {d.source === "custom" && (
                        <Checkbox checked={!!d.completed} onCheckedChange={(c) => { toggleFn({ data: { id: d.id.replace("d-", ""), completed: !!c } }).then(() => qc.invalidateQueries({ queryKey: ["deadlines"] })); }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground">{format(parseISO(d.due), "EEE, MMM d, yyyy")}{d.category ? ` · ${d.category}` : ""}</p>
                      </div>
                      <span className={`text-xs font-medium ${days < 7 ? "text-destructive" : days < 30 ? "text-primary" : "text-muted-foreground"}`}>
                        {days < 0 ? "overdue" : days === 0 ? "today" : `${days}d`}
                      </span>
                      {d.source === "custom" && (
                        <Button variant="ghost" size="icon" onClick={() => { delFn({ data: { id: d.id.replace("d-","") } }).then(() => qc.invalidateQueries({ queryKey: ["deadlines"] })); }}><Trash2 className="size-4 text-destructive" /></Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          {past.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold mb-3 text-muted-foreground">Completed</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {past.map((d) => <li key={d.id} className="line-through">{d.title} — {format(parseISO(d.due), "MMM d")}</li>)}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function DeadlineDialog({ onSubmit }: { onSubmit: (v: { title: string; due_date: string; category: string | null; notes: string | null }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Add deadline</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        if (!title || !due) { toast.error("Title and date required"); return; }
        setBusy(true);
        try { await onSubmit({ title, due_date: due, category: category || null, notes: notes || null }); }
        finally { setBusy(false); }
      }}>
        <div className="space-y-1.5"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="GRE test date" required /></div>
        <div className="space-y-1.5"><Label>Due date *</Label><Input type="date" value={due} onChange={(e) => setDue(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Tests, Recommenders, Documents..." /></div>
        <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}Add</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
