import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { lovableChat } from "@/lib/ai-gateway.server";

export const listSops = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("sop_documents").select("*").order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const [doc, versions] = await Promise.all([
      context.supabase.from("sop_documents").select("*").eq("id", data.id).single(),
      context.supabase.from("sop_versions").select("id,label,created_at").eq("document_id", data.id).order("created_at", { ascending: false }),
    ]);
    if (doc.error) throw new Error(doc.error.message);
    return { doc: doc.data, versions: versions.data ?? [] };
  });

export const createSop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().min(1).max(160), target_school: z.string().max(160).optional(), target_program: z.string().max(160).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("sop_documents").insert({ ...data, user_id: context.userId, body: "" }).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const saveSop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), title: z.string().min(1).max(160), target_school: z.string().max(160).optional().nullable(), target_program: z.string().max(160).optional().nullable(), body: z.string().max(40000) }).parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("sop_documents").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const snapshotSop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), label: z.string().max(120).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: doc } = await context.supabase.from("sop_documents").select("body").eq("id", data.id).single();
    if (!doc) throw new Error("SOP not found");
    const { error } = await context.supabase.from("sop_versions").insert({ document_id: data.id, user_id: context.userId, body: doc.body, label: data.label || null });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const restoreSopVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ version_id: z.string().uuid(), document_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: v, error: ve } = await context.supabase.from("sop_versions").select("body").eq("id", data.version_id).single();
    if (ve) throw new Error(ve.message);
    const { error } = await context.supabase.from("sop_documents").update({ body: v.body }).eq("id", data.document_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteSop = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("sop_documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sopFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: doc, error } = await context.supabase.from("sop_documents").select("body,target_school,target_program").eq("id", data.id).single();
    if (error) throw new Error(error.message);
    if (!doc.body || doc.body.length < 50) throw new Error("Write at least a paragraph before requesting feedback.");

    const content = await lovableChat({
      system: "You are an expert graduate admissions reader. Critique Statements of Purpose with brutal honesty but constructive guidance. Return STRICT JSON matching the schema.",
      messages: [{ role: "user", content: `Target school: ${doc.target_school ?? "N/A"}\nTarget program: ${doc.target_program ?? "N/A"}\n\nSOP:\n${doc.body}` }],
      jsonSchema: {
        name: "sop_feedback",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["overall_score","clarity","specificity","fit","grammar","strengths","weaknesses","suggestions"],
          properties: {
            overall_score: { type: "number" },
            clarity: { type: "number" },
            specificity: { type: "number" },
            fit: { type: "number" },
            grammar: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
          },
        },
      },
    });

    type Feedback = { overall_score: number; clarity: number; specificity: number; fit: number; grammar: number; strengths: string[]; weaknesses: string[]; suggestions: string[] };
    let parsed: Feedback;
    try { parsed = JSON.parse(content) as Feedback; } catch { throw new Error("AI returned invalid JSON"); }
    await context.supabase.from("sop_documents").update({ last_feedback: parsed as unknown as never }).eq("id", data.id);
    return parsed;
  });

// Chat for AI Chat tab — single-shot, no persistence
export const askGradmatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    messages: z.array(z.object({ role: z.enum(["user","assistant"]), content: z.string().min(1).max(8000) })).min(1).max(40),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: profile } = await context.supabase.from("profiles").select("full_name,undergrad_major,gpa,field_of_interest,research_interests,degree_goal,gre_verbal,gre_quant,toefl").eq("id", context.userId).maybeSingle();
    const profileBlurb = profile ? `Student profile:\n${JSON.stringify(profile)}` : "Student profile: (incomplete)";
    const content = await lovableChat({
      system: `You are GradMatch AI, an evidence-based graduate-school advisor. Use the student's profile to personalise answers. Be specific, fair, and cite well-known methodologies when relevant. Avoid hallucinating program details.\n\n${profileBlurb}`,
      messages: data.messages,
    });
    return { content };
  });
