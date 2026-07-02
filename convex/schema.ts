import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  accountDeletionCleanupValidator,
  accountDeletionJobStatusValidator,
  deleteCountsValidator,
} from "./lib/accountDeletionContract";

export default defineSchema({
  profiles: defineTable({
    ownerKey: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerKey", ["ownerKey"]),

  entries: defineTable({
    ownerKey: v.string(),
    body: v.string(),
    source: v.union(v.literal("typed"), v.literal("voice")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerKey_and_createdAt", ["ownerKey", "createdAt"]),

  commandHistory: defineTable({
    ownerKey: v.string(),
    source: v.union(v.literal("typed"), v.literal("voice")),
    transcript: v.string(),
    status: v.union(v.literal("applied"), v.literal("rejected"), v.literal("failed")),
    summary: v.optional(v.string()),
    operations: v.optional(v.array(v.object({
      type: v.literal("create_entry"),
      body: v.string(),
    }))),
    errorCode: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_ownerKey_and_createdAt", ["ownerKey", "createdAt"]),

  appleSignInCredentials: defineTable({
    ownerKey: v.string(),
    clientId: v.string(),
    refreshToken: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerKey", ["ownerKey"]),

  usageEvents: defineTable({
    ownerKey: v.string(),
    eventName: v.string(),
    properties: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null()))),
    createdAt: v.number(),
  }).index("by_ownerKey_and_createdAt", ["ownerKey", "createdAt"]),

  // Install-attribution records (see convex/attribution.ts). Keyed by an
  // anonymous analytics/install ID, not IDFA. Stores the campaign result plus a
  // hash of the AdServices token for dedup; the raw token is never stored.
  adAttributions: defineTable({
    analyticsUserID: v.string(),
    bundleID: v.string(),
    appVersion: v.string(),
    appBuild: v.string(),
    attributionTokenHash: v.string(),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    attribution: v.optional(v.boolean()),
    orgId: v.optional(v.union(v.number(), v.string())),
    campaignId: v.optional(v.union(v.number(), v.string())),
    adGroupId: v.optional(v.union(v.number(), v.string())),
    keywordId: v.optional(v.union(v.number(), v.string())),
    adId: v.optional(v.union(v.number(), v.string())),
    creativeSetId: v.optional(v.union(v.number(), v.string())),
    countryOrRegion: v.optional(v.string()),
    conversionType: v.optional(v.string()),
    claimType: v.optional(v.string()),
    supplyPlacement: v.optional(v.string()),
    clickDate: v.optional(v.string()),
    impressionDate: v.optional(v.string()),
    rawAttribution: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_analyticsUserID", ["analyticsUserID"])
    .index("by_attributionTokenHash", ["attributionTokenHash"]),

  adAttributionRateLimits: defineTable({
    key: v.string(),
    windowStartedAt: v.number(),
    requestCount: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Backend-owned subscription entitlement (see convex/subscription.ts). One row
  // per owner. The client can only submit evidence (→ pending_verification); a
  // trusted verification step sets the verified states. Stores a hash of the
  // evidence, never the raw receipt.
  subscriptions: defineTable({
    ownerKey: v.string(),
    productId: v.string(),
    status: v.union(
      v.literal("pending_verification"),
      v.literal("verified_active"),
      v.literal("verified_expired"),
      v.literal("revoked"),
      v.literal("verification_failed"),
    ),
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
    evidenceHash: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerKey", ["ownerKey"]),

  accountDeletionJobs: defineTable({
    ownerKey: v.string(),
    status: accountDeletionJobStatusValidator,
    deleted: deleteCountsValidator,
    batches: v.number(),
    cleanup: v.optional(accountDeletionCleanupValidator),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_ownerKey", ["ownerKey"]),
});
