
import { create } from 'zustand';

export type CandidateSlot = {
    date: string; // YYYY-MM-DD
    time?: string; // HH:mm
};

export type Plan = {
    id: string;
    title: string;
    description?: string;
    proposalIds: string[];
    candidateSlots: CandidateSlot[];
    finalDate?: string; // YYYY-MM-DD
    finalTime?: string; // HH:mm
    meetingPlace?: string;
    status: 'draft' | 'proposed' | 'confirmed';
    createdAt: number;
};

type PlanState = {
    plans: Plan[];
    addPlan: (plan: Omit<Plan, 'id' | 'createdAt'>) => void;
    updatePlan: (id: string, updates: Partial<Plan>) => void;
    removePlan: (id: string) => void;
};

export const usePlanStore = create<PlanState>((set) => ({
    plans: [],
    addPlan: (plan) =>
        set((state) => ({
            plans: [
                {
                    ...plan,
                    id: Math.random().toString(36).substring(7),
                    createdAt: Date.now(),
                },
                ...state.plans,
            ],
        })),
    updatePlan: (id, updates) =>
        set((state) => ({
            plans: state.plans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
    removePlan: (id) =>
        set((state) => ({
            plans: state.plans.filter((p) => p.id !== id),
        })),
}));
