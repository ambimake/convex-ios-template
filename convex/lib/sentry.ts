import type { ActionCtx } from "../_generated/server";
import { requireOwnerKey } from "./auth";

export async function withSentry<T>(
  actionName: string,
  ctx: ActionCtx,
  handler: () => Promise<T>,
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    await captureException(actionName, ctx, error);
    throw error;
  }
}

async function captureException(actionName: string, ctx: ActionCtx, error: unknown) {
  const dsn = env("SENTRY_DSN");
  if (!dsn) return;

  const envelopeUrl = envelopeUrlForDsn(dsn);
  if (!envelopeUrl) return;

  const ownerKey = await optionalOwnerKey(ctx);
  const eventId = randomEventId();
  const envelope = [
    JSON.stringify({ event_id: eventId, dsn, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: "event" }),
    JSON.stringify({
      event_id: eventId,
      timestamp: new Date().toISOString(),
      platform: "javascript",
      level: "error",
      message: error instanceof Error ? error.message : String(error),
      tags: { actionName },
      user: ownerKey ? { id: ownerKey } : undefined,
    }),
  ].join("\n");

  await fetch(envelopeUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-sentry-envelope" },
    body: envelope,
  });
}

async function optionalOwnerKey(ctx: ActionCtx) {
  try {
    return await requireOwnerKey(ctx);
  } catch {
    return undefined;
  }
}

function envelopeUrlForDsn(dsn: string) {
  try {
    const url = new URL(dsn);
    const parts = url.pathname.split("/").filter(Boolean);
    const projectId = parts.at(-1);
    if (!projectId) return null;
    const prefix = parts.slice(0, -1).join("/");
    return `${url.origin}${prefix ? `/${prefix}` : ""}/api/${projectId}/envelope/`;
  } catch {
    return null;
  }
}

function randomEventId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function env(name: string): string | undefined {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name];
}
