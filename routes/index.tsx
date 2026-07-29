import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
    // Preserve the current path as a `next` query param so the auth page
    // can redirect back after successful sign-in / sign-up.
    const next = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/';
    throw redirect({ to: (`/auth?next=${encodeURIComponent(next)}` as any) });
  },
  component: () => null,
});
