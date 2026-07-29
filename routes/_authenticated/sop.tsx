import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listSops, createSop, deleteSop } from "@/lib/sop.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Sparkles, Trash2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/sop")({
  head: () => ({ meta: [{ title: "SOPs · GradMatch AI" }] }),
  component: SopList,
});

function SopList() {
  const listFn = useServerFn(listSops);
  const createFn = useServerFn(createSop);
  const delFn = useServerFn(deleteSop);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery({ queryKey: ["sops"], queryFn: () => listFn() });
  const [open, setOpen] = useState(false);

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sops"] }); toast.success("Deleted"); },
  });

  const sops = q.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Statements of Purpose</h1>
          <p className="text-muted-foreground mt-1">Draft, version, and get AI feedback on every SOP.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="size-4 mr-1.5" /> New SOP</Button></DialogTrigger>
          <NewSopDialog onCreate={async (v) => {
            try {
              const row = await createFn({ data: v });
              qc.invalidateQueries({ queryKey: ["sops"] });
              setOpen(false);
              navigate({ to: "/sop/$id", params: { id: row.id } });
            } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
          }} />
        </Dialog>
      </div>

      {q.isLoading ? <div className="flex items-center justify-center min-h-[30vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> :
       sops.length === 0 ? (
        <Card className="p-12 text-center">
          <Sparkles className="size-10 text-primary mx-auto mb-4" />
          <h3 className="font-semibold">No SOP drafts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Start one and get instant AI feedback on clarity, specificity, and fit.</p>
          <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="size-4 mr-1.5" />Create your first SOP</Button>
        </Card>
       ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {sops.map((s) => (
            <Card key={s.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to="/sop/$id" params={{ id: s.id }} className="font-semibold hover:underline truncate block">{s.title}</Link>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{[s.target_school, s.target_program].filter(Boolean).join(" · ") || "General SOP"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { if (confirm("Delete this SOP and all versions?")) del.mutate(s.id); }}><Trash2 className="size-4 text-destructive" /></Button>
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-3 flex-1">{s.body ? s.body.slice(0, 240) : "(empty draft)"}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{s.body ? `${s.body.trim().split(/\s+/).filter(Boolean).length} words` : "0 words"}</span>
                <span>Updated {format(parseISO(s.updated_at), "MMM d")}</span>
              </div>
              <Link to="/sop/$id" params={{ id: s.id }} className="mt-3 text-sm text-primary inline-flex items-center gap-1 hover:underline">Open editor <ArrowRight className="size-3" /></Link>
            </Card>
          ))}
        </div>
       )}
    </div>
  );
}

function NewSopDialog({ onCreate }: { onCreate: (v: { title: string; target_school?: string; target_program?: string }) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>New SOP</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (!title) return; setBusy(true); try { await onCreate({ title, target_school: school || undefined, target_program: program || undefined }); } finally { setBusy(false); } }}>
        <div className="space-y-1.5"><Label>Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Stanford CS PhD — SOP" required /></div>
        <div className="space-y-1.5"><Label>Target school</Label><Input value={school} onChange={(e) => setSchool(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Target program</Label><Input value={program} onChange={(e) => setProgram(e.target.value)} /></div>
        <DialogFooter><Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 mr-1.5 animate-spin" />}Create</Button></DialogFooter>
      </form>
    </DialogContent>
  );
}
