import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, GraduationCap, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research — GradMatch · An AI-Powered Graduate School Matching System" },
      { name: "description", content: "Literature review and methodology behind GradMatch AI: ML-based recommender systems, fairness, and NLP for graduate admissions." },
      { property: "og:title", content: "GradMatch Research" },
      { property: "og:description", content: "AI-powered graduate school matching system — literature review, methodology, and fairness." },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-muted text-foreground py-16 px-4 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 size-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="max-w-5xl mx-auto relative">
          <Link to="/" className="text-sm inline-flex items-center gap-1 text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="size-4" /> Back to App</Link>
          <div className="flex items-center gap-3 mb-6">
            <div className="size-12 rounded-lg bg-primary/15 grid place-items-center"><GraduationCap className="size-5 text-primary" /></div>
            <Badge variant="outline" className="border-primary/40 text-primary uppercase tracking-wider text-xs">Literature Review · April 2026</Badge>
          </div>
          <h1 className="font-display text-6xl sm:text-7xl tracking-tight"><span className="text-foreground">GRAD</span><span className="text-primary">MATCH</span></h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl">An AI-Powered Graduate School Matching System</p>
          <div className="flex flex-wrap gap-2 mt-6">
            {["Machine Learning","Recommender Systems","NLP","EdTech","Fairness & Ethics"].map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">
        <Section num="01" title="Overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold">The Challenge</h3>
              <div className="mt-4 space-y-3">
                <Stat n="4,000+" l="US graduate programs" />
                <Stat n="20,000+" l="global institutions" />
              </div>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold">GradMatch Solution</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {["ML-based program recommendations","Semantic NLP research-interest matching","Real-time application tracking","Explainable AI match rationale","Bidirectional student–institution communication"].map((s) => (
                  <li key={s} className="flex items-start gap-2"><span className="size-1.5 rounded-full bg-primary mt-2" />{s}</li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>

        <Section num="02" title="Five Research Domains">
          <p className="text-sm text-muted-foreground mb-6 max-w-3xl">Foundational pillars of the GradMatch platform — based on 40+ peer-reviewed publications, conference proceedings, and industry reports.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { n: "01", t: "Educational Recommender Systems", c: "text-primary border-primary/40" },
              { n: "02", t: "Machine Learning Methodologies", c: "text-chart-2 border-chart-2/40" },
              { n: "03", t: "Student Information Systems", c: "text-chart-3 border-chart-3/40" },
              { n: "04", t: "UX Design Principles", c: "text-chart-4 border-chart-4/40" },
              { n: "05", t: "Ethical AI Frameworks", c: "text-chart-5 border-chart-5/40" },
            ].map((d) => (
              <Card key={d.n} className={`p-5 border-2 ${d.c}`}>
                <p className="font-display text-3xl">{d.n}</p>
                <p className="font-semibold mt-3 text-sm">{d.t}</p>
                <Badge variant="outline" className={`mt-3 ${d.c}`}>40+</Badge>
              </Card>
            ))}
          </div>
        </Section>

        <Section num="03" title="Recommender System Approaches">
          <div className="grid md:grid-cols-3 gap-3">
            <ApproachCard tag="CF" title="Collaborative Filtering" stat="23%" statSub="precision improvement (GNN-based)" body="Models relationships between students, programs, and faculty using graph neural networks. Overcomes data sparsity via matrix factorization." />
            <ApproachCard tag="CBF" title="Content-Based Filtering" stat="0.72" statSub="precision in validation study" body="Matches student profiles to program attributes using TF-IDF and transformer embeddings. No cold-start problem." />
            <ApproachCard tag="NCF" title="Hybrid Approaches" stat="0.87" statSub="AUC with BERT features" body="Neural collaborative filtering learns feature interactions automatically. Dynamic attention weights context-relevant profile aspects." />
          </div>
          <p className="text-center text-primary text-sm mt-6 font-medium">GradMatch adopts a HYBRID approach leveraging all three paradigms</p>
        </Section>

        <Section num="04" title="ML in Graduate Admissions">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Admissions prediction accuracy (AUC)</p>
              {[
                { l: "Logistic Regression (Early)", auc: 0.71, pct: 71 },
                { l: "Gradient Boosting (2019)", auc: 0.82, pct: 82 },
                { l: "BERT + Structured (2021)", auc: 0.87, pct: 87 },
              ].map((m) => (
                <Card key={m.l} className="p-4">
                  <div className="flex justify-between text-sm"><span className="font-medium">{m.l}</span><span className="text-primary font-semibold">AUC {m.auc}</span></div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${m.pct}%` }} /></div>
                </Card>
              ))}
            </div>
            <div className="space-y-3">
              <ModelCard title="SciBERT" body="Domain-adapted language model for scientific text, powering semantic research-interest matching." />
              <ModelCard title="Sentence Transformers" body="Dense embeddings align student research statements with faculty publication abstracts in shared vector space." />
              <Card className="p-4 bg-primary/10 border-primary/30">
                <p className="font-display text-3xl text-primary">+15%</p>
                <p className="text-sm text-muted-foreground mt-1">predictive variance from NLP features beyond structured data alone</p>
              </Card>
              <Card className="p-4 bg-chart-4/15 border-chart-4/30">
                <div className="flex gap-3">
                  <AlertTriangle className="size-5 text-chart-4 shrink-0" />
                  <p className="text-sm text-chart-4"><strong>Fairness Alert:</strong> Prediction models can encode historical biases — GradMatch implements adversarial debiasing, reweighting, and calibration postprocessing.</p>
                </div>
              </Card>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <span className="font-display text-3xl text-muted-foreground/60">{num}</span>
        <h2 className="font-display text-3xl">{title}</h2>
        <div className="flex-1 h-px bg-border" />
      </div>
      {children}
    </section>
  );
}
function Stat({ n, l }: { n: string; l: string }) { return <div><p className="font-display text-4xl text-primary">{n}</p><p className="text-sm text-muted-foreground">{l}</p></div>; }
function ApproachCard({ tag, title, stat, statSub, body }: { tag: string; title: string; stat: string; statSub: string; body: string }) {
  return <Card className="p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">{tag}</p><h3 className="font-semibold mt-1">{title}</h3><p className="font-display text-4xl text-primary mt-3">{stat}</p><p className="text-xs text-muted-foreground">{statSub}</p><p className="text-sm text-muted-foreground mt-3">{body}</p></Card>;
}
function ModelCard({ title, body }: { title: string; body: string }) {
  return <Card className="p-4"><h4 className="font-semibold text-primary text-sm">{title}</h4><p className="text-xs text-muted-foreground mt-1">{body}</p></Card>;
}
