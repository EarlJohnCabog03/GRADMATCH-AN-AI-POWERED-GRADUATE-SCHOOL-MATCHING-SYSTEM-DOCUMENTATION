import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getSop, saveSop, snapshotSop, restoreSopVersion, sopFeedback } from "@/lib/sop.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, History, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export const Route = createFileRoute("/_authenticated/sop/$id")({
  head: () => ({ meta: [{ title: "SOP editor · GradMatch AI" }] }),
  component: SopEditor,
});

type FB = { overall_score: number; clarity: number; specificity: number; fit: number; grammar: number; strengths: string[]; weaknesses: string[]; suggestions: string[] };

function SopEditor() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getSop);
  const saveFn = useServerFn(saveSop);
  const snapFn = useServerFn(snapshotSop);
  const restoreFn = useServerFn(restoreSopVersion);
  const fbFn = useServerFn(sopFeedback);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["sop", id], queryFn: () => getFn({ data: { id } }) });
  const [title, setTitle] = useState("");
  const [school, setSchool] = useState("");
  const [program, setProgram] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!q.data) return;
    setTitle(q.data.doc.title);
    setSchool(q.data.doc.target_school ?? "");
    setProgram(q.data.doc.target_program ?? "");
    setBody(q.data.doc.body ?? "");
  }, [q.data]);

  const wordCount = useMemo(() => body.trim() ? body.trim().split(/\s+/).filter(Boolean).length : 0, [body]);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { id, title, target_school: school || null, target_program: program || null, body } }),
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["sop", id] }); qc.invalidateQueries({ queryKey: ["sops"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });
  const snap = useMutation({
    mutationFn: () => snapFn({ data: { id, label: `${wordCount} words` } }),
    onSuccess: () => { toast.success("Snapshot saved"); qc.invalidateQueries({ queryKey: ["sop", id] }); },
  });
  const restore = useMutation({
    mutationFn: (vid: string) => restoreFn({ data: { version_id: vid, document_id: id } }),
    onSuccess: () => { toast.success("Restored"); qc.invalidateQueries({ queryKey: ["sop", id] }); },
  });
  const fb = useMutation({
    mutationFn: () => fbFn({ data: { id } }) as Promise<FB>,
    onError: (e) => toast.error(e instanceof Error ? e.message : "AI failed"),
  });

  if (q.isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (!q.data) return <div>Not found</div>;

  const feedback = (fb.data ?? q.data.doc.last_feedback) as FB | null;

  return (
    <div className="space-y-6">
      <Link to="/sop" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="size-4" /> Back to SOPs</Link>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 sm:col-span-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Target school</Label><Input value={school} onChange={(e) => setSchool(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Target program</Label><Input value={program} onChange={(e) => setProgram(e.target.value)} /></div>
          </div>
          <Card className="p-0 overflow-hidden">
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={24} className="border-0 rounded-none resize-y min-h-[480px] font-serif text-base" placeholder="Write your statement of purpose..." />
            <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span>Last saved {format(parseISO(q.data.doc.updated_at), "MMM d, HH:mm")}</span>
            </div>
          </Card>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}Save</Button>
            <Button variant="outline" onClick={() => snap.mutate()} disabled={snap.isPending}><History className="size-4 mr-1.5" />Save as version</Button>
            <Button variant="outline" onClick={() => fb.mutate()} disabled={fb.isPending}>{fb.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Sparkles className="size-4 mr-1.5" />}Get AI feedback</Button>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="size-4 text-primary" /> AI feedback</h3>
            {fb.isPending ? <p className="text-sm text-muted-foreground">Reading your draft...</p> :
              !feedback ? <p className="text-sm text-muted-foreground">Click "Get AI feedback" for clarity, specificity, fit, and grammar scores.</p> : (
              <div className="space-y-3 text-sm">
                <div className="text-center">
                  <div className="font-display text-4xl text-primary">{feedback.overall_score}<span className="text-base text-muted-foreground">/10</span></div>
                  <p className="text-xs text-muted-foreground">overall</p>
                </div>
                {(["clarity","specificity","fit","grammar"] as const).map((k) => (
                  <div key={k} className="flex items-center justify-between"><span className="capitalize text-muted-foreground">{k}</span><span className="font-medium">{feedback[k]}/10</span></div>
                ))}
                {feedback.strengths?.length > 0 && <Section title="Strengths" items={feedback.strengths} tone="text-primary" />}
                {feedback.weaknesses?.length > 0 && <Section title="Weaknesses" items={feedback.weaknesses} tone="text-destructive" />}
                {feedback.suggestions?.length > 0 && <Section title="Suggestions" items={feedback.suggestions} tone="text-foreground" />}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><History className="size-4 text-primary" /> Version history</h3>
            {q.data.versions.length === 0 ? <p className="text-xs text-muted-foreground">No snapshots yet.</p> : (
              <ul className="space-y-2 text-sm">
                {q.data.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-2 py-1.5">
                    <div className="min-w-0">
                      <p className="text-xs truncate">{v.label ?? "Snapshot"}</p>
                      <p className="text-[10px] text-muted-foreground">{format(parseISO(v.created_at), "MMM d, HH:mm")}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => { if (confirm("Restore this version? Current text will be overwritten.")) restore.mutate(v.id); }}><RotateCcw className="size-3" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Section({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className={`font-medium text-xs uppercase tracking-wider ${tone}`}>{title}</p>
      <ul className="mt-1 space-y-1 text-xs text-muted-foreground list-disc pl-4">
        {items.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}
