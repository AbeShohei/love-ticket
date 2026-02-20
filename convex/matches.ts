import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";
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

    // Return default stats if user not found
    if (!user) {
      return {
        sent: 0,
        sentTotal: 1,
        received: 0,
        receivedTotal: 1,
        completedDates: 0,
        totalMatches: 5,
      };
    }

    // Get partner info
    const coupleUsers = await ctx.db
      .query("users")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    const partner = coupleUsers.find(u => u._id !== user!._id);

    // Count proposals created by each user
    const myProposals = await ctx.db
      .query("proposals")
      .withIndex("by_created_by", (q) => q.eq("createdBy", user!._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const partnerProposals = partner
      ? await ctx.db
          .query("proposals")
          .withIndex("by_created_by", (q) => q.eq("createdBy", partner._id))
          .filter((q) => q.eq(q.field("isActive"), true))
          .collect()
      : [];

    // Sent = proposals I created, Received = proposals partner created
    const sentCount = myProposals.length;
    const receivedCount = partnerProposals.length;
    const totalProposals = sentCount + receivedCount; // Total for ring ratio

    // Get all matches for the couple (for achievement ring)
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    // Count completed matches by proposal creator
    let sentAchieved = 0; // My proposals that were completed
    let receivedAchieved = 0; // Partner's proposals that were completed

    for (const match of matches) {
      if (match.status === "scheduled" || match.status === "completed") {
        const proposal = await ctx.db.get(match.proposalId);
        if (proposal) {
          if (proposal.createdBy === user!._id) {
            sentAchieved++;
          } else if (partner && proposal.createdBy === partner._id) {
            receivedAchieved++;
          }
        }
      }
    }

    // Also count confirmed plans by proposal creator
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .collect();

    for (const plan of plans) {
      if (plan.status === "confirmed") {
        // Check each proposal in the plan
        for (const proposalId of plan.proposalIds) {
          const proposal = await ctx.db.get(proposalId as Id<"proposals">);
          if (proposal && proposal.createdBy) {
            if (proposal.createdBy === user!._id) {
              sentAchieved++;
            } else if (partner && proposal.createdBy === partner._id) {
              receivedAchieved++;
            }
          }
        }
      }
    }

    const totalAchieved = sentAchieved + receivedAchieved;

    return {
      sent: sentCount,
      sentTotal: Math.max(totalProposals, 1), // Ring ratio: my proposals / total proposals
      received: receivedCount,
      receivedTotal: Math.max(totalProposals, 1), // Ring ratio: partner proposals / total proposals
      completedDates: totalAchieved,
      totalMatches: Math.max(matches.length, 1), // Ring ratio: completed / total matches
      sentAchieved, // My proposals that were completed
      receivedAchieved, // Partner's proposals that were completed
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

    console.log("[DEBUG] updatePartnerDates called for match:", args.matchId, "dates:", args.partnerSelectedDates);

    await ctx.db.patch(args.matchId, {
      partnerSelectedDates: args.partnerSelectedDates,
    });

    console.log("[DEBUG] updatePartnerDates completed");
    return args.matchId;
  },
});
