/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actions_notifications from "../actions/notifications.js";
import type * as couples from "../couples.js";
import type * as dailyUsage from "../dailyUsage.js";
import type * as matches from "../matches.js";
import type * as plans from "../plans.js";
import type * as proposals from "../proposals.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as swipes from "../swipes.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "actions/notifications": typeof actions_notifications;
  couples: typeof couples;
  dailyUsage: typeof dailyUsage;
  matches: typeof matches;
  plans: typeof plans;
  proposals: typeof proposals;
  seed: typeof seed;
  storage: typeof storage;
  swipes: typeof swipes;
  users: typeof users;
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
