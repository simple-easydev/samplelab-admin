export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  role: "full_admin" | "content_editor";
  status: "active" | "pending" | "disabled";
  last_login: string | null;
  invited_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
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
}

export interface Sample {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total_users: number;
  total_customers: number;
  /** Stripe-paid subscriptions (`status` = active), excluding trial. */
  active_subscriptions: number;
  /** Subscriptions currently in Stripe trial (`status` = trialing). */
  active_trialing_subscriptions: number;
  total_packs: number;
  total_samples: number;
  total_creators: number;
  total_downloads?: number;
  /** Rows in credit_activity for sample downloads in the last 30 days. */
  downloads_last_30d: number;
  /** App users (public.users) created in the last 30 days. */
  new_users_last_30d: number;
}

export interface AdminInvite {
  id: string;
  email: string;
  role: "full_admin" | "content_editor";
  invited_by: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  headline: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  audience: "all" | "logged-in";
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Popup {
  id: string;
  title: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  audience: "all" | "subscribers" | "trial";
  frequency: "once" | "until-dismissed";
  active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
