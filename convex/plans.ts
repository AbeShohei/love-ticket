import { v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// Get plans for a couple
export const getForCouple = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .order("desc")
      .collect();

    // Fetch proposal details for each plan
    const plansWithProposals = await Promise.all(
      plans.map(async (plan) => {
        const proposals = await Promise.all(
          plan.proposalIds.map((id) => ctx.db.get(id))
        );
        return {
          ...plan,
          proposals: proposals.filter(Boolean),
        };
      })
    );

    return plansWithProposals;
  },
});

// Get a single plan by ID
export const getById = query({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.id);
    if (!plan) return null;

    const proposals = await Promise.all(
      plan.proposalIds.map((id) => ctx.db.get(id))
    );

    return {
      ...plan,
      proposals: proposals.filter(Boolean),
    };
  },
});

// Create a new plan
export const create = mutation({
  args: {
    coupleId: v.id("couples"),
    title: v.string(),
    proposalIds: v.array(v.id("proposals")),
    candidateSlots: v.array(v.object({
      date: v.string(),
      time: v.optional(v.string()),
    })),
    createdBy: v.id("users"),
    // Optional fields for immediate confirmation
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("proposed"),
      v.literal("confirmed")
    )),
    finalDate: v.optional(v.string()),
    finalTime: v.optional(v.string()),
    meetingPlace: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const planId = await ctx.db.insert("plans", {
      coupleId: args.coupleId,
      title: args.title,
      proposalIds: args.proposalIds,
      candidateSlots: args.candidateSlots,
      status: args.status || "draft",
      finalDate: args.finalDate,
      finalTime: args.finalTime,
      meetingPlace: args.meetingPlace,
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });

    // Notify partner if confirmed
    if (args.status === "confirmed") {
      const users = await ctx.db
        .query("users")
        .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
        .collect();

      const partner = users.find(u => u._id !== args.createdBy);

      if (partner && partner.pushToken) {
        const dateStr = args.finalDate ? new Date(args.finalDate).toLocaleDateString() : '';
        await ctx.scheduler.runAfter(0, api.actions.notifications.sendPush, {
          pushToken: partner.pushToken,
          title: "デートプランが確定しました！",
          body: `「${args.title}」の日程が決まりました！${dateStr}`,
          data: { url: '/matches' }
        });
      }
    }

    return planId;
  },
});

// Update a plan
export const update = mutation({
  args: {
    id: v.id("plans"),
    title: v.optional(v.string()),
    proposalIds: v.optional(v.array(v.id("proposals"))),
    candidateSlots: v.optional(v.array(v.object({
      date: v.string(),
      time: v.optional(v.string()),
    }))),
    finalDate: v.optional(v.string()),
    finalTime: v.optional(v.string()),
    meetingPlace: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("proposed"),
      v.literal("confirmed")
    )),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);

    // Notify partner if confirmed
    if (args.status === "confirmed") {
        const identity = await ctx.auth.getUserIdentity();
        if (identity) {
            const plan = await ctx.db.get(id);
            if (plan) {
                const users = await ctx.db
                    .query("users")
                    .withIndex("by_couple_id", (q) => q.eq("coupleId", plan.coupleId))
                    .collect();

                const partner = users.find(u => u.clerkId !== identity.subject);
                
                if (partner && partner.pushToken) {
                    const dateStr = args.finalDate ? new Date(args.finalDate).toLocaleDateString() : '';
                    await ctx.scheduler.runAfter(0, api.actions.notifications.sendPush, {
                        pushToken: partner.pushToken,
                        title: "デートプランが確定しました！",
                        body: `「${plan.title}」の日程が決まりました！${dateStr}`, // Use plan.title as title might not be in args
                        data: { url: '/matches' }
                    });
                }
            }
        }
    }

    return id;
  },
});

// Delete a plan
export const remove = mutation({
  args: { id: v.id("plans") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});

// Get confirmed plans for schedule
export const getConfirmedForCouple = query({
  args: { coupleId: v.id("couples") },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .filter((q) => q.eq(q.field("status"), "confirmed"))
      .order("asc")
      .collect();

    // Fetch proposal details for each plan
    const plansWithProposals = await Promise.all(
      plans.map(async (plan) => {
        const proposals = await Promise.all(
          plan.proposalIds.map((id) => ctx.db.get(id))
        );
        return {
          ...plan,
          proposals: proposals.filter(Boolean),
        };
      })
    );

    return plansWithProposals;
  },
});
