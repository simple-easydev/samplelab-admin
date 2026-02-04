import { NextRequest } from 'next/server'
import { GET } from '@/app/api/admin/customers/route'
import { createServerClient } from '@/lib/supabase-server'
import { resetAllMocks } from '@/__tests__/utils/supabase-mock'
import { mockCustomer } from '@/__tests__/utils/test-helpers'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('GET /api/admin/customers', () => {
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

    const request = new NextRequest('http://localhost:3000/api/admin/customers')
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

    const request = new NextRequest('http://localhost:3000/api/admin/customers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Forbidden')
  })

  it('should return list of customers', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    const mockCustomers = [
      mockCustomer,
      {
        ...mockCustomer,
        id: '456',
        email: 'customer2@example.com',
        name: 'Customer Two',
      },
    ]

    const mockFrom = jest.fn((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }
      }
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockCustomers,
            error: null,
          }),
        }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/customers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockCustomers)
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
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { is_admin: true },
            error: null,
          }),
        }
      }
      if (table === 'customers') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }
      }
      return { select: jest.fn().mockReturnThis() }
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/customers')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to fetch customers')
  })
})
