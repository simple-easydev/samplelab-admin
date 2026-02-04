export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  role: "full_admin" | "content_editor";
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
  active_subscriptions: number;
  total_samples: number;
  total_downloads: number;
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
