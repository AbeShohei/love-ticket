import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate a random 6-character invite code
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get couple by invite code
export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("couples")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase())
      )
      .first();
  },
});

// Get couple by ID
export const getById = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    const couple = await ctx.db.get(args.coupleId);

    if (!couple) {
      return null;
    }

    // Get partner info
    const partners = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    return {
      couple,
      partner: partners[0] || null,
    };
  },
});

// Create a new couple
export const create = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inviteCode = generateInviteCode();

    // Ensure unique invite code
    let existing = await ctx.db
      .query("couples")
      .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
      .first();

    while (existing) {
      inviteCode = generateInviteCode();
      existing = await ctx.db
        .query("couples")
        .withIndex("by_invite_code", (q) => q.eq("inviteCode", inviteCode))
        .first();
    }

    // Create the couple
    const coupleId = await ctx.db.insert("couples", {
      inviteCode,
      status: "pending",
      createdAt: now,
    });

    // Update the user's coupleId
    await ctx.db.patch(args.userId, {
      coupleId,
      updatedAt: now,
    });

    return { coupleId, inviteCode };
  },
});

// Join an existing couple
export const join = mutation({
  args: {
    userId: v.id("users"),
    inviteCode: v.string(),
  },
  handler: async (ctx, args) => {
    const couple = await ctx.db
      .query("couples")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase())
      )
      .first();

    if (!couple) {
      throw new Error("無効な招待コードです");
    }

    // Update the user's coupleId
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      coupleId: couple._id,
      updatedAt: now,
    });

    // Update couple status to active and set anniversary
    await ctx.db.patch(couple._id, {
      status: "active",
      activatedAt: now,
      anniversaryDate: now, // Set initial anniversary when joining
    });

    return couple._id;
  },
});

// Get couple with partner info
export const getCoupleWithPartner = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user || !user.coupleId) {
      return null;
    }

    const couple = await ctx.db.get(user.coupleId);
    if (!couple) {
      return null;
    }

    // Get partner
    const partners = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", user.coupleId))
      .filter((q) => q.neq(q.field("_id"), user._id))
      .collect();

    return {
      couple,
      partner: partners[0] || null,
    };
  },
});

// Leave a couple (breakup)
export const leaveCouple = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || !user.coupleId) {
      throw new Error("カップルに参加していません");
    }

    const coupleId = user.coupleId;

    // Clear the user's coupleId
    await ctx.db.patch(args.userId, {
      coupleId: undefined,
      updatedAt: Date.now(),
    });

    // Check if any other user still references this couple
    const remainingMembers = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", coupleId))
      .collect();

    if (remainingMembers.length === 0) {
      // No one left in this couple, delete it
      await ctx.db.delete(coupleId);
    } else {
      // Set back to pending since one partner left
      await ctx.db.patch(coupleId, {
        status: "pending",
      });
    }

    return { success: true };
  },
});

// Update anniversary for a couple
export const updateAnniversary = mutation({
  args: {
    coupleId: v.id("couples"),
    anniversaryDate: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.coupleId, {
      anniversaryDate: args.anniversaryDate,
    });
    return args.coupleId;
  },
});
