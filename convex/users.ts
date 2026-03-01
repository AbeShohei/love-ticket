import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (user && user.avatarStorageId) {
      user.avatarUrl = (await ctx.storage.getUrl(user.avatarStorageId)) || user.avatarUrl;
    }

    return user;
  },
});

// Get user by ID
export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);

    if (user && user.avatarStorageId) {
      user.avatarUrl = (await ctx.storage.getUrl(user.avatarStorageId)) || user.avatarUrl;
    }

    return user;
  },
});

// Get users by couple ID
export const getByCoupleId = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    for (const user of users) {
      if (user.avatarStorageId) {
        user.avatarUrl = (await ctx.storage.getUrl(user.avatarStorageId)) || user.avatarUrl;
      }
    }

    return users;

  },
});

// Create user (called after Clerk signup)
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
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
      avatarStorageId: args.avatarStorageId,
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
    avatarStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Filter out undefined fields
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.displayName !== undefined) updates.displayName = args.displayName;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;
    if (args.avatarStorageId !== undefined) updates.avatarStorageId = args.avatarStorageId;

    await ctx.db.patch(user._id, updates);

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

// Update user's push token
export const updatePushToken = mutation({
  args: { pushToken: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      pushToken: args.pushToken,
      updatedAt: Date.now(),
    });

    return user._id;
  },
});

// Update notification settings
export const updateNotificationSettings = mutation({
  args: {
    notificationDate: v.optional(v.boolean()),
    notificationMatch: v.optional(v.boolean()),
    notificationPlan: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.notificationDate !== undefined) updates.notificationDate = args.notificationDate;
    if (args.notificationMatch !== undefined) updates.notificationMatch = args.notificationMatch;
    if (args.notificationPlan !== undefined) updates.notificationPlan = args.notificationPlan;

    await ctx.db.patch(user._id, updates);

    return user._id;
  },
});

// Update language preference
export const updateLanguage = mutation({
  args: {
    language: v.union(v.literal("ja"), v.literal("en")),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let user;

    // Try to get user from auth first
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .first();
    }

    // Fallback to userId parameter if auth not available
    if (!user && args.userId) {
      user = await ctx.db.get(args.userId);
    }

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      language: args.language,
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

// Update subscription status (called from RevenueCat webhook or client)
export const updateSubscriptionStatus = mutation({
  args: {
    clerkId: v.string(),
    status: v.optional(v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired")
    )),
    tier: v.optional(v.union(
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("yearly")
    )),
    expiryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (args.status !== undefined) updates.subscriptionStatus = args.status;
    if (args.tier !== undefined) updates.subscriptionTier = args.tier;
    if (args.expiryDate !== undefined) updates.subscriptionExpiry = args.expiryDate;

    await ctx.db.patch(user._id, updates);

    return user._id;
  },
});



// Delete account and all user data
export const deleteAccount = mutation({
  args: { clerkId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Try auth first, fall back to explicit clerkId
    let clerkId = args.clerkId;
    if (!clerkId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) {
        throw new Error("Unauthenticated");
      }
      clerkId = identity.subject;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Leave couple if paired
    if (user.coupleId) {
      const coupleId = user.coupleId;

      // Remove coupleId from partner
      const partner = await ctx.db
        .query("users")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", coupleId))
        .filter((q) => q.neq(q.field("_id"), user._id))
        .first();
      if (partner) {
        await ctx.db.patch(partner._id, { coupleId: undefined });
      }

      // Delete matches
      const matches = await ctx.db
        .query("matches")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", coupleId))
        .collect();
      await Promise.all(matches.map((m) => ctx.db.delete(m._id)));

      // Delete plans
      const plans = await ctx.db
        .query("plans")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", coupleId))
        .collect();
      await Promise.all(plans.map((p) => ctx.db.delete(p._id)));

      // Delete custom proposals and their swipes
      const proposals = await ctx.db
        .query("proposals")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", coupleId))
        .collect();
      for (const proposal of proposals) {
        const swipes = await ctx.db
          .query("swipes")
          .withIndex("by_proposal_id", (q) => q.eq("proposalId", proposal._id))
          .collect();
        await Promise.all(swipes.map((s) => ctx.db.delete(s._id)));
        await ctx.db.delete(proposal._id);
      }

      // Delete couple record
      await ctx.db.delete(coupleId);
    }

    // Delete daily usage records in parallel
    const usageRecords = await ctx.db
      .query("dailyUsage")
      .withIndex("by_user_date", (q) => q.eq("userId", user._id))
      .collect();
    await Promise.all(usageRecords.map((r) => ctx.db.delete(r._id)));

    // Delete avatar from storage if uploaded
    if (user.avatarStorageId) {
      await ctx.storage.delete(user.avatarStorageId);
    }

    // Delete the user record
    await ctx.db.delete(user._id);
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
