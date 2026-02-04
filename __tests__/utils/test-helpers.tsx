import React from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock data factories
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@example.com',
  name: 'Test Admin',
  is_admin: true,
  role: 'full_admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockCustomer = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: null,
  email: 'customer@example.com',
  name: 'Test Customer',
  company_name: 'Test Company',
  phone: '+1234567890',
  subscription_tier: 'pro',
  credit_balance: 100,
  status: 'active',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockSample = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  customer_id: mockCustomer.id,
  sample_number: 'SMP-001',
  type: 'blood',
  status: 'pending',
  collection_date: '2024-01-01T00:00:00Z',
  notes: 'Test sample',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockAdminInvite = {
  id: '123e4567-e89b-12d3-a456-426614174003',
  email: 'newadmin@example.com',
  role: 'content_editor',
  invited_by: mockUser.id,
  token: 'test-token-123',
  expires_at: '2024-12-31T23:59:59Z',
  used: false,
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAdminStats = {
  total_users: 5,
  total_customers: 100,
  total_samples: 250,
  active_subscriptions: 75,
}

// Custom render with providers (if needed in the future)
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
}

export const customRender = (
  ui: React.ReactElement,
  options?: CustomRenderOptions
) => {
  return render(ui, { ...options })
}

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
}

// Mock fetch for API testing
export const mockFetch = (response: any, ok = true) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      status: ok ? 200 : 400,
    })
  ) as jest.Mock
}

// Reset fetch mock
export const resetFetchMock = () => {
  ;(global.fetch as jest.Mock)?.mockClear()
}

// Wait for async updates
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0))
