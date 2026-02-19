import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get users by couple ID
export const getByCoupleId = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();
  },
});

// Create user (called after Clerk signup)
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new user
    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      subscriptionStatus: "free",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Update user's couple
export const updateCouple = mutation({
  args: {
    clerkId: v.string(),
    coupleId: v.optional(v.id("couples")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      coupleId: args.coupleId,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Check if user has premium subscription
export const hasEntitlement = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      return false;
    }

    if (user.subscriptionStatus === "active") {
      // Check if not expired
      if (user.subscriptionExpiry && user.subscriptionExpiry > Date.now()) {
        return true;
      }
    }

    return user.subscriptionStatus === "trial";
  },
});

// Update anniversary date
export const updateAnniversary = mutation({
  args: {
    clerkId: v.string(),
    anniversaryDate: v.number(), // timestamp
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      anniversaryDate: args.anniversaryDate,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Get daily usage for a user
export const getDailyUsage = query({
  args: {
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD format
  },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .first();

    return usage || {
      likeCount: 0,
      superLikeCount: 0,
      proposalCreateCount: 0,
    };
  },
});

// Increment daily usage
export const incrementDailyUsage = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("superLike"),
      v.literal("proposalCreate")
    ),
  },
  handler: async (ctx, args) => {
    const today = new Date().toISOString().split('T')[0];

    const existing = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .first();

    if (existing) {
      const updates: Record<string, number> = {};
      if (args.type === "like") {
        updates.likeCount = existing.likeCount + 1;
      } else if (args.type === "superLike") {
        updates.superLikeCount = existing.superLikeCount + 1;
      } else {
        updates.proposalCreateCount = existing.proposalCreateCount + 1;
      }

      await ctx.db.patch(existing._id, updates);
      return existing._id;
    }

    // Create new daily usage record
    return await ctx.db.insert("dailyUsage", {
      userId: args.userId,
      date: today,
      likeCount: args.type === "like" ? 1 : 0,
      superLikeCount: args.type === "superLike" ? 1 : 0,
      proposalCreateCount: args.type === "proposalCreate" ? 1 : 0,
    });
  },
});
