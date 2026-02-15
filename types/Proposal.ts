export type Proposal = {
    id: string;
    title: string;
    description: string;
    images: string[];
    category: 'date_spot' | 'restaurant' | 'activity' | 'travel' | 'adult' | 'other';
    location?: string;
    url?: string;
    price?: string;
    candidateDates?: string[];
    createdAt: Date;
    image_url?: string;
    isAd?: boolean;
};
