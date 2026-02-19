// Category type matching Convex schema
export type ProposalCategory = 'date_spot' | 'restaurant' | 'activity' | 'travel' | 'adult' | 'other';

// Frontend Proposal type (unified with Convex schema)
export type Proposal = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;       // Main image (camelCase, matches Convex)
  images?: string[];       // Gallery images
  category: ProposalCategory;
  location?: string;
  url?: string;
  price?: string;
  createdBy?: string;      // User ID who created (null for presets)
  coupleId?: string;       // Couple ID (null for global presets)
  isPreset?: boolean;      // True for preset proposals
  isActive?: boolean;      // Soft delete flag
  candidateDates?: string[];
  createdAt: number | Date;
  isAd?: boolean;          // Frontend-only flag for ads
};

// Helper function to convert Convex document to frontend Proposal
export function fromConvexProposal(doc: any): Proposal {
  return {
    id: doc._id,
    title: doc.title,
    description: doc.description,
    imageUrl: doc.imageUrl,
    images: doc.images,
    category: doc.category,
    location: doc.location,
    url: doc.url,
    price: doc.price,
    candidateDates: doc.candidateDates,
    createdBy: doc.createdBy,
    coupleId: doc.coupleId,
    isPreset: doc.isPreset,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
  };
}
