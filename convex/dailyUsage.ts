import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

// Get today's usage for a user
export const getToday = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const today = getTodayDate();

    const usage = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    return usage || {
      likeCount: 0,
      superLikeCount: 0,
      proposalCreateCount: 0,
    };
  },
});

// Increment usage counters
export const increment = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("super_like"),
      v.literal("proposal")
    ),
  },
  handler: async (ctx, args) => {
    const today = getTodayDate();

    const existing = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existing) {
      // Update existing record
      const updates: Record<string, number> = {};
      if (args.type === "like") {
        updates.likeCount = existing.likeCount + 1;
      } else if (args.type === "super_like") {
        updates.superLikeCount = existing.superLikeCount + 1;
      } else {
        updates.proposalCreateCount = existing.proposalCreateCount + 1;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new record
    return await ctx.db.insert("dailyUsage", {
      userId: args.userId,
      date: today,
      likeCount: args.type === "like" ? 1 : 0,
      superLikeCount: args.type === "super_like" ? 1 : 0,
      proposalCreateCount: args.type === "proposal" ? 1 : 0,
    });
  },
});

// Check if user has remaining likes
export const checkLimit = query({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("super_like")
    ),
    isPremium: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Premium users have no limits
    if (args.isPremium) {
      return { hasRemaining: true, remaining: Infinity, limit: Infinity };
    }

    const today = getTodayDate();

    const usage = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    const limits = {
      like: 10,
      super_like: 1,
    };

    const current = args.type === "like"
      ? (usage?.likeCount ?? 0)
      : (usage?.superLikeCount ?? 0);

    const limit = limits[args.type];
    const hasRemaining = current < limit;
    const remaining = Math.max(0, limit - current);

    return { hasRemaining, remaining, limit };
  },
});
