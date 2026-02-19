import { create } from 'zustand';
import { Proposal } from '../types/Proposal';

export type SwipeDirection = 'left' | 'right' | 'up';

export type SwipeRecord = {
    id: string;
    direction: SwipeDirection;
    proposal: Proposal;
    timestamp: number;
};

type SwipeState = {
    history: SwipeRecord[];
    addSwipe: (proposal: Proposal, direction: SwipeDirection) => void;
    updateSwipeDirection: (id: string, direction: SwipeDirection) => void;
    removeFromHistory: (id: string) => void;
    clearHistory: () => void;
};

export const useSwipeStore = create<SwipeState>((set) => ({
    history: [],
    addSwipe: (proposal, direction) =>
        set((state) => {
            // Remove if already exists to move to top
            const filteredHistory = state.history.filter((h) => h.id !== proposal.id);
            return {
                history: [
                    { id: proposal.id, direction, proposal, timestamp: Date.now() },
                    ...filteredHistory,
                ].slice(0, 50), // Keep last 50
            };
        }),
    updateSwipeDirection: (id, direction) =>
        set((state) => ({
            history: state.history.map((record) =>
                record.id === id ? { ...record, direction, timestamp: Date.now() } : record
            ),
        })),
    removeFromHistory: (id) =>
        set((state) => ({
            history: state.history.filter((record) => record.id !== id),
        })),
    clearHistory: () => set({ history: [] }),
}));
