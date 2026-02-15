import { MOCK_MATCHES } from '@/constants/MockData';
import { create } from 'zustand';

export type MatchType = 'star' | 'love' | 'nope';

export type Match = {
    id: string;
    name: string;
    image: string;
    type: MatchType;
    timestamp: number;
    candidateDates: string[]; // ISO Date Strings (YYYY-MM-DD)
    bio?: string;
    location?: string;
    age?: number;
    tags?: string[];
    price?: string;
    url?: string;
};

type MatchState = {
    matches: Match[];
    addMatch: (match: Omit<Match, 'timestamp' | 'candidateDates'>) => void;
    addCandidateDate: (id: string, date: string) => void;
    removeCandidateDate: (id: string, date: string) => void;
    resetMatches: () => void;
};

// Transform MOCK_MATCHES to Match type
const initialMatches: Match[] = MOCK_MATCHES.map((m) => ({
    id: m.id,
    name: m.proposal.title,
    image: m.proposal.image_url || 'https://placehold.co/600x400',
    type: m.priority === 1 ? 'star' : 'love',
    timestamp: new Date(m.matched_at).getTime(),
    candidateDates: [],
    bio: m.proposal.description,
    location: m.proposal.location,
    age: 25, // Mock
    tags: [m.proposal.category],
    price: m.proposal.price,
    url: m.proposal.url,
}));

export const useMatchStore = create<MatchState>((set) => ({
    matches: initialMatches,
    addMatch: (match) =>
        set((state) => ({
            matches: [
                { ...match, timestamp: Date.now(), candidateDates: [] },
                ...state.matches,
            ],
        })),
    addCandidateDate: (id, date) =>
        set((state) => ({
            matches: state.matches.map((m) => {
                if (m.id !== id) return m;
                const dates = m.candidateDates || [];
                if (!dates.includes(date)) {
                    return { ...m, candidateDates: [...dates, date] };
                }
                return m;
            }),
        })),
    removeCandidateDate: (id, date) =>
        set((state) => ({
            matches: state.matches.map((m) =>
                m.id === id
                    ? { ...m, candidateDates: (m.candidateDates || []).filter((d) => d !== date) }
                    : m
            ),
        })),
    resetMatches: () => set({ matches: [] }),
}));
