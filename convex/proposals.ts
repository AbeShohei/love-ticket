import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get preset proposals (global)
export const getPresets = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("proposals")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPreset"), true),
          q.eq(q.field("isActive"), true)
        )
      );

    // Note: Convex doesn't support dynamic filter chains well
    // For now, filter in memory (small dataset expected for presets)
    const presets = await query.collect();

    if (args.category) {
      return presets.filter((p) => p.category === args.category);
    }

    return presets;
  },
});

// Get proposals for a couple (custom + presets)
export const getForCouple = query({
  args: {
    coupleId: v.id("couples"),
    includePresets: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get couple's custom proposals
    const customProposals = await ctx.db
      .query("proposals")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.includePresets === false) {
      return customProposals;
    }

    // Get presets
    const presets = await ctx.db
      .query("proposals")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPreset"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();



    // Resize images
    const proposals = [...customProposals, ...presets];

    return await Promise.all(proposals.map(async (p) => {
      if (p.imageStorageIds && p.imageStorageIds.length > 0) {
        const urls = await Promise.all(p.imageStorageIds.map((id) => ctx.storage.getUrl(id)));
        const validUrls = urls.filter(Boolean) as string[];
        if (validUrls.length > 0) {
          return { ...p, images: validUrls, imageUrl: validUrls[0] };
        }
      }
      return p;
    }));
  },
});

// Get proposal by ID
export const getById = query({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    const proposal = await ctx.db.get(args.id);
    if (!proposal) return null;

    if (proposal.imageStorageIds && proposal.imageStorageIds.length > 0) {
      const urls = await Promise.all(proposal.imageStorageIds.map((id) => ctx.storage.getUrl(id)));
      const validUrls = urls.filter(Boolean) as string[];
      if (validUrls.length > 0) {
        return { ...proposal, images: validUrls, imageUrl: validUrls[0] };
      }
    }
    return proposal;
  },
});

// Create a custom proposal
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    candidateDates: v.optional(v.array(v.string())),
    createdBy: v.id("users"),
    coupleId: v.id("couples"),
  },
  handler: async (ctx, args) => {
    let imageUrl = args.imageUrl;
    let images = args.images || [];

    // If storage IDs provided, get URLs
    if (args.imageStorageIds && args.imageStorageIds.length > 0) {
      const urls = await Promise.all(
        args.imageStorageIds.map(async (id) => {
          const url = await ctx.storage.getUrl(id);
          return url;
        })
      );
      images = urls.filter(Boolean) as string[];
      imageUrl = images[0] || imageUrl;
    }

    const proposalId = await ctx.db.insert("proposals", {
      title: args.title,
      description: args.description,
      category: args.category,
      imageUrl,
      images,
      imageStorageIds: args.imageStorageIds,
      price: args.price,
      location: args.location,
      url: args.url,
      createdBy: args.createdBy,
      coupleId: args.coupleId,
      candidateDates: args.candidateDates,
      isPreset: false,
      isActive: true,
      createdAt: Date.now(),
    });

    // Auto-swipe right for creator so it doesn't show in their stack
    // and matches immediately when partner swipes
    await ctx.db.insert("swipes", {

      userId: args.createdBy,
      proposalId: proposalId,
      direction: "right",
      createdAt: Date.now(),
    });

    return proposalId;
  },
});

// Update a proposal
export const update = mutation({
  args: {
    id: v.id("proposals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );

    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

// Soft delete a proposal
export const remove = mutation({
  args: { id: v.id("proposals") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isActive: false });
    return args.id;
  },
});

// Get swipable proposals for user (excludes already swiped)
export const getSwipableForUser = query({
  args: {
    coupleId: v.id("couples"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get user's existing swipes
    const swipes = await ctx.db
      .query("swipes")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const swipedIds = new Set(swipes.map((s) => s.proposalId));

    // Get couple's custom proposals
    const customProposals = await ctx.db
      .query("proposals")
      .withIndex("by_couple_id", (q) => q.eq("coupleId", args.coupleId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get presets
    const presets = await ctx.db
      .query("proposals")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPreset"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    // Combine and filter
    const allProposals = [...customProposals, ...presets];
    const filtered = allProposals.filter((p) => !swipedIds.has(p._id));

    return await Promise.all(filtered.map(async (p) => {
      if (p.imageStorageIds && p.imageStorageIds.length > 0) {
        const urls = await Promise.all(p.imageStorageIds.map((id) => ctx.storage.getUrl(id)));
        const validUrls = urls.filter(Boolean) as string[];
        if (validUrls.length > 0) {
          return { ...p, images: validUrls, imageUrl: validUrls[0] };
        }
      }
      return p;
    }));
  },
});

// Get explore spots (preset proposals) by category
export const getExploreSpots = query({
  args: {
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const presets = await ctx.db
      .query("proposals")
      .filter((q) =>
        q.and(
          q.eq(q.field("isPreset"), true),
          q.eq(q.field("isActive"), true)
        )
      )
      .collect();

    if (args.category) {
      return presets.filter((p) => p.category === args.category);
    }

    return presets;
  },
});
