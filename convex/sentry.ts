import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const recordAccountCleanup = internalAction({
  args: {
    ownerKey: v.string(),
  },
  handler: async (_ctx, args) => {
    const authToken = env("SENTRY_AUTH_TOKEN");
    const orgSlug = env("SENTRY_ORG_SLUG");
    const projectSlug = env("SENTRY_PROJECT_SLUG");
    if (!authToken || !orgSlug || !projectSlug) {
      return { status: "skipped" as const, reason: "missing_config" as const };
    }

    const response = await fetch(
      `https://sentry.io/api/0/projects/${orgSlug}/${projectSlug}/user-feedback/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: { id: args.ownerKey },
          category: "account_cleanup",
          comments: "Account deletion completed in app storage. Use this signal for any project-specific Sentry cleanup workflow.",
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`SENTRY_CLEANUP_REPORT_FAILED_${response.status}`);
    }
    return { status: "reported" as const };
  },
});

function env(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
}
