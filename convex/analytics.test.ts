/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const identity = {
  issuer: "test",
  subject: "user-1",
  tokenIdentifier: "test|user-1",
};

describe("starter analytics privacy", () => {
  it("omits transcript and entry content from usage event payloads", async () => {
    const t = convexTest(schema, modules).withIdentity(identity);

    await t.action(api.commands.submitCommand, {
      text: "Create a note saying private launch thought",
      source: "typed",
    });

    const events = await t.query(internal.usageEvents.listForOwner, {});
    const serialized = JSON.stringify(events);

    expect(events).toHaveLength(1);
    expect(serialized).not.toContain("Create a note saying private launch thought");
    expect(serialized).not.toContain("private launch thought");
  });
});
