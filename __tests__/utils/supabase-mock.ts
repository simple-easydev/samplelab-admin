import { createClient } from '@supabase/supabase-js'

// Mock Supabase client types
export const mockSupabaseClient = {
  auth: {
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    exchangeCodeForSession: jest.fn(),
    setSession: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
}

// Mock Supabase Admin client
export const mockSupabaseAdminClient = {
  ...mockSupabaseClient,
  auth: {
    ...mockSupabaseClient.auth,
    admin: {
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserById: jest.fn(),
      listUsers: jest.fn(),
    },
  },
}

// Mock createBrowserClient
export const createBrowserClient = jest.fn(() => mockSupabaseClient)

// Mock createServerClient
export const createServerClient = jest.fn(() => mockSupabaseClient)

// Mock createAdminClient
export const createAdminClient = jest.fn(() => mockSupabaseAdminClient)

// Reset all mocks
export const resetAllMocks = () => {
  Object.values(mockSupabaseClient.auth).forEach((fn: any) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear()
    }
  })
  mockSupabaseClient.from.mockClear()
  mockSupabaseClient.rpc.mockClear()
  Object.values(mockSupabaseAdminClient.auth.admin).forEach((fn: any) => {
    if (typeof fn === 'function' && fn.mockClear) {
      fn.mockClear()
    }
  })
  createBrowserClient.mockClear()
  createServerClient.mockClear()
  createAdminClient.mockClear()
}

// Mock Supabase module
jest.mock('@/lib/supabase-browser', () => ({
  createBrowserClient,
}))

jest.mock('@/lib/supabase-server', () => ({
  createServerClient,
  createAdminClient,
}))
