import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { requireOwnerKey } from "./lib/auth";
import { commandSourceValidator, type AssistantOperation, type CommandSource } from "./lib/operations";
import { interpretCommand } from "./lib/commandInterpreter";
import { withSentry } from "./lib/sentry";
import { transcribeVoice } from "./lib/voiceTranscription";

const MAX_DELETE_ACCOUNT_BATCHES = 20;

export type CommandResponse = {
  status: "applied";
  summary: string;
  operations: AssistantOperation[];
  entries: Array<{
    body: string;
    source: CommandSource;
  }>;
};

type AppleAuthorizationResponse = {
  status: "recorded" | "updated";
};

type DeleteCounts = {
  profiles: number;
  entries: number;
  commandHistory: number;
  appleSignInCredentials: number;
  usageEvents: number;
};

type DeleteBatchResult = {
  deleted: DeleteCounts;
  hasMore: boolean;
};

type CleanupResult =
  | { status: "skipped"; reason: "missing_config" }
  | { status: "requested" };

type SentryCleanupResult =
  | { status: "skipped"; reason: "missing_config" }
  | { status: "reported" };

type DeleteAccountResponse = {
  status: "deleted";
  deleted: DeleteCounts;
  batches: number;
  cleanup: {
    posthog: CleanupResult;
    sentry: SentryCleanupResult;
  };
};

export const submitCommand = action({
  args: {
    text: v.string(),
    source: commandSourceValidator,
  },
  handler: async (ctx, args): Promise<CommandResponse> => {
    return await withSentry("commands:submitCommand", ctx, async () => {
      const ownerKey = await requireOwnerKey(ctx);
      const transcript = args.text.trim();
      const { operations, summary } = interpretCommand(transcript);

      const applyResult = await ctx.runMutation(internal.lib.apply.applyCommand, {
        ownerKey,
        transcript,
        source: args.source,
        operations,
        summary,
      });

      return {
        status: "applied",
        summary,
        operations,
        entries: applyResult.entries,
      };
    });
  },
});

export const recordAppleSignInAuthorization = action({
  args: {
    clientId: v.string(),
    refreshToken: v.string(),
  },
  handler: async (ctx, args): Promise<AppleAuthorizationResponse> => {
    return await withSentry("commands:recordAppleSignInAuthorization", ctx, async () => {
      const ownerKey = await requireOwnerKey(ctx);
      const response: AppleAuthorizationResponse = await ctx.runMutation(internal.account.recordAppleSignInAuthorization, {
        ownerKey,
        clientId: args.clientId,
        refreshToken: args.refreshToken,
      });
      return response;
    });
  },
});

export const deleteAccount = action({
  args: {},
  handler: async (ctx): Promise<DeleteAccountResponse> => {
    return await withSentry("commands:deleteAccount", ctx, async () => {
      const ownerKey = await requireOwnerKey(ctx);
      const deleted = emptyDeleteCounts();
      let batches = 0;
      let hasMore = true;

      while (hasMore) {
        if (batches >= MAX_DELETE_ACCOUNT_BATCHES) {
          throw new Error("DELETE_ACCOUNT_BATCH_LIMIT_EXCEEDED");
        }
        const batch: DeleteBatchResult = await ctx.runMutation(internal.account.deleteAccount, { ownerKey });
        addDeleteCounts(deleted, batch.deleted);
        batches += 1;
        hasMore = batch.hasMore;
      }

      const posthog: CleanupResult = await ctx.runAction(internal.posthog.deletePerson, { ownerKey });
      const sentry: SentryCleanupResult = await ctx.runAction(internal.sentry.recordAccountCleanup, { ownerKey });

      return {
        status: "deleted",
        deleted,
        batches,
        cleanup: { posthog, sentry },
      };
    });
  },
});

export const transcribeVoiceCommand = action({
  args: {
    audioBase64: v.string(),
    mimeType: v.string(),
  },
  handler: async (ctx, args) => {
    return await withSentry("commands:transcribeVoiceCommand", ctx, async () => {
      await requireOwnerKey(ctx);
      return await transcribeVoice(args);
    });
  },
});

function emptyDeleteCounts(): DeleteCounts {
  return {
    profiles: 0,
    entries: 0,
    commandHistory: 0,
    appleSignInCredentials: 0,
    usageEvents: 0,
  };
}

function addDeleteCounts(total: DeleteCounts, batch: DeleteCounts) {
  total.profiles += batch.profiles;
  total.entries += batch.entries;
  total.commandHistory += batch.commandHistory;
  total.appleSignInCredentials += batch.appleSignInCredentials;
  total.usageEvents += batch.usageEvents;
}
