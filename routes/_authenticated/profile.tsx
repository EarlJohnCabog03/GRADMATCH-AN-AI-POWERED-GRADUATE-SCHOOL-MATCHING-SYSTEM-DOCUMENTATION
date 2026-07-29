import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, saveProfile, deleteAccount } from "@/lib/profile.functions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Save, Trash2, User, BookOpen, BarChart3, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · GradMatch AI" }] }),
  component: ProfilePage,
});

type Form = {
  full_name: string; undergrad_institution: string; undergrad_major: string;
  years_experience: string; publications: string;
  gpa: string; field_of_interest: string; research_interests: string; statement_of_purpose: string;
  gre_verbal: string; gre_quant: string; gre_writing: string; toefl: string; ielts: string;
  degree_goal: string; target_start: string; funding_expectation: string; preferred_locations: string;
};
const empty: Form = { full_name:"", undergrad_institution:"", undergrad_major:"", years_experience:"", publications:"", gpa:"", field_of_interest:"", research_interests:"", statement_of_purpose:"", gre_verbal:"", gre_quant:"", gre_writing:"", toefl:"", ielts:"", degree_goal:"", target_start:"", funding_expectation:"", preferred_locations:"" };

function ProfilePage() {
  const getFn = useServerFn(getProfile);
  const saveFn = useServerFn(saveProfile);
  const delFn = useServerFn(deleteAccount);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: () => getFn() });
  const [f, setF] = useState<Form>(empty);

  useEffect(() => {
    if (!data) return;
    setF({
      full_name: data.full_name ?? "", undergrad_institution: data.undergrad_institution ?? "", undergrad_major: data.undergrad_major ?? "",
      years_experience: data.years_experience?.toString() ?? "", publications: data.publications?.toString() ?? "",
      gpa: data.gpa?.toString() ?? "", field_of_interest: data.field_of_interest ?? "", research_interests: data.research_interests ?? "", statement_of_purpose: data.statement_of_purpose ?? "",
      gre_verbal: data.gre_verbal?.toString() ?? "", gre_quant: data.gre_quant?.toString() ?? "", gre_writing: data.gre_writing?.toString() ?? "",
      toefl: data.toefl?.toString() ?? "", ielts: data.ielts?.toString() ?? "",
      degree_goal: data.degree_goal ?? "", target_start: data.target_start ?? "", funding_expectation: data.funding_expectation ?? "", preferred_locations: data.preferred_locations ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      const num = (s: string) => s.trim() === "" ? null : Number(s);
      return saveFn({ data: {
        full_name: f.full_name || null,
        undergrad_institution: f.undergrad_institution || null,
        undergrad_major: f.undergrad_major || null,
        years_experience: num(f.years_experience),
        publications: num(f.publications),
        gpa: num(f.gpa),
        field_of_interest: f.field_of_interest || null,
        research_interests: f.research_interests || null,
        statement_of_purpose: f.statement_of_purpose || null,
        gre_verbal: num(f.gre_verbal),
        gre_quant: num(f.gre_quant),
        gre_writing: num(f.gre_writing),
        toefl: num(f.toefl),
        ielts: num(f.ielts),
        degree_goal: f.degree_goal || null,
        target_start: f.target_start || null,
        funding_expectation: f.funding_expectation || null,
        preferred_locations: f.preferred_locations || null,
      }});
    },
    onSuccess: () => { toast.success("Profile saved"); qc.invalidateQueries({ queryKey: ["profile"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  const del = useMutation({
    mutationFn: () => delFn(),
    onSuccess: async () => { await supabase.auth.signOut(); qc.clear(); toast.success("Account deleted"); navigate({ to: "/auth" }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const allFields = Object.values(f);
  const pct = Math.round(allFields.filter((v) => v !== "").length / allFields.length * 100);

  if (isLoading) return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Complete your profile so GradMatch AI can give you better program recommendations.</p>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-sm text-primary font-medium">{pct}% complete</span>
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="personal"><User className="size-4 mr-1.5" />Personal Info</TabsTrigger>
          <TabsTrigger value="academic"><BookOpen className="size-4 mr-1.5" />Academic Background</TabsTrigger>
          <TabsTrigger value="tests"><BarChart3 className="size-4 mr-1.5" />Test Scores</TabsTrigger>
          <TabsTrigger value="goals"><MapPin className="size-4 mr-1.5" />Goals & Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name"><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} placeholder="Jane Smith" /></Field>
              <Field label="Undergraduate Institution"><Input value={f.undergrad_institution} onChange={(e) => setF({ ...f, undergrad_institution: e.target.value })} placeholder="University of..." /></Field>
              <Field label="Undergraduate Major"><Input value={f.undergrad_major} onChange={(e) => setF({ ...f, undergrad_major: e.target.value })} placeholder="Computer Science" /></Field>
              <Field label="Years of Research/Work Experience"><Input type="number" min={0} value={f.years_experience} onChange={(e) => setF({ ...f, years_experience: e.target.value })} placeholder="2" /></Field>
              <Field label="Academic Publications"><Input type="number" min={0} value={f.publications} onChange={(e) => setF({ ...f, publications: e.target.value })} placeholder="0" /></Field>
            </div>
            <Footer save={save} del={del} />
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Academic Background</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Undergraduate GPA (0.0 – 4.0)"><Input type="number" step="0.01" min={0} max={4} value={f.gpa} onChange={(e) => setF({ ...f, gpa: e.target.value })} placeholder="3.75" /></Field>
              <Field label="Field of Interest"><Input value={f.field_of_interest} onChange={(e) => setF({ ...f, field_of_interest: e.target.value })} placeholder="Machine Learning, HCI, Bioinformatics..." /></Field>
            </div>
            <Field label="Research Interests (describe in detail)"><Textarea rows={4} value={f.research_interests} onChange={(e) => setF({ ...f, research_interests: e.target.value })} placeholder="I'm interested in fairness in ML systems, NLP for low-resource languages..." /></Field>
            <Field label="Statement of Purpose (brief)"><Textarea rows={5} value={f.statement_of_purpose} onChange={(e) => setF({ ...f, statement_of_purpose: e.target.value })} placeholder="Briefly describe your academic goals and why you want to pursue graduate study..." /></Field>
            <Footer save={save} del={del} />
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Test Scores</h2>
            <p className="text-sm text-muted-foreground">Leave blank any tests you haven't taken. These help GradMatch assess your eligibility for different programs.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="GRE Verbal (130–170)"><Input type="number" value={f.gre_verbal} onChange={(e) => setF({ ...f, gre_verbal: e.target.value })} placeholder="155" /></Field>
              <Field label="GRE Quantitative (130–170)"><Input type="number" value={f.gre_quant} onChange={(e) => setF({ ...f, gre_quant: e.target.value })} placeholder="162" /></Field>
              <Field label="GRE Writing (0–6)"><Input type="number" step="0.5" value={f.gre_writing} onChange={(e) => setF({ ...f, gre_writing: e.target.value })} placeholder="4.0" /></Field>
              <Field label="TOEFL Score (0–120)"><Input type="number" value={f.toefl} onChange={(e) => setF({ ...f, toefl: e.target.value })} placeholder="105" /></Field>
              <Field label="IELTS Score (0–9)"><Input type="number" step="0.5" value={f.ielts} onChange={(e) => setF({ ...f, ielts: e.target.value })} placeholder="7.5" /></Field>
            </div>
            <Footer save={save} del={del} />
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold">Goals & Preferences</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Degree Goal">
                <Select value={f.degree_goal} onValueChange={(v) => setF({ ...f, degree_goal: v })}>
                  <SelectTrigger><SelectValue placeholder="Select degree type" /></SelectTrigger>
                  <SelectContent>
                    {["MS","PhD","MEng","MBA","MA","MFA"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Target Start">
                <Select value={f.target_start} onValueChange={(v) => setF({ ...f, target_start: v })}>
                  <SelectTrigger><SelectValue placeholder="When do you plan to start?" /></SelectTrigger>
                  <SelectContent>
                    {["Fall 2026","Spring 2027","Fall 2027","Fall 2028"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Funding Expectation">
                <Select value={f.funding_expectation} onValueChange={(v) => setF({ ...f, funding_expectation: v })}>
                  <SelectTrigger><SelectValue placeholder="Select funding preference" /></SelectTrigger>
                  <SelectContent>
                    {["Full funding required","Partial funding ok","Self-funded ok"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Preferred Locations"><Input value={f.preferred_locations} onChange={(e) => setF({ ...f, preferred_locations: e.target.value })} placeholder="Northeast US, California, UK..." /></Field>
            </div>
            <Footer save={save} del={del} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}</div>;
}

function Footer({ save, del }: { save: { mutate: () => void; isPending: boolean }; del: { mutate: () => void; isPending: boolean } }) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-border">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="size-4 mr-1.5" /> Delete Account</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes your profile, applications, deadlines, SOPs, and account login. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => del.mutate()} className="bg-destructive hover:bg-destructive/90">Delete forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Save className="size-4 mr-1.5" />}
        Save Profile
      </Button>
    </div>
  );
}
