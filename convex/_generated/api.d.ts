/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as aiChat from "../aiChat.js";
import type * as alerts from "../alerts.js";
import type * as communityStories from "../communityStories.js";
import type * as crons from "../crons.js";
import type * as currency from "../currency.js";
import type * as customBookings from "../customBookings.js";
import type * as expenses from "../expenses.js";
import type * as insiderTips from "../insiderTips.js";
import type * as notifications from "../notifications.js";
import type * as packingList from "../packingList.js";
import type * as socialMedia from "../socialMedia.js";
import type * as tripDetail from "../tripDetail.js";
import type * as tripSharing from "../tripSharing.js";
import type * as user from "../user.js";
import type * as weather from "../weather.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiChat: typeof aiChat;
  alerts: typeof alerts;
  communityStories: typeof communityStories;
  crons: typeof crons;
  currency: typeof currency;
  customBookings: typeof customBookings;
  expenses: typeof expenses;
  insiderTips: typeof insiderTips;
  notifications: typeof notifications;
  packingList: typeof packingList;
  socialMedia: typeof socialMedia;
  tripDetail: typeof tripDetail;
  tripSharing: typeof tripSharing;
  user: typeof user;
  weather: typeof weather;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
