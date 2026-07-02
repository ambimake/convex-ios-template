// Subscription entitlement authority. The backend owns "is this account
// entitled?"; the client can only submit evidence, never grant itself access.
// Verified states come from a trusted verification step (Apple App Store Server
// API), which a clone wires as `applyVerifiedEntitlement`. See docs/decisions/
// 0013 + docs/guides/payments.md.
import { v } from "convex/values";

import { requireOwnerKey } from "./lib/auth";
import {
  MAX_ENTITLEMENT_EVIDENCE_CHARS,
  type StoredEntitlement,
  currentPlanFromEntitlement,
  sha256Hex,
} from "./lib/subscriptionPlan";
import { internalMutation, mutation, query } from "./_generated/server";

const verifiedStatusValidator = v.union(
  v.literal("verified_active"),
  v.literal("verified_expired"),
  v.literal("revoked"),
  v.literal("verification_failed"),
);

// Public, auth-derived: the current plan for the signed-in owner.
export const currentPlan = query({
  args: {},
  handler: async (ctx) => {
    const ownerKey = await requireOwnerKey(ctx);
    const row = await ctx.db
      .query("subscriptions")
      .withIndex("by_ownerKey", (q) => q.eq("ownerKey", ownerKey))
      .unique();
    const entitlement: StoredEntitlement | null = row
      ? {
          productId: row.productId,
          status: row.status,
          expiresAt: row.expiresAt,
          revokedAt: row.revokedAt,
        }
      : null;
    return currentPlanFromEntitlement(entitlement, Date.now());
  },
});

// Public, auth-derived: the client submits purchase evidence. This ONLY ever
// records `pending_verification` — it cannot grant a verified/active plan. A
// trusted verification step flips it via `applyVerifiedEntitlement`.
export const submitEntitlementEvidence = mutation({
  args: { productId: v.string(), evidence: v.string() },
  handler: async (ctx, args) => {
    const ownerKey = await requireOwnerKey(ctx);
    if (args.evidence.length === 0 || args.evidence.length > MAX_ENTITLEMENT_EVIDENCE_CHARS) {
      throw new Error("SUBSCRIPTION_EVIDENCE_INVALID");
    }
    const evidenceHash = await sha256Hex(args.evidence);
    const now = Date.now();
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_ownerKey", (q) => q.eq("ownerKey", ownerKey))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        productId: args.productId,
        status: "pending_verification",
        evidenceHash,
        updatedAt: now,
      });
      return { status: "pending_verification" as const };
    }

    await ctx.db.insert("subscriptions", {
      ownerKey,
      productId: args.productId,
      status: "pending_verification",
      evidenceHash,
      createdAt: now,
      updatedAt: now,
    });
    return { status: "pending_verification" as const };
  },
});

// Trusted verification result, called by a clone-provided verification action
// after checking the receipt with Apple. Not callable from the client.
export const applyVerifiedEntitlement = internalMutation({
  args: {
    ownerKey: v.string(),
    productId: v.string(),
    status: verifiedStatusValidator,
    expiresAt: v.optional(v.number()),
    revokedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_ownerKey", (q) => q.eq("ownerKey", args.ownerKey))
      .unique();

    const fields = {
      productId: args.productId,
      status: args.status,
      expiresAt: args.expiresAt,
      revokedAt: args.revokedAt,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, fields);
    } else {
      await ctx.db.insert("subscriptions", {
        ownerKey: args.ownerKey,
        evidenceHash: "",
        createdAt: now,
        ...fields,
      });
    }
  },
});
