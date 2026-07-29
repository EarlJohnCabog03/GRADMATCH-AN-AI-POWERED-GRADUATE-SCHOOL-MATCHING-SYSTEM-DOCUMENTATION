import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/release")({
  head: () => ({
    meta: [
      { title: "Production Release Checklist — GradMatch AI" },
      {
        name: "description",
        content:
          "Versioning, environment settings, and upgrade flow for shipping GradMatch AI to production.",
      },
      { property: "og:title", content: "Production Release Checklist — GradMatch AI" },
      {
        property: "og:description",
        content:
          "Versioning, environment settings, and upgrade flow for shipping GradMatch AI to production.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ReleasePage,
});

type Item = { id: string; label: string; hint?: string };
type Section = { title: string; items: Item[] };

const CHECKLIST: Section[] = [
  {
    title: "1. Versioning",
    items: [
      { id: "semver", label: "Bump version using SemVer (MAJOR.MINOR.PATCH)", hint: "Breaking → MAJOR, feature → MINOR, fix → PATCH" },
      { id: "tag", label: "Create a signed git tag (e.g. v1.4.0) and push" },
      { id: "changelog", label: "Update CHANGELOG.md with user-visible changes" },
      { id: "buildno", label: "Increment Android versionCode / iOS build number" },
      { id: "release-notes", label: "Write Play Store / App Store release notes (≤500 chars)" },
    ],
  },
  {
    title: "2. Environment Settings",
    items: [
      { id: "env-files", label: "Verify .env.production has all required keys", hint: "VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, LOVABLE_API_KEY (server-only)" },
      { id: "no-secrets", label: "Confirm no secrets are bundled into client (no VITE_* secrets)" },
      { id: "feature-flags", label: "Set feature flags to production values" },
      { id: "rls", label: "Review Supabase RLS policies on every table" },
      { id: "cors", label: "Lock down CORS / allowed origins to production domains" },
      { id: "sentry", label: "Error reporting + analytics DSNs point to production project" },
      { id: "rate-limit", label: "Rate-limit AI gateway endpoints (per user / per IP)" },
    ],
  },
  {
    title: "3. Quality Gates",
    items: [
      { id: "build", label: "`bun run build` passes with zero warnings" },
      { id: "lint", label: "Lint + typecheck clean" },
      { id: "smoke", label: "Smoke test: signup → profile → generate matches → chat" },
      { id: "a11y", label: "Lighthouse: Performance ≥ 90, A11y ≥ 95, SEO ≥ 95" },
      { id: "darkmode", label: "Verify light + dark mode on iOS, Android, desktop" },
      { id: "safearea", label: "Safe-area insets render correctly on notched devices" },
      { id: "offline", label: "Graceful offline / network-error states" },
    ],
  },
  {
    title: "4. Store Submission",
    items: [
      { id: "screenshots", label: "Updated screenshots for all required device sizes" },
      { id: "icon", label: "App icon 512×512 + adaptive icon layers" },
      { id: "privacy", label: "Privacy policy URL live and reachable" },
      { id: "data-safety", label: "Play Console Data Safety form matches actual data use" },
      { id: "permissions", label: "Only request permissions actually used at runtime" },
      { id: "signing", label: "App signed with production keystore (backed up offline)" },
    ],
  },
  {
    title: "5. Upgrade Flow",
    items: [
      { id: "staged", label: "Use staged rollout: 10% → 25% → 50% → 100%" },
      { id: "min-version", label: "Set minimum_supported_version in remote config" },
      { id: "force-update", label: "Force-update banner shown when client < minimum_supported_version" },
      { id: "soft-update", label: "Soft-update prompt when a newer optional version exists" },
      { id: "migrations", label: "DB migrations are additive and backward compatible for N-1" },
      { id: "rollback", label: "Documented rollback plan: revert tag + halt rollout in console" },
      { id: "monitor", label: "Monitor crash-free users + error rate for 24h post-release" },
    ],
  },
];

function ReleasePage() {
  const allIds = useMemo(() => CHECKLIST.flatMap((s) => s.items.map((i) => i.id)), []);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [version, setVersion] = useState("1.0.0");
  const [env, setEnv] = useState<"development" | "staging" | "production">("production");
  const [channel, setChannel] = useState<"internal" | "beta" | "production">("beta");
  const [rollout, setRollout] = useState(10);

  const doneCount = allIds.filter((id) => checked[id]).length;
  const pct = Math.round((doneCount / allIds.length) * 100);

  const toggle = (id: string) =>
    setChecked((c) => ({ ...c, [id]: !c[id] }));

  const envBadge =
    env === "production"
      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
      : env === "staging"
      ? "bg-amber-100 text-amber-800 border-amber-300"
      : "bg-slate-100 text-slate-700 border-slate-300";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <Link to="/" className="text-sm text-emerald-700 hover:underline">
              ← Back
            </Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Production Release Checklist
            </h1>
            <p className="text-sm text-slate-600">
              Versioning, environments, and upgrade flow for GradMatch AI.
            </p>
          </div>
          <div className={`rounded-full border px-3 py-1 text-xs font-medium ${envBadge}`}>
            {env.toUpperCase()}
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 pb-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {doneCount} of {allIds.length} complete ({pct}%)
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {/* Release config */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Release Configuration</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Version (SemVer)</span>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Environment</span>
              <select
                value={env}
                onChange={(e) => setEnv(e.target.value as typeof env)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="development">development</option>
                <option value="staging">staging</option>
                <option value="production">production</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Release Channel</span>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as typeof channel)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="internal">internal</option>
                <option value="beta">beta (open testing)</option>
                <option value="production">production</option>
              </select>
            </label>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">Staged rollout</span>
              <span className="text-slate-600">{rollout}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={rollout}
              onChange={(e) => setRollout(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>1%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
          </div>
        </section>

        {/* Checklist */}
        {CHECKLIST.map((section) => {
          const sectionDone = section.items.filter((i) => checked[i.id]).length;
          return (
            <section key={section.title} className="rounded-xl border bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <span className="text-xs text-slate-500">
                  {sectionDone}/{section.items.length}
                </span>
              </div>
              <ul className="space-y-2">
                {section.items.map((item) => {
                  const isOn = !!checked[item.id];
                  return (
                    <li key={item.id}>
                      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-emerald-400 hover:bg-emerald-50/40">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={() => toggle(item.id)}
                          className="mt-0.5 h-4 w-4 accent-emerald-600"
                        />
                        <div className="flex-1">
                          <div
                            className={`text-sm font-medium ${
                              isOn ? "text-slate-400 line-through" : "text-slate-900"
                            }`}
                          >
                            {item.label}
                          </div>
                          {item.hint && (
                            <div className="mt-0.5 text-xs text-slate-500">{item.hint}</div>
                          )}
                        </div>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

        {/* Upgrade flow diagram */}
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Upgrade Flow</h2>
          <ol className="mt-4 space-y-3 text-sm">
            {[
              ["Detect", "On app start, fetch /version.json (or remote config) and compare to bundled version."],
              ["Classify", "If client < minimum_supported_version → force update. Else if client < latest_version → soft update."],
              ["Prompt", "Force = blocking modal with store link. Soft = dismissible banner."],
              ["Migrate", "Run additive DB migrations server-side; keep N-1 schema compatibility."],
              ["Rollout", `Stage at ${rollout}% on the ${channel} channel; monitor crash-free users.`],
              ["Rollback", "If error rate spikes >1%, halt rollout and revert tag; users on bad version are auto-prompted to update to the patched build."],
            ].map(([title, body], i) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium">{title}</div>
                  <div className="text-slate-600">{body}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="rounded-xl border border-dashed border-emerald-400 bg-emerald-50 p-4 text-sm text-emerald-900">
          Ready to ship <strong>v{version}</strong> to <strong>{channel}</strong> at{" "}
          <strong>{rollout}%</strong> rollout in <strong>{env}</strong>.
        </div>
      </main>
    </div>
  );
}
