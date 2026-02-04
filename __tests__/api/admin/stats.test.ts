import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/stats/route'
import { createServerClient } from '@/lib/supabase-server'
import { resetAllMocks } from '@/__tests__/utils/supabase-mock'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return 401 if user is not authenticated', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 if user is not an admin', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'user-123', email: 'user@example.com' },
        },
      },
      error: null,
    })

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_admin: false },
        error: null,
      }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should return stats for authenticated admin', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    const mockStats = {
      users: [{ count: 5 }],
      customers: [{ count: 100 }],
      samples: [{ count: 250 }],
      subscriptions: [{ count: 75 }],
    }

    const mockFrom = jest.fn((table: string) => {
      if (table === 'users') {
        if (mockFrom.mock.calls.filter((call) => call[0] === 'users').length === 1) {
          // First call to users table is for admin check
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { is_admin: true },
              error: null,
            }),
          }
        } else {
          // Second call is for count
          return {
            select: jest.fn().mockResolvedValue({
              data: mockStats.users,
              error: null,
              count: 5,
            }),
          }
        }
      }
      if (table === 'customers') {
        return {
          select: jest.fn().mockResolvedValue({
            data: mockStats.customers,
            error: null,
            count: 100,
          }),
        }
      }
      if (table === 'samples') {
        return {
          select: jest.fn().mockResolvedValue({
            data: mockStats.samples,
            error: null,
            count: 250,
          }),
        }
      }
      if (table === 'subscriptions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: mockStats.subscriptions,
            error: null,
            count: 75,
          }),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
      }
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      total_users: 5,
      total_customers: 100,
      total_samples: 250,
      active_subscriptions: 75,
    })
  })

  it('should handle database errors gracefully', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    const mockFrom = jest.fn((table: string) => {
      if (table === 'users') {
        if (mockFrom.mock.calls.filter((call) => call[0] === 'users').length === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { is_admin: true },
              error: null,
            }),
          }
        }
      }
      return {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' },
        }),
      }
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch stats')
  })
})
