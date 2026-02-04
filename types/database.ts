export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          is_admin: boolean
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          is_admin?: boolean
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          is_admin?: boolean
          role?: string
          created_at?: string
          updated_at?: string
        }
      }
      admin_invites: {
        Row: {
          id: string
          email: string
          role: string
          invited_by: string | null
          token: string
          expires_at: string
          used: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          invited_by?: string | null
          token: string
          expires_at: string
          used?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          invited_by?: string | null
          token?: string
          expires_at?: string
          used?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string | null
          email: string
          name: string | null
          company_name: string | null
          phone: string | null
          subscription_tier: string
          credit_balance: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          email: string
          name?: string | null
          company_name?: string | null
          phone?: string | null
          subscription_tier?: string
          credit_balance?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          email?: string
          name?: string | null
          company_name?: string | null
          phone?: string | null
          subscription_tier?: string
          credit_balance?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      samples: {
        Row: {
          id: string
          title: string
          description: string | null
          file_url: string
          file_size: number
          download_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          file_url: string
          file_size: number
          download_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_size?: number
          download_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: string
          status: string
          started_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: string
          status?: string
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          status?: string
          started_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
