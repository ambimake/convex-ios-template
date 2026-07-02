// Pure, provider-agnostic helpers for Apple Ads (AdServices) install
// attribution. No Convex or network state here so they unit-test in isolation.
// See docs/decisions/0014 and docs/guides/attribution.md.

export const APPLE_ADSERVICES_ATTRIBUTION_URL =
  "https://api-adservices.apple.com/api/v1/";
export const APPLE_NOT_FOUND_RETRY_DELAY_MS = 5_000;
export const APPLE_NOT_FOUND_MAX_ATTEMPTS = 3;
export const APPLE_REQUEST_TIMEOUT_MS = 10_000;

const MAX_USER_ID_LENGTH = 128;
const MAX_BUNDLE_ID_LENGTH = 128;
const MAX_VERSION_LENGTH = 64;
const MAX_ATTRIBUTION_TOKEN_LENGTH = 4096;

// A stable, anonymous per-install join key (e.g. the analytics/install ID).
export type AttributionPayload = {
  analyticsUserID: string;
  bundleID: string;
  appVersion: string;
  appBuild: string;
};

export type IncomingAttributionPayload = AttributionPayload & {
  attributionToken: string;
};

export type AppleAttributionRecord = Record<string, unknown>;

export type AttributionDocument = AttributionPayload & {
  status: "completed";
  attribution?: boolean;
  orgId?: number | string;
  campaignId?: number | string;
  adGroupId?: number | string;
  keywordId?: number | string;
  adId?: number | string;
  creativeSetId?: number | string;
  countryOrRegion?: string;
  conversionType?: string;
  claimType?: string;
  supplyPlacement?: string;
  clickDate?: string;
  impressionDate?: string;
  rawAttribution: AppleAttributionRecord;
  updatedAt: number;
};

export type AttributionResponseBody = {
  ok: true;
  attribution: boolean;
  duplicate: boolean;
};

type AttributionFetchResponse = Pick<Response, "status" | "ok" | "json">;

type ExchangeAttributionTokenOptions = {
  fetcher?: (url: string, init: RequestInit) => Promise<AttributionFetchResponse>;
  sleep?: (milliseconds: number) => Promise<void>;
  retryDelayMs?: number;
  maxAttempts?: number;
  requestTimeoutMs?: number;
};

// Validate and normalize the client payload. Pass `expectedBundleID` to pin the
// bundle (recommended in production); omit to accept any non-empty bundle.
export function parseIncomingPayload(
  body: unknown,
  options: { expectedBundleID?: string } = {},
): IncomingAttributionPayload | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const analyticsUserID = requiredString(record, "analyticsUserID");
  const attributionToken = requiredString(record, "attributionToken");
  const bundleID = requiredString(record, "bundleID");
  const appVersion = requiredString(record, "appVersion");
  const appBuild = requiredString(record, "appBuild");

  if (
    analyticsUserID === null ||
    attributionToken === null ||
    bundleID === null ||
    appVersion === null ||
    appBuild === null
  ) {
    return null;
  }

  if (options.expectedBundleID && bundleID !== options.expectedBundleID) {
    return null;
  }

  return { analyticsUserID, attributionToken, bundleID, appVersion, appBuild };
}

export function buildAttributionDocument(
  payload: AttributionPayload,
  appleAttribution: AppleAttributionRecord,
  now: number,
): AttributionDocument {
  const document: AttributionDocument = {
    ...payload,
    status: "completed",
    rawAttribution: appleAttribution,
    updatedAt: now,
  };

  setIfPresent(document, "attribution", booleanField(appleAttribution, "attribution"));
  setIfPresent(document, "orgId", idField(appleAttribution, "orgId"));
  setIfPresent(document, "campaignId", idField(appleAttribution, "campaignId"));
  setIfPresent(document, "adGroupId", idField(appleAttribution, "adGroupId"));
  setIfPresent(document, "keywordId", idField(appleAttribution, "keywordId"));
  setIfPresent(document, "adId", idField(appleAttribution, "adId"));
  setIfPresent(document, "creativeSetId", idField(appleAttribution, "creativeSetId"));
  setIfPresent(document, "countryOrRegion", stringField(appleAttribution, "countryOrRegion"));
  setIfPresent(document, "conversionType", stringField(appleAttribution, "conversionType"));
  setIfPresent(document, "claimType", stringField(appleAttribution, "claimType"));
  setIfPresent(document, "supplyPlacement", stringField(appleAttribution, "supplyPlacement"));
  setIfPresent(document, "clickDate", stringField(appleAttribution, "clickDate"));
  setIfPresent(document, "impressionDate", stringField(appleAttribution, "impressionDate"));

  return document;
}

// Exchange the AdServices token with Apple. `fetcher`/`sleep` are injectable so
// tests run without network. Apple returns 404 while attribution is not yet
// ready — retry a bounded number of times.
export async function exchangeAttributionToken(
  token: string,
  options: ExchangeAttributionTokenOptions = {},
): Promise<AppleAttributionRecord> {
  const fetcher = options.fetcher ?? fetch;
  const sleeper = options.sleep ?? sleep;
  const retryDelayMs = options.retryDelayMs ?? APPLE_NOT_FOUND_RETRY_DELAY_MS;
  const maxAttempts = options.maxAttempts ?? APPLE_NOT_FOUND_MAX_ATTEMPTS;
  const requestTimeoutMs = options.requestTimeoutMs ?? APPLE_REQUEST_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), requestTimeoutMs);
    let response: AttributionFetchResponse;
    try {
      response = await fetcher(APPLE_ADSERVICES_ATTRIBUTION_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: token,
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 404 && attempt < maxAttempts) {
      await sleeper(retryDelayMs);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Apple AdServices attribution failed with ${response.status}`);
    }

    const json = await response.json();
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("Apple AdServices returned a non-object payload");
    }
    return json as AppleAttributionRecord;
  }

  throw new Error("Apple AdServices attribution was not found after retries");
}

export function buildAttributionResponse(
  appleAttribution: AppleAttributionRecord,
  duplicate: boolean,
): AttributionResponseBody {
  return {
    ok: true,
    attribution: appleAttribution.attribution === true,
    duplicate,
  };
}

export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function requiredString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLengthForKey(key)) return null;
  return trimmed;
}

function maxLengthForKey(key: string): number {
  switch (key) {
    case "analyticsUserID":
      return MAX_USER_ID_LENGTH;
    case "bundleID":
      return MAX_BUNDLE_ID_LENGTH;
    case "appVersion":
    case "appBuild":
      return MAX_VERSION_LENGTH;
    case "attributionToken":
      return MAX_ATTRIBUTION_TOKEN_LENGTH;
    default:
      return 256;
  }
}

function setIfPresent(
  document: AttributionDocument,
  key: keyof AttributionDocument,
  value: boolean | number | string | undefined,
) {
  if (value !== undefined) document[key] = value as never;
}

function booleanField(record: AppleAttributionRecord, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function idField(record: AppleAttributionRecord, key: string): number | string | undefined {
  const value = record[key];
  return typeof value === "number" || typeof value === "string" ? value : undefined;
}

function stringField(record: AppleAttributionRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
