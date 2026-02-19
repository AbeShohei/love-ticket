import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get swipe history for a user
export const getHistory = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    // Fetch proposal details for each swipe
    const swipesWithProposals = await Promise.all(
      swipes.map(async (swipe) => {
        const proposal = await ctx.db.get(swipe.proposalId);
        if (proposal && proposal.createdBy === args.userId) {
          return null; // Skip self-created proposals (auto-swipes)
        }

        if (proposal && proposal.imageStorageIds && proposal.imageStorageIds.length > 0) {
          const urls = await Promise.all(proposal.imageStorageIds.map((id) => ctx.storage.getUrl(id)));
          const validUrls = urls.filter(Boolean) as string[];
          if (validUrls.length > 0) {
            proposal.images = validUrls;
            proposal.imageUrl = validUrls[0];
          }
        }
        return {
          ...swipe,
          proposal,
        };
      })
    );

    return swipesWithProposals.filter(Boolean);
  },
});

// Check if user has swiped on a proposal
export const hasSwiped = query({
  args: {
    userId: v.id("users"),
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    const swipe = await ctx.db
      .query("swipes")
      .withIndex("by_user_proposal", (q) =>
        q.eq("userId", args.userId).eq("proposalId", args.proposalId)
      )
      .first();

    return swipe || null;
  },
});

// Record a swipe
export const create = mutation({
  args: {
    userId: v.id("users"),
    proposalId: v.id("proposals"),
    direction: v.union(
      v.literal("left"),
      v.literal("right"),
      v.literal("super_like")
    ),
  },
  handler: async (ctx, args) => {
    // Check if already swiped
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_user_proposal", (q) =>
        q.eq("userId", args.userId).eq("proposalId", args.proposalId)
      )
      .first();

    if (existing) {
      // Update direction if different
      if (existing.direction !== args.direction) {
        await ctx.db.patch(existing._id, {
          direction: args.direction,
        });
      }
      return existing._id;
    }

    // Create new swipe
    const swipeId = await ctx.db.insert("swipes", {
      userId: args.userId,
      proposalId: args.proposalId,
      direction: args.direction,
      createdAt: Date.now(),
    });

    return swipeId;
  },
});

// Get swipes for a specific proposal by couple members
export const getCoupleSwipesForProposal = query({
  args: {
    proposalId: v.id("proposals"),
    userIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    const swipes = await Promise.all(
      args.userIds.map(async (userId) => {
        const swipe = await ctx.db
          .query("swipes")
          .withIndex("by_user_proposal", (q) =>
            q.eq("userId", userId).eq("proposalId", args.proposalId)
          )
          .first();
        return { userId, swipe };
      })
    );

    return swipes;
  },
});

// Get IDs of proposals that a user has already swiped on
export const getSwipedProposalIds = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return swipes.map((s) => s.proposalId);
  },
});

// Create swipe and check for match
export const createAndCheckMatch = mutation({
  args: {
    userId: v.id("users"),
    proposalId: v.id("proposals"),
    direction: v.union(
      v.literal("left"),
      v.literal("right"),
      v.literal("super_like")
    ),
    coupleId: v.id("couples"),
    partnerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Record the swipe
    const existing = await ctx.db
      .query("swipes")
      .withIndex("by_user_proposal", (q) =>
        q.eq("userId", args.userId).eq("proposalId", args.proposalId)
      )
      .first();

    if (existing) {
      if (existing.direction !== args.direction) {
        await ctx.db.patch(existing._id, { direction: args.direction });
      }
    } else {
      await ctx.db.insert("swipes", {
        userId: args.userId,
        proposalId: args.proposalId,
        direction: args.direction,
        createdAt: Date.now(),
      });
    }

    // Only check for match if right swipe or super_like
    if (args.direction === "left") {
      return { matched: false };
    }

    // Check if partner also swiped right on this proposal
    const partnerSwipe = await ctx.db
      .query("swipes")
      .withIndex("by_user_proposal", (q) =>
        q.eq("userId", args.partnerId).eq("proposalId", args.proposalId)
      )
      .first();

    if (partnerSwipe && (partnerSwipe.direction === "right" || partnerSwipe.direction === "super_like")) {
      // Check if match already exists
      const existingMatch = await ctx.db
        .query("matches")
        .withIndex("by_proposal_id", (q) => q.eq("proposalId", args.proposalId))
        .filter((q) => q.eq(q.field("coupleId"), args.coupleId))
        .first();

      if (!existingMatch) {
        // Create match
        const matchId = await ctx.db.insert("matches", {
          coupleId: args.coupleId,
          proposalId: args.proposalId,
          matchedAt: Date.now(),
          status: "matched",
        });

        return { matched: true, matchId };
      }

      return { matched: true, matchId: existingMatch._id };
    }

    return { matched: false };
  },
});
