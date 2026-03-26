export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      admin_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: string
          token?: string
          used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          category: string
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          active: boolean | null
          audience: string
          created_at: string | null
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          headline: string
          id: string
          message: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          audience?: string
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          headline: string
          id?: string
          message: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          audience?: string
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          headline?: string
          id?: string
          message?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      creators: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          rank: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          rank?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          rank?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          company_name: string | null
          created_at: string | null
          credit_balance: number | null
          email: string
          id: string
          name: string | null
          phone: string | null
          status: string | null
          stripe_customer_id: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          credit_balance?: number | null
          email: string
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          credit_balance?: number | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          rank: number | null
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rank?: number | null
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rank?: number | null
          thumbnail_url?: string | null
        }
        Relationships: []
      }
      moods: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      pack_genres: {
        Row: {
          genre_id: string
          pack_id: string
        }
        Insert: {
          genre_id: string
          pack_id: string
        }
        Update: {
          genre_id?: string
          pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pack_genres_genre_id_fkey"
            columns: ["genre_id"]
            isOneToOne: false
            referencedRelation: "genres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pack_genres_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          category_id: string | null
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          download_count: number | null
          id: string
          is_featured: boolean | null
          is_premium: boolean | null
          name: string
          status: string
          tags: string[] | null
          trending_score: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          download_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          name: string
          status?: string
          tags?: string[] | null
          trending_score?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          download_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          name?: string
          status?: string
          tags?: string[] | null
          trending_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_tiers: {
        Row: {
          billing_cycle: string
          created_at: string | null
          credits_monthly: number
          description: string | null
          display_name: string
          features: string[] | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          original_price: number | null
          price: number
          sort_order: number
          stripe_price_id: string | null
          updated_at: string | null
          visible_onboarding: boolean
        }
        Insert: {
          billing_cycle?: string
          created_at?: string | null
          credits_monthly?: number
          description?: string | null
          display_name: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          original_price?: number | null
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string | null
          visible_onboarding?: boolean
        }
        Update: {
          billing_cycle?: string
          created_at?: string | null
          credits_monthly?: number
          description?: string | null
          display_name?: string
          features?: string[] | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          original_price?: number | null
          price?: number
          sort_order?: number
          stripe_price_id?: string | null
          updated_at?: string | null
          visible_onboarding?: boolean
        }
        Relationships: []
      }
      popups: {
        Row: {
          active: boolean | null
          audience: string
          created_at: string | null
          created_by: string | null
          cta_label: string | null
          cta_url: string | null
          frequency: string
          id: string
          message: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          audience?: string
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          frequency?: string
          id?: string
          message: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          audience?: string
          created_at?: string | null
          created_by?: string | null
          cta_label?: string | null
          cta_url?: string | null
          frequency?: string
          id?: string
          message?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      samples: {
        Row: {
          audio_url: string
          bpm: number | null
          created_at: string | null
          credit_cost: number | null
          download_count: number | null
          file_size_bytes: number | null
          has_stems: boolean | null
          id: string
          instrument: string | null
          key: string | null
          length: string | null
          metadata: Json | null
          name: string
          pack_id: string
          preview_audio_url: string | null
          release_date: string | null
          status: string
          thumbnail_url: string | null
          trending_score: number | null
          type: string
          updated_at: string | null
        }
        Insert: {
          audio_url: string
          bpm?: number | null
          created_at?: string | null
          credit_cost?: number | null
          download_count?: number | null
          file_size_bytes?: number | null
          has_stems?: boolean | null
          id?: string
          instrument?: string | null
          key?: string | null
          length?: string | null
          metadata?: Json | null
          name: string
          pack_id: string
          preview_audio_url?: string | null
          release_date?: string | null
          status?: string
          thumbnail_url?: string | null
          trending_score?: number | null
          type: string
          updated_at?: string | null
        }
        Update: {
          audio_url?: string
          bpm?: number | null
          created_at?: string | null
          credit_cost?: number | null
          download_count?: number | null
          file_size_bytes?: number | null
          has_stems?: boolean | null
          id?: string
          instrument?: string | null
          key?: string | null
          length?: string | null
          metadata?: Json | null
          name?: string
          pack_id?: string
          preview_audio_url?: string | null
          release_date?: string | null
          status?: string
          thumbnail_url?: string | null
          trending_score?: number | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samples_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_credit_downloads: {
        Row: {
          id: string
          user_id: string
          sample_id: string
          idempotency_key: string | null
          credits_charged: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          sample_id: string
          idempotency_key?: string | null
          credits_charged: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          sample_id?: string
          idempotency_key?: string | null
          credits_charged?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sample_credit_downloads_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      stems: {
        Row: {
          audio_url: string
          created_at: string | null
          file_size_bytes: number | null
          id: string
          name: string
          sample_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          name: string
          sample_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          file_size_bytes?: number | null
          id?: string
          name?: string
          sample_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stems_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          expires_at: string | null
          id: string
          started_at: string | null
          status: string | null
          stripe_price_id: string | null
          stripe_status: string | null
          stripe_subscription_id: string | null
          tier: string
          trial_end: string | null
          trial_start: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          tier: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_status?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pack_likes: {
        Row: {
          user_id: string
          pack_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          pack_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          pack_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pack_likes_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sample_likes: {
        Row: {
          user_id: string
          sample_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          sample_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          sample_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sample_likes_sample_id_fkey"
            columns: ["sample_id"]
            isOneToOne: false
            referencedRelation: "samples"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          invited_by: string | null
          is_admin: boolean | null
          last_login: string | null
          name: string | null
          role: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          invited_by?: string | null
          is_admin?: boolean | null
          last_login?: string | null
          name?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invited_by?: string | null
          is_admin?: boolean | null
          last_login?: string | null
          name?: string | null
          role?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_credits: {
        Args: {
          p_amount: number
          p_description?: string
          p_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      get_my_credit_activity: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      create_admin_user_record: {
        Args: {
          p_email: string
          p_id: string
          p_invited_by?: string
          p_name: string
          p_role?: string
        }
        Returns: undefined
      }
      deduct_credits: {
        Args: { p_cost: number; p_sample_id: string; p_user_id: string }
        Returns: boolean
      }
      request_sample_download_prepare: {
        Args: {
          p_idempotency_key?: string | null
          p_sample_id: string
          p_user_id: string
        }
        Returns: Json
      }
      get_all_categories: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          packs_count: number
        }[]
      }
      get_all_genres: {
        Args: never
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          packs_count: number
          samples_count: number
          thumbnail_url: string
        }[]
      }
      get_all_moods: {
        Args: never
        Returns: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }[]
      }
      get_all_packs: {
        Args: {
          p_access?: string
          p_creators?: string[]
          p_genres?: string[]
          p_keywords?: string[]
          p_license?: string
          p_limit?: number
          p_offset?: number
          p_released?: string
          p_search?: string
          p_sort?: string
        }
        Returns: {
          category_id: string
          category_name: string
          cover_url: string
          created_at: string
          creator_id: string
          creator_name: string
          download_count: number
          genres: string[]
          id: string
          is_premium: boolean
          name: string
          samples_count: number
          status: string
          tags: string[]
          total_count: number
        }[]
      }
      get_all_samples: {
        Args: {
          p_bpm_exact?: number
          p_bpm_max?: number
          p_bpm_min?: number
          p_genres?: string[]
          p_instrument?: string
          p_key_quality?: string
          p_keys?: string[]
          p_keywords?: string[]
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort?: string
          p_stems?: string
          p_type?: string
        }
        Returns: {
          bpm: number
          created_at: string
          creator_id: string
          creator_name: string
          credit_cost: number
          download_count: number
          genre: string
          has_stems: boolean
          id: string
          instrument: string | null
          key: string
          metadata: Json
          name: string
          pack_id: string
          pack_name: string
          preview_audio_url: string
          status: string
          stems_count: number
          thumbnail_url: string
          total_count: number
          type: string
        }[]
      }
      get_auth_user_id_by_email: { Args: { p_email: string }; Returns: string }
      get_creator_by_id: { Args: { p_creator_id: string }; Returns: Json }
      get_creators_with_counts: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          avatar_url: string
          id: string
          name: string
          packs_count: number
          samples_count: number
        }[]
      }
      get_featured_creators: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          packs_count: number
          rank: number
          samples_count: number
          updated_at: string
        }[]
      }
      get_featured_packs: {
        Args: never
        Returns: {
          category_name: string
          cover_url: string
          created_at: string
          creator_id: string
          creator_name: string
          description: string
          download_count: number
          id: string
          is_featured: boolean
          is_premium: boolean
          name: string
          samples_count: number
          status: string
          tags: string[]
          updated_at: string
        }[]
      }
      get_genre_detail_by_id: { Args: { p_genre_id: string }; Returns: Json }
      get_home_feed: { Args: never; Returns: Json }
      get_invite_by_token: {
        Args: { p_token: string }
        Returns: {
          email: string
          expires_at: string
          role: string
        }[]
      }
      get_my_billing_info: { Args: never; Returns: Json }
      get_new_releases: {
        Args: never
        Returns: {
          audio_url: string
          bpm: number
          created_at: string
          creator_name: string
          download_count: number
          genre: string
          has_stems: boolean
          id: string
          key: string
          metadata: Json
          name: string
          pack_id: string
          pack_name: string
          release_date: string
          status: string
          stems_count: number
          thumbnail_url: string
          trending_score: number
          type: string
        }[]
      }
      get_pack_by_id: { Args: { p_pack_id: string }; Returns: Json }
      get_pack_sample_count: { Args: { pack_uuid: string }; Returns: number }
      get_stripe_products: {
        Args: { visible_onboarding?: boolean }
        Returns: Json
      }
      get_top_creators: {
        Args: never
        Returns: {
          avatar_url: string
          id: string
          name: string
          packs_count: number
          rank: number
          samples_count: number
        }[]
      }
      get_top_ranked_genres: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          packs_count: number
          rank: number
          thumbnail_url: string
        }[]
      }
      get_trending_samples: {
        Args: never
        Returns: {
          audio_url: string
          bpm: number
          created_at: string
          creator_name: string
          download_count: number
          genre: string
          has_stems: boolean
          id: string
          key: string
          metadata: Json
          name: string
          pack_id: string
          pack_name: string
          release_date: string
          status: string
          stems_count: number
          thumbnail_url: string
          trending_score: number
          type: string
        }[]
      }
      has_sufficient_credits: {
        Args: { p_cost: number; p_user_id: string }
        Returns: boolean
      }
      increment_pack_downloads: {
        Args: { pack_uuid: string }
        Returns: undefined
      }
      increment_sample_downloads: {
        Args: { sample_uuid: string }
        Returns: undefined
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      search_library: {
        Args: { p_context?: string; p_query: string }
        Returns: Json
      }
      update_user_last_login: {
        Args: { p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "full_admin" | "content_editor"
      user_status: "active" | "pending" | "disabled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      user_role: ["full_admin", "content_editor"],
      user_status: ["active", "pending", "disabled"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
