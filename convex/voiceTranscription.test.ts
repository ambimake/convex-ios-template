/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "./_generated/api";
import { MAX_VOICE_AUDIO_BYTES } from "./lib/voiceTranscription";
import publicActions from "../tests/fixtures/public-actions.json";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const identity = {
  issuer: "test",
  subject: "user-1",
  tokenIdentifier: "test|user-1",
};

describe("starter voice transcription", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the raw audio cap below Convex's base64 string payload limit", () => {
    const maxEncodedLength = 4 * Math.ceil(MAX_VOICE_AUDIO_BYTES / 3);

    expect(maxEncodedLength).toBeLessThan(1_000_000);
  });

  it("returns the Swift-facing transcript field from the public voice action", async () => {
    const contract = publicActions.actions["commands:transcribeVoiceCommand"];
    vi.stubGlobal("process", { env: { GROQ_API_KEY: "test-groq-key" } });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ text: "Create a note saying voice result" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })),
    );

    const t = convexTest(schema, modules).withIdentity(identity);

    const response = await t.action(api.commands.transcribeVoiceCommand, contract.request);

    expect(response).toEqual(contract.success);
  });

  it("returns the shared configuration-missing union when Groq is not configured", async () => {
    vi.stubGlobal("process", { env: {} });
    vi.stubGlobal("fetch", vi.fn());
    const t = convexTest(schema, modules).withIdentity(identity);
    const contract = publicActions.actions["commands:transcribeVoiceCommand"];

    const response = await t.action(api.commands.transcribeVoiceCommand, contract.request);

    expect(response).toEqual(contract.configurationMissing);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects audio payloads over the configured raw byte cap", async () => {
    const t = convexTest(schema, modules).withIdentity(identity);
    const tooLarge = "a".repeat(4 * Math.ceil((MAX_VOICE_AUDIO_BYTES + 1) / 3));

    await expect(
      t.action(api.commands.transcribeVoiceCommand, {
        audioBase64: tooLarge,
        mimeType: "audio/m4a",
      }),
    ).rejects.toThrow("VOICE_AUDIO_TOO_LARGE");
  });
});
