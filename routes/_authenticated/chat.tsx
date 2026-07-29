import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { askGradmatch } from "@/lib/sop.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Send, Loader2, Target, Microscope, BarChart3, Sparkles, Folder, Scale, Landmark, Mic } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  head: () => ({ meta: [{ title: "AI Chat · GradMatch AI" }] }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: Target, color: "text-chart-5", title: "Find my matches", sub: "Ranked program recommendations based on your profile", prompt: "Based on my profile, rank the top 5 graduate programs I should apply to and explain why." },
  { icon: Microscope, color: "text-chart-2", title: "Research fit", sub: "Match your interests to faculty labs", prompt: "Suggest 5 faculty labs that align with my research interests." },
  { icon: BarChart3, color: "text-primary", title: "Admissions odds", sub: "Estimate your chances & improve profile", prompt: "Estimate my admissions odds at top-10 programs in my field and tell me what to improve." },
  { icon: Sparkles, color: "text-chart-4", title: "SOP coach", sub: "Craft your personal statement", prompt: "Help me outline a strong Statement of Purpose tailored to my background." },
  { icon: Folder, color: "text-chart-3", title: "Portfolio strategy", sub: "Build a balanced application list", prompt: "Help me build a balanced reach/target/safety list of 8 schools." },
  { icon: Scale, color: "text-chart-5", title: "Fairness & equity", sub: "How GradMatch avoids bias", prompt: "How does GradMatch avoid bias in recommendations? Explain the fairness methods." },
  { icon: Landmark, color: "text-chart-2", title: "Program deep-dive", sub: "Explore a specific program in depth", prompt: "Deep-dive on the Stanford CS PhD program — culture, faculty strengths, recent admits' profiles." },
  { icon: Mic, color: "text-chart-4", title: "Interview prep", sub: "Practice for grad school interviews", prompt: "Run a 5-question mock interview for a PhD admissions committee." },
];

function ChatPage() {
  const ask = useServerFn(askGradmatch);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const m = useMutation({
    mutationFn: (next: Msg[]) => ask({ data: { messages: next } }),
    onSuccess: (res) => { setMessages((prev) => [...prev, { role: "assistant", content: res.content }]); },
    onError: (e) => { setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e instanceof Error ? e.message : "unknown"}` }]); },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, m.isPending]);
  useEffect(() => { taRef.current?.focus(); }, []);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || m.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    m.mutate(next);
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="size-10 rounded-lg bg-primary/15 grid place-items-center"><GraduationCap className="size-5 text-primary" /></div>
        <div>
          <h1 className="font-display text-xl">GradMatch AI</h1>
          <p className="text-xs text-muted-foreground">AI-powered graduate school matching</p>
        </div>
      </div>

      <div className="flex-1 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center max-w-2xl mx-auto py-8">
            <div className="size-14 rounded-xl bg-primary/15 grid place-items-center mx-auto"><Sparkles className="size-6 text-primary" /></div>
            <h2 className="font-display text-3xl mt-5">Find Your Perfect Program</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Powered by ML-based recommendations and 40+ peer-reviewed publications. Get personalized guidance on admissions, research fit, and more.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
              {SUGGESTIONS.map((s) => (
                <button key={s.title} onClick={() => send(s.prompt)} className="text-left p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/40 transition-colors">
                  <s.icon className={`size-5 ${s.color}`} />
                  <p className="font-semibold mt-3 text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "flex justify-end" : ""}>
              {msg.role === "user" ? (
                <Card className="p-3 bg-primary text-primary-foreground max-w-[80%] whitespace-pre-wrap text-sm">{msg.content}</Card>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed max-w-full">{msg.content}</div>
              )}
            </div>
          ))
        )}
        {m.isPending && <div className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <form className="sticky bottom-2 mt-4" onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="relative">
          <Textarea ref={taRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about programs, research fit, admissions odds..." rows={1}
            className="resize-none pr-14 min-h-[52px] max-h-40 rounded-xl"
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }} />
          <Button type="submit" size="icon" className="absolute right-2 bottom-2 size-9" disabled={m.isPending || !input.trim()}>
            {m.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">GradMatch AI · Based on 40+ peer-reviewed publications · Fairness-first · FERPA & GDPR aware</p>
      </form>
    </div>
  );
}
