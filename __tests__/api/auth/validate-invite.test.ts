import { NextRequest } from 'next/server'
import { GET } from '@/app/api/auth/validate-invite/route'
import { createServerClient } from '@/lib/supabase-server'
import { mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/supabase-mock'
import { mockAdminInvite } from '@/__tests__/utils/test-helpers'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('POST /api/auth/validate-invite', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return 400 if token is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/validate-invite')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Token is required')
  })

  it('should return 404 if invite is not found', async () => {
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/auth/validate-invite?token=invalid-token'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Invalid or expired invitation')
  })

  it('should return 400 if invite is already used', async () => {
    const usedInvite = { ...mockAdminInvite, used: true }
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: usedInvite, error: null }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/auth/validate-invite?token=used-token'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('This invitation has already been used')
  })

  it('should return 400 if invite is expired', async () => {
    const expiredInvite = {
      ...mockAdminInvite,
      expires_at: '2020-01-01T00:00:00Z',
    }
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: expiredInvite, error: null }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/auth/validate-invite?token=expired-token'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('This invitation has expired')
  })

  it('should return 200 with invite data for valid invitation', async () => {
    const validInvite = {
      ...mockAdminInvite,
      expires_at: '2099-12-31T23:59:59Z',
    }
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: validInvite, error: null }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/auth/validate-invite?token=valid-token'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      email: validInvite.email,
      role: validInvite.role,
    })
  })

  it('should handle database errors gracefully', async () => {
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      from: mockFrom,
    })

    const request = new NextRequest(
      'http://localhost:3000/api/auth/validate-invite?token=test-token'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to validate invitation')
  })
})
