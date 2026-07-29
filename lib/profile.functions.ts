import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const profileSchema = z.object({
  full_name: z.string().max(120).nullable().optional(),
  undergrad_institution: z.string().max(160).nullable().optional(),
  undergrad_major: z.string().max(120).nullable().optional(),
  years_experience: z.number().int().min(0).max(50).nullable().optional(),
  publications: z.number().int().min(0).max(500).nullable().optional(),
  gpa: z.number().min(0).max(4).nullable().optional(),
  field_of_interest: z.string().max(200).nullable().optional(),
  research_interests: z.string().max(4000).nullable().optional(),
  statement_of_purpose: z.string().max(8000).nullable().optional(),
  gre_verbal: z.number().int().min(130).max(170).nullable().optional(),
  gre_quant: z.number().int().min(130).max(170).nullable().optional(),
  gre_writing: z.number().min(0).max(6).nullable().optional(),
  toefl: z.number().int().min(0).max(120).nullable().optional(),
  ielts: z.number().min(0).max(9).nullable().optional(),
  degree_goal: z.string().max(40).nullable().optional(),
  target_start: z.string().max(40).nullable().optional(),
  funding_expectation: z.string().max(40).nullable().optional(),
  preferred_locations: z.string().max(300).nullable().optional(),
});

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => profileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").upsert({ id: userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
