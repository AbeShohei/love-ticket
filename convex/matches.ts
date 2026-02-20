import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Get matches for a couple
export const getForCouple = query({
  args: {
    coupleId: v.id("couples"),
    currentUserId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .order("desc")
      .collect();

    // Fetch proposal details and partner swipe for each match
    const matchesWithProposals = await Promise.all(
      matches.map(async (match) => {
        const proposal = await ctx.db.get(match.proposalId);
        if (proposal && proposal.imageStorageIds && proposal.imageStorageIds.length > 0) {
          const urls = await Promise.all(proposal.imageStorageIds.map((id) => ctx.storage.getUrl(id)));
          const validUrls = urls.filter(Boolean) as string[];
          if (validUrls.length > 0) {
            proposal.images = validUrls;
            proposal.imageUrl = validUrls[0];
          }
        }

        let partnerDirection = 'right';
        if (args.currentUserId) {
          const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_proposal_id", (q) => q.eq("proposalId", match.proposalId))
            .collect();

          const partnerSwipe = swipes.find(s => s.userId !== args.currentUserId);
          if (partnerSwipe) {
            partnerDirection = partnerSwipe.direction;
          }
        }

        return {
          ...match,
          proposal,
          partnerDirection,
        };
      })
    );

    return matchesWithProposals;
  },
});

// Create a match when both users swipe right
export const createFromMutualSwipe = mutation({
  args: {
    coupleId: v.id("couples"),
    proposalId: v.id("proposals"),
  },
  handler: async (ctx, args) => {
    // Check if match already exists
    const existing = await ctx.db
      .query("matches")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .filter((q) => q.eq(q.field("proposalId"), args.proposalId))
      .first();

    if (existing) {
      return existing._id;
    }

    // Create new match
    const matchId = await ctx.db.insert("matches", {
      coupleId: args.coupleId,
      proposalId: args.proposalId,
      matchedAt: Date.now(),
      status: "matched",
    });

    // Notify the partner
    const identity = await ctx.auth.getUserIdentity();
    if (identity) {
      const users = await ctx.db
        .query("users")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
        .collect();

      const partner = users.find(u => u.clerkId !== identity.subject);

      if (partner && partner.pushToken) {
        const proposal = await ctx.db.get(args.proposalId);
        const title = "マッチトしました！"; // "Matched!"
        const body = proposal ? `「${proposal.title}」でお互いの行きたいが一致しました！` : "新しいマッチが成立しました！";

        await ctx.scheduler.runAfter(0, api.actions.notifications.sendPush, {
          pushToken: partner.pushToken,
          title,
          body,
          data: { url: '/matches' }
        });
      }
    }

    return matchId;
  },
});

// Update match status
export const updateStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.union(
      v.literal("matched"),
      v.literal("scheduled"),
      v.literal("completed")
    ),
    scheduledDate: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.matchId, {
      status: args.status,
      scheduledDate: args.scheduledDate,
      notes: args.notes,
      completedAt: args.status === "completed" ? Date.now() : undefined,
    });

    return args.matchId;
  },
});

// Get scheduled dates for a couple
export const getScheduledForCouple = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "completed")
        )
      )
      .order("asc")
      .collect();

    // Fetch proposal details for each match
    const matchesWithProposals = await Promise.all(
      matches.map(async (match) => {
        const proposal = await ctx.db.get(match.proposalId);
        return {
          ...match,
          proposal,
        };
      })
    );

    return matchesWithProposals;
  },
});

// Get stats for a couple (for profile screen)
// Uses userId (Convex _id) directly instead of ctx.auth (which requires ConvexProviderWithClerk)
export const getStatsForCouple = query({
  args: {
    coupleId: v.id("couples"),
    userId: v.optional(v.id("users")),
    clerkId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let user = null;

    // Use the userId arg directly (Convex _id passed from frontend)
    if (args.userId) {
      user = await ctx.db.get(args.userId);
    }

    // Fallback: try auth identity (in case ConvexProviderWithClerk is used)
    if (!user) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
          .first();
      }
    }

    if (!user) {
      return { sent: 0, sentSuccess: 0, received: 0, receivedSuccess: 0, completedDates: 0 };
    }

    // Get all proposals for the couple
    const proposals = await ctx.db
      .query("proposals")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    // Get all matches for the couple (used for achieved count)
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    // Sent: Proposals created by me
    const sentProposals = proposals.filter(p => p.createdBy === user!._id);
    const sent = sentProposals.length;

    // Received: Proposals created by partner (not me)
    const receivedProposals = proposals.filter(p => p.createdBy !== user!._id && p.createdBy !== undefined);
    const received = receivedProposals.length;

    // Achieved: Scheduled or Completed matches (not just "matched")
    const achieved = matches.filter(m => m.status === "scheduled" || m.status === "completed").length;

    // Also count confirmed plans
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();
    const confirmedPlans = plans.filter(p => p.status === "confirmed").length;

    const totalAchieved = achieved + confirmedPlans;

    // Calculating success rates
    const sentProposalIds = new Set(sentProposals.map(p => p._id));
    const receivedProposalIds = new Set(receivedProposals.map(p => p._id));

    const sentSuccess = matches.filter(m => sentProposalIds.has(m.proposalId)).length;
    const receivedSuccess = matches.filter(m => receivedProposalIds.has(m.proposalId)).length;

    return {
      sent,
      sentSuccess,
      received,
      receivedSuccess,
      completedDates: totalAchieved,
    };
  },
});

// Update partner's selected dates
export const updatePartnerDates = mutation({
  args: {
    matchId: v.id("matches"),
    partnerSelectedDates: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const match = await ctx.db.get(args.matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    await ctx.db.patch(args.matchId, {
      partnerSelectedDates: args.partnerSelectedDates,
    });

    return args.matchId;
  },
});
