/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as commands from "../commands.js";
import type * as entries from "../entries.js";
import type * as lib_apply from "../lib/apply.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_commandInterpreter from "../lib/commandInterpreter.js";
import type * as lib_operations from "../lib/operations.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as lib_voiceTranscription from "../lib/voiceTranscription.js";
import type * as posthog from "../posthog.js";
import type * as sentry from "../sentry.js";
import type * as usageEvents from "../usageEvents.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  commands: typeof commands;
  entries: typeof entries;
  "lib/apply": typeof lib_apply;
  "lib/auth": typeof lib_auth;
  "lib/commandInterpreter": typeof lib_commandInterpreter;
  "lib/operations": typeof lib_operations;
  "lib/sentry": typeof lib_sentry;
  "lib/voiceTranscription": typeof lib_voiceTranscription;
  posthog: typeof posthog;
  sentry: typeof sentry;
  usageEvents: typeof usageEvents;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
