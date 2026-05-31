/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const identity = {
  issuer: "test",
  subject: "user-1",
  tokenIdentifier: "test|user-1",
};

describe("starter account lifecycle", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("deletes owner data and runs cleanup hooks without live vendor credentials", async () => {
    const t = convexTest(schema, modules).withIdentity(identity);

    await t.action(api.commands.submitCommand, {
      text: "Create a note saying hello",
      source: "typed",
    });
    await t.action(api.commands.recordAppleSignInAuthorization, {
      clientId: "com.example.voiceagent",
      refreshToken: "test-refresh-token",
    });

    const response = await t.action(api.commands.deleteAccount, {});

    expect(response).toMatchObject({
      status: "deleted",
      deleted: {
        entries: 1,
        commandHistory: 1,
        appleSignInCredentials: 1,
      },
      cleanup: {
        posthog: { status: "skipped" },
        sentry: { status: "skipped" },
      },
    });
    await expect(t.query(api.entries.listEntries, {})).resolves.toEqual([]);
  });

  it("deletes all owner entries, command history, and usage events beyond one query page", async () => {
    const t = convexTest(schema, modules).withIdentity(identity);

    for (let index = 0; index < 105; index += 1) {
      await t.action(api.commands.submitCommand, {
        text: `Create a note saying entry ${index}`,
        source: "typed",
      });
    }

    const response = await t.action(api.commands.deleteAccount, {});

    expect(response).toMatchObject({
      status: "deleted",
      batches: 3,
      deleted: {
        entries: 105,
        commandHistory: 105,
        usageEvents: 105,
      },
    });
    await expect(t.query(api.entries.listEntries, {})).resolves.toEqual([]);
  });

  it("reports Sentry account cleanup without claiming user deletion", async () => {
    vi.stubGlobal("process", {
      env: {
        SENTRY_AUTH_TOKEN: "test-sentry-token",
        SENTRY_ORG_SLUG: "example-org",
        SENTRY_PROJECT_SLUG: "voice-agent",
      },
    });
    const fetchSpy = vi.fn(async () => new Response(null, { status: 202 }));
    vi.stubGlobal("fetch", fetchSpy);

    const t = convexTest(schema, modules).withIdentity(identity);

    const response = await t.action(api.commands.deleteAccount, {});

    expect(response.cleanup.sentry).toEqual({ status: "reported" });
    expect(JSON.stringify(fetchSpy.mock.calls)).not.toContain("delete");
  });

  it("requests PostHog person deletion with the owner key and configured host", async () => {
    vi.stubGlobal("process", {
      env: {
        POSTHOG_HOST: "https://eu.posthog.com/",
        POSTHOG_PROJECT_ID: "12345",
        POSTHOG_PERSONAL_API_KEY: "test-posthog-key",
      },
    });
    const fetchSpy = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchSpy);

    const t = convexTest(schema, modules).withIdentity(identity);

    const response = await t.action(api.commands.deleteAccount, {});

    expect(response.cleanup.posthog).toEqual({ status: "requested" });
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://eu.posthog.com/api/projects/12345/persons/bulk_delete/",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          distinct_ids: [identity.tokenIdentifier],
          delete_events: true,
        }),
      }),
    );
  });
});
