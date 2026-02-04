import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/admin/invite/route'
import { createServerClient } from '@/lib/supabase-server'
import { resetAllMocks } from '@/__tests__/utils/supabase-mock'
import { mockAdminInvite, mockUser } from '@/__tests__/utils/test-helpers'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('GET /api/admin/invite', () => {
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

    const request = new NextRequest('http://localhost:3000/api/admin/invite')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 if user is not a full admin', async () => {
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
        data: { role: 'content_editor' },
        error: null,
      }),
    }))

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
      from: mockFrom,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/invite')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Only full admins can manage invitations')
  })

  it('should return list of invites for full admin', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    const mockInvites = [mockAdminInvite]

    const mockFrom = jest.fn((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'full_admin' },
            error: null,
          }),
        }
      }
      if (table === 'admin_invites') {
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: mockInvites,
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

    const request = new NextRequest('http://localhost:3000/api/admin/invite')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockInvites)
  })
})

describe('POST /api/admin/invite', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return 400 if email or role is missing', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }), // missing role
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and role are required')
  })

  it('should return 400 if email format is invalid', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        role: 'content_editor',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('should return 400 if role is invalid', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        getSession: mockGetSession,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'invalid_role',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid role')
  })

  it('should successfully create an invitation', async () => {
    const mockGetSession = jest.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: 'admin-123', email: 'admin@example.com' },
        },
      },
      error: null,
    })

    const newInvite = {
      ...mockAdminInvite,
      email: 'newinvite@example.com',
    }

    const mockFrom = jest.fn((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'full_admin' },
            error: null,
          }),
        }
      }
      if (table === 'admin_invites') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: newInvite,
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

    const request = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'newinvite@example.com',
        role: 'content_editor',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.invite).toEqual(newInvite)
    expect(data.inviteUrl).toContain(`/auth/setup?token=${newInvite.token}`)
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
            data: { role: 'full_admin' },
            error: null,
          }),
        }
      }
      if (table === 'admin_invites') {
        return {
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
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

    const request = new NextRequest('http://localhost:3000/api/admin/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'content_editor',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create invitation')
  })
})
