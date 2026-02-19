import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - synced from Clerk
  users: defineTable({
    clerkId: v.string(),           // Clerk user ID
    email: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coupleId: v.optional(v.id("couples")),
    anniversaryDate: v.optional(v.number()), // Anniversary timestamp
    subscriptionStatus: v.optional(v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("active"),
      v.literal("expired")
    )),
    subscriptionTier: v.optional(v.union(
      v.literal("monthly"),
      v.literal("yearly")
    )),
    subscriptionExpiry: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"])
    .index("by_couple_id", ["coupleId"]),

  // Couples table
  couples: defineTable({
    inviteCode: v.string(),        // 6-char unique code
    status: v.union(
      v.literal("pending"),
      v.literal("active")
    ),
    createdAt: v.number(),
    activatedAt: v.optional(v.number()),
  }).index("by_invite_code", ["inviteCode"]),

  // Proposals table (date ideas)
  proposals: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    imageUrl: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    imageStorageIds: v.optional(v.array(v.id("_storage"))),
    price: v.optional(v.string()),
    location: v.optional(v.string()),
    url: v.optional(v.string()),
    createdBy: v.optional(v.id("users")),      // null for presets
    coupleId: v.optional(v.id("couples")),     // null for global presets
    candidateDates: v.optional(v.array(v.string())),
    isPreset: v.boolean(),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_couple_id", ["coupleId"])
    .index("by_created_by", ["createdBy"]),

  // Swipes table
  swipes: defineTable({
    userId: v.id("users"),
    proposalId: v.id("proposals"),
    direction: v.union(
      v.literal("left"),
      v.literal("right"),
      v.literal("super_like")
    ),
    createdAt: v.number(),
  }).index("by_user_id", ["userId"])
    .index("by_proposal_id", ["proposalId"])
    .index("by_user_proposal", ["userId", "proposalId"]),

  // Matches table (when both users swipe right)
  matches: defineTable({
    coupleId: v.id("couples"),
    proposalId: v.id("proposals"),
    matchedAt: v.number(),
    completedAt: v.optional(v.number()),
    status: v.union(
      v.literal("matched"),
      v.literal("scheduled"),
      v.literal("completed")
    ),
    scheduledDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    partnerSelectedDates: v.optional(v.array(v.string())),
  }).index("by_couple_id", ["coupleId"])
    .index("by_proposal_id", ["proposalId"]),

  // Daily usage tracking
  dailyUsage: defineTable({
    userId: v.id("users"),
    date: v.string(),              // YYYY-MM-DD format
    likeCount: v.number(),
    superLikeCount: v.number(),
    proposalCreateCount: v.number(),
  }).index("by_user_date", ["userId", "date"]),

  // Plans table (date planning)
  plans: defineTable({
    coupleId: v.id("couples"),
    title: v.string(),
    proposalIds: v.array(v.id("proposals")),
    candidateSlots: v.array(v.object({
      date: v.string(),
      time: v.optional(v.string()),
    })),
    finalDate: v.optional(v.string()),
    finalTime: v.optional(v.string()),
    meetingPlace: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("proposed"),
      v.literal("confirmed")
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
  }).index("by_couple_id", ["coupleId"]),
});
