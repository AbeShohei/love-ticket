import { create } from 'zustand';

export type MatchType = 'star' | 'love' | 'nope';

export type Match = {
  id: string;
  name: string;
  image: string;
  type: MatchType;
  timestamp: number;
  candidateDates: string[];
  bio?: string;
  location?: string;
  age?: number;
  tags?: string[];
  price?: string;
  url?: string;
  createdBy?: string;
  partnerSelectedDates?: string[];
  convexMatchId?: string;
};

type MatchState = {
  matches: Match[];
  addMatch: (match: Omit<Match, 'timestamp'>) => void;
  addCandidateDate: (id: string, date: string) => void;
  removeCandidateDate: (id: string, date: string) => void;
  resetMatches: () => void;
  setMatches: (matches: Match[]) => void;
};

export const useMatchStore = create<MatchState>((set) => ({
  matches: [],
  addMatch: (match) =>
    set((state) => ({
      matches: [
        { ...match, timestamp: Date.now(), candidateDates: match.candidateDates || [] },
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
  setMatches: (matches) => set({ matches }),
}));
