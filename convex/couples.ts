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
  args: { id: v.id("couples") },
  handler: async (ctx, args) => {
    console.log('[Convex] getById called with id:', args.id);
    const couple = await ctx.db.get(args.id);
    console.log('[Convex] getById result:', couple ? { id: couple._id, status: couple.status } : null);
    return couple;
  },
});

// Create a new couple
export const create = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    console.log('[Convex] create called with userId:', args.userId);
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
    console.log('[Convex] Created couple:', coupleId, 'with inviteCode:', inviteCode);

    // Update the user's coupleId
    await ctx.db.patch(args.userId, {
      coupleId,
      updatedAt: now,
    });
    console.log('[Convex] Updated user coupleId:', args.userId, '->', coupleId);

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
    console.log('[Convex] join called with userId:', args.userId, 'inviteCode:', args.inviteCode);

    const couple = await ctx.db
      .query("couples")
      .withIndex("by_invite_code", (q) =>
        q.eq("inviteCode", args.inviteCode.toUpperCase())
      )
      .first();

    if (!couple) {
      console.log('[Convex] Couple not found for invite code:', args.inviteCode);
      throw new Error("無効な招待コードです");
    }

    console.log('[Convex] Found couple:', couple._id, 'current status:', couple.status);

    // Update the user's coupleId and set anniversary to today
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      coupleId: couple._id,
      anniversaryDate: now,
      updatedAt: now,
    });
    console.log('[Convex] Updated user coupleId:', args.userId, '->', couple._id);

    // Update couple status to active
    await ctx.db.patch(couple._id, {
      status: "active",
      activatedAt: now,
    });
    console.log('[Convex] Updated couple status to active:', couple._id);

    // Also set anniversary for the creator (other user in this couple)
    const creator = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", couple._id))
      .filter((q) => q.neq(q.field("_id"), args.userId))
      .first();

    if (creator && !creator.anniversaryDate) {
      await ctx.db.patch(creator._id, {
        anniversaryDate: now,
        updatedAt: now,
      });
      console.log('[Convex] Set anniversary for creator:', creator._id);
    }

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
