import { internalQuery } from "./_generated/server";
import { requireOwnerKey } from "./lib/auth";

export const listForOwner = internalQuery({
  args: {},
  handler: async (ctx) => {
    const ownerKey = await requireOwnerKey(ctx);
    return await ctx.db
      .query("usageEvents")
      .withIndex("by_ownerKey_and_createdAt", (q) => q.eq("ownerKey", ownerKey))
      .order("asc")
      .take(50);
  },
});
