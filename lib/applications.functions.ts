import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const appSchema = z.object({
  school: z.string().min(1).max(160),
  program: z.string().min(1).max(160),
  degree: z.string().max(40).optional().nullable(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(["researching","drafting","submitted","interview","accepted","rejected","waitlisted"]),
  priority: z.enum(["reach","target","safety"]),
  fee: z.number().min(0).max(10000).optional().nullable(),
  link: z.string().url().max(500).optional().nullable().or(z.literal("")),
  notes: z.string().max(4000).optional().nullable(),
});

export const listApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("applications").select("*").order("deadline", { ascending: true, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => appSchema.parse(d))
  .handler(async ({ context, data }) => {
    const payload = { ...data, user_id: context.userId, link: data.link || null };
    const { data: row, error } = await context.supabase.from("applications").insert(payload).select("*").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => appSchema.partial().extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { error } = await context.supabase.from("applications").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Deadlines
const deadlineSchema = z.object({
  title: z.string().min(1).max(160),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().max(60).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  completed: z.boolean().optional(),
  application_id: z.string().uuid().optional().nullable(),
});

export const listDeadlines = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [d, a] = await Promise.all([
      context.supabase.from("deadlines").select("*").order("due_date", { ascending: true }),
      context.supabase.from("applications").select("id, school, program, deadline").not("deadline", "is", null),
    ]);
    if (d.error) throw new Error(d.error.message);
    if (a.error) throw new Error(a.error.message);
    return { custom: d.data ?? [], applications: a.data ?? [] };
  });

export const createDeadline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => deadlineSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("deadlines").insert({ ...data, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleDeadline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), completed: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("deadlines").update({ completed: data.completed }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDeadline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("deadlines").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
