import { v } from "convex/values";
import { internalAction } from "./_generated/server";

const POSTHOG_DELETE_TIMEOUT_MS = 10_000;

export const deletePerson = internalAction({
  args: {
    ownerKey: v.string(),
  },
  handler: async (_ctx, args) => {
    const projectId = env("POSTHOG_PROJECT_ID");
    const apiKey = env("POSTHOG_PERSONAL_API_KEY");
    const host = env("POSTHOG_HOST") ?? "https://app.posthog.com";
    if (!projectId || !apiKey) {
      return { status: "skipped" as const, reason: "missing_config" as const };
    }

    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), POSTHOG_DELETE_TIMEOUT_MS);
    try {
      const response = await fetch(`${host}/api/projects/${projectId}/persons/bulk_delete/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          distinct_ids: [args.ownerKey],
          delete_events: true,
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        throw new Error(`POSTHOG_DELETE_FAILED_${response.status}`);
      }
      return { status: "requested" as const };
    } finally {
      clearTimeout(timeout);
    }
  },
});

function env(name: string): string | undefined {
  const value = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/$/, "") : undefined;
}
