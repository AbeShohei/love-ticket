export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    graphql_public: {
        Tables: {
            [_ in never]: never
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            graphql: {
                Args: {
                    operationName?: string
                    query?: string
                    variables?: Json
                    extensions?: Json
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
    public: {
        Tables: {
            couples: {
                Row: {
                    created_at: string | null
                    id: string
                    invite_code: string
                    status: string | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    invite_code: string
                    status?: string | null
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    invite_code?: string
                    status?: string | null
                }
                Relationships: []
            }
            daily_usage: {
                Row: {
                    id: string
                    like_count: number | null
                    proposal_create_count: number | null
                    super_like_count: number | null
                    usage_date: string | null
                    user_id: string | null
                }
                Insert: {
                    id?: string
                    like_count?: number | null
                    proposal_create_count?: number | null
                    super_like_count?: number | null
                    usage_date?: string | null
                    user_id?: string | null
                }
                Update: {
                    id?: string
                    like_count?: number | null
                    proposal_create_count?: number | null
                    super_like_count?: number | null
                    usage_date?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "daily_usage_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            matches: {
                Row: {
                    completed_at: string | null
                    couple_id: string | null
                    id: string
                    matched_at: string | null
                    priority: number | null
                    proposal_id: string | null
                    status: string | null
                }
                Insert: {
                    completed_at?: string | null
                    couple_id?: string | null
                    id?: string
                    matched_at?: string | null
                    priority?: number | null
                    proposal_id?: string | null
                    status?: string | null
                }
                Update: {
                    completed_at?: string | null
                    couple_id?: string | null
                    id?: string
                    matched_at?: string | null
                    priority?: number | null
                    proposal_id?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "matches_couple_id_fkey"
                        columns: ["couple_id"]
                        isOneToOne: false
                        referencedRelation: "couples"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "matches_proposal_id_fkey"
                        columns: ["proposal_id"]
                        isOneToOne: false
                        referencedRelation: "proposals"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    couple_id: string | null
                    created_at: string | null
                    display_name: string | null
                    id: string
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    couple_id?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    id: string
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    couple_id?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    id?: string
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "fk_couple"
                        columns: ["couple_id"]
                        isOneToOne: false
                        referencedRelation: "couples"
                        referencedColumns: ["id"]
                    },
                ]
            }
            proposals: {
                Row: {
                    category: string
                    couple_id: string | null
                    created_at: string | null
                    created_by: string | null
                    description: string | null
                    id: string
                    image_url: string | null
                    is_active: boolean | null
                    is_preset: boolean | null
                    title: string
                }
                Insert: {
                    category: string
                    couple_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean | null
                    is_preset?: boolean | null
                    title: string
                }
                Update: {
                    category?: string
                    couple_id?: string | null
                    created_at?: string | null
                    created_by?: string | null
                    description?: string | null
                    id?: string
                    image_url?: string | null
                    is_active?: boolean | null
                    is_preset?: boolean | null
                    title?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "proposals_couple_id_fkey"
                        columns: ["couple_id"]
                        isOneToOne: false
                        referencedRelation: "couples"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "proposals_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subscriptions: {
                Row: {
                    couple_id: string | null
                    expires_at: string | null
                    id: string
                    is_active: boolean | null
                    plan: string | null
                    starts_at: string | null
                }
                Insert: {
                    couple_id?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    plan?: string | null
                    starts_at?: string | null
                }
                Update: {
                    couple_id?: string | null
                    expires_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    plan?: string | null
                    starts_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "subscriptions_couple_id_fkey"
                        columns: ["couple_id"]
                        isOneToOne: false
                        referencedRelation: "couples"
                        referencedColumns: ["id"]
                    },
                ]
            }
            swipes: {
                Row: {
                    created_at: string | null
                    direction: string
                    id: string
                    proposal_id: string | null
                    user_id: string | null
                }
                Insert: {
                    created_at?: string | null
                    direction: string
                    id?: string
                    proposal_id?: string | null
                    user_id?: string | null
                }
                Update: {
                    created_at?: string | null
                    direction?: string
                    id?: string
                    proposal_id?: string | null
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "swipes_proposal_id_fkey"
                        columns: ["proposal_id"]
                        isOneToOne: false
                        referencedRelation: "proposals"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "swipes_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
