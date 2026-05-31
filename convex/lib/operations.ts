import { v } from "convex/values";

export const commandSourceValidator = v.union(v.literal("typed"), v.literal("voice"));

export const createEntryOperationValidator = v.object({
  type: v.literal("create_entry"),
  body: v.string(),
});

export const operationValidator = createEntryOperationValidator;

export type CommandSource = "typed" | "voice";

export type CreateEntryOperation = {
  type: "create_entry";
  body: string;
};

export type AssistantOperation = CreateEntryOperation;
