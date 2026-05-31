import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import { internalMutation } from "./_generated/server";

const DELETE_BATCH_LIMIT = 50;

export const recordAppleSignInAuthorization = internalMutation({
  args: {
    ownerKey: v.string(),
    clientId: v.string(),
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("appleSignInCredentials")
      .withIndex("by_ownerKey", (q) => q.eq("ownerKey", args.ownerKey))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        clientId: args.clientId,
        refreshToken: args.refreshToken,
        updatedAt: now,
      });
      return { status: "updated" as const };
    }

    await ctx.db.insert("appleSignInCredentials", {
      ownerKey: args.ownerKey,
      clientId: args.clientId,
      refreshToken: args.refreshToken,
      createdAt: now,
      updatedAt: now,
    });
    return { status: "recorded" as const };
  },
});

export const deleteAccount = internalMutation({
  args: {
    ownerKey: v.string(),
  },
  handler: async (ctx, args) => {
    const profiles = await deleteProfiles(ctx, args.ownerKey);
    const entries = await deleteEntries(ctx, args.ownerKey);
    const commandHistory = await deleteCommandHistory(ctx, args.ownerKey);
    const appleSignInCredentials = await deleteAppleCredentials(ctx, args.ownerKey);
    const usageEvents = await deleteUsageEvents(ctx, args.ownerKey);

    return {
      deleted: {
        profiles: profiles.deleted,
        entries: entries.deleted,
        commandHistory: commandHistory.deleted,
        appleSignInCredentials: appleSignInCredentials.deleted,
        usageEvents: usageEvents.deleted,
      },
      hasMore:
        profiles.hasMore
        || entries.hasMore
        || commandHistory.hasMore
        || appleSignInCredentials.hasMore
        || usageEvents.hasMore,
    };
  },
});

async function deleteProfiles(ctx: MutationCtx, ownerKey: string) {
  const rows = await ctx.db
    .query("profiles")
    .withIndex("by_ownerKey", (q) => q.eq("ownerKey", ownerKey))
    .take(DELETE_BATCH_LIMIT + 1);
  return await deleteRows(ctx, rows);
}

async function deleteEntries(ctx: MutationCtx, ownerKey: string) {
  const rows = await ctx.db
    .query("entries")
    .withIndex("by_ownerKey_and_createdAt", (q) => q.eq("ownerKey", ownerKey))
    .take(DELETE_BATCH_LIMIT + 1);
  return await deleteRows(ctx, rows);
}

async function deleteCommandHistory(ctx: MutationCtx, ownerKey: string) {
  const rows = await ctx.db
    .query("commandHistory")
    .withIndex("by_ownerKey_and_createdAt", (q) => q.eq("ownerKey", ownerKey))
    .take(DELETE_BATCH_LIMIT + 1);
  return await deleteRows(ctx, rows);
}

async function deleteAppleCredentials(ctx: MutationCtx, ownerKey: string) {
  const rows = await ctx.db
    .query("appleSignInCredentials")
    .withIndex("by_ownerKey", (q) => q.eq("ownerKey", ownerKey))
    .take(DELETE_BATCH_LIMIT + 1);
  return await deleteRows(ctx, rows);
}

async function deleteUsageEvents(ctx: MutationCtx, ownerKey: string) {
  const rows = await ctx.db
    .query("usageEvents")
    .withIndex("by_ownerKey_and_createdAt", (q) => q.eq("ownerKey", ownerKey))
    .take(DELETE_BATCH_LIMIT + 1);
  return await deleteRows(ctx, rows);
}

async function deleteRows(ctx: MutationCtx, rows: Array<{ _id: Parameters<MutationCtx["db"]["delete"]>[0] }>) {
  const rowsToDelete = rows.slice(0, DELETE_BATCH_LIMIT);
  for (const row of rowsToDelete) {
    await ctx.db.delete(row._id);
  }
  return {
    deleted: rowsToDelete.length,
    hasMore: rows.length > DELETE_BATCH_LIMIT,
  };
}
