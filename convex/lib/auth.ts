import type { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = Pick<ActionCtx | MutationCtx | QueryCtx, "auth">;

export async function requireOwnerKey(ctx: AuthCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("AUTH_REQUIRED");
  }
  return identity.tokenIdentifier;
}
