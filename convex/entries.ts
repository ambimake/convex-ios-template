import { query } from "./_generated/server";
import { requireOwnerKey } from "./lib/auth";
import { commandSourceValidator } from "./lib/operations";
import { v } from "convex/values";

export const entryListItemValidator = v.object({
  body: v.string(),
  source: commandSourceValidator,
});

export type EntryListItem = {
  body: string;
  source: "typed" | "voice";
};

export const listEntries = query({
  args: {},
  returns: v.array(entryListItemValidator),
  handler: async (ctx): Promise<EntryListItem[]> => {
    const ownerKey = await requireOwnerKey(ctx);
    const rows = await ctx.db
      .query("entries")
      .withIndex("by_ownerKey_and_createdAt", (q) => q.eq("ownerKey", ownerKey))
      .order("desc")
      .take(50);
    return rows.map(({ body, source }) => ({ body, source }));
  },
});
