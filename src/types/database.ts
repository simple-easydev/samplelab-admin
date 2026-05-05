export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          is_admin: boolean;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          is_admin?: boolean;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          is_admin?: boolean;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_invites: {
        Row: {
          id: string;
          email: string;
          role: string;
          invited_by: string | null;
          token: string;
          expires_at: string;
          used: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: string;
          invited_by?: string | null;
          token: string;
          expires_at: string;
          used?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          used?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          user_id: string | null;
          email: string;
          name: string | null;
          company_name: string | null;
          phone: string | null;
          subscription_tier: string;
          credit_balance: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email: string;
          name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          subscription_tier?: string;
          credit_balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string;
          name?: string | null;
          company_name?: string | null;
          phone?: string | null;
          subscription_tier?: string;
          credit_balance?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      creators: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          bio: string | null;
          avatar_url: string | null;
          is_active: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      packs: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          creator_id: string | null;
          cover_url: string | null;
          category_id: string | null;
          tags: string[] | null;
          is_premium: boolean | null;
          status: string;
          download_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          creator_id?: string | null;
          cover_url?: string | null;
          category_id?: string | null;
          tags?: string[] | null;
          is_premium?: boolean | null;
          status?: string;
          download_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          creator_id?: string | null;
          cover_url?: string | null;
          category_id?: string | null;
          tags?: string[] | null;
          is_premium?: boolean | null;
          status?: string;
          download_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      samples: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          file_url: string;
          file_size: number;
          download_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          file_url: string;
          file_size: number;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          file_url?: string;
          file_size?: number;
          download_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          customer_id: string;
          tier: string;
          status: string;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          stripe_status: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          trial_start: string | null;
          trial_end: string | null;
        };
        Insert: {
          id?: string;
          customer_id: string;
          tier: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_status?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          tier?: string;
          status?: string;
          started_at?: string;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          stripe_status?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          trial_start?: string | null;
          trial_end?: string | null;
        };
        Relationships: [];
      };
      plan_tiers: {
        Row: {
          id: string;
          name: string;
          display_name: string;
          description: string | null;
          billing_cycle: string;
          price: number;
          original_price: number | null;
          credits_monthly: number;
          is_popular: boolean;
          is_active: boolean;
          features: string[];
          sort_order: number;
          stripe_price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name: string;
          description?: string | null;
          billing_cycle?: string;
          price?: number;
          original_price?: number | null;
          credits_monthly?: number;
          is_popular?: boolean;
          is_active?: boolean;
          features?: string[];
          sort_order?: number;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string;
          description?: string | null;
          billing_cycle?: string;
          price?: number;
          original_price?: number | null;
          credits_monthly?: number;
          is_popular?: boolean;
          is_active?: boolean;
          features?: string[];
          sort_order?: number;
          stripe_price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_activity: {
        Row: {
          id: string;
          customer_id: string;
          user_id: string | null;
          delta: number;
          balance_before: number;
          balance_after: number;
          activity_type: string;
          source_type: string;
          source_ref: string | null;
          note: string | null;
          metadata: Json;
          sample_id: string | null;
          subscription_id: string | null;
          actor_user_id: string | null;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          user_id?: string | null;
          delta: number;
          balance_before: number;
          balance_after: number;
          activity_type: string;
          source_type: string;
          source_ref?: string | null;
          note?: string | null;
          metadata?: Json;
          sample_id?: string | null;
          subscription_id?: string | null;
          actor_user_id?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          user_id?: string | null;
          delta?: number;
          balance_before?: number;
          balance_after?: number;
          activity_type?: string;
          source_type?: string;
          source_ref?: string | null;
          note?: string | null;
          metadata?: Json;
          sample_id?: string | null;
          subscription_id?: string | null;
          actor_user_id?: string | null;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      get_all_samples: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_trending_samples: {
        Args: Record<string, never>;
        Returns: Json;
      };
      get_top_creators: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
  };
}
