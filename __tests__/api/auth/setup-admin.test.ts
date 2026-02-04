import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/setup-admin/route'
import { createAdminClient } from '@/lib/supabase-server'
import { mockSupabaseAdminClient, resetAllMocks } from '@/__tests__/utils/supabase-mock'
import { mockAdminInvite, mockUser } from '@/__tests__/utils/test-helpers'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('POST /api/auth/setup-admin', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return 400 if required fields are missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'test-token',
        // missing name, password
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should return 404 if invite is not found', async () => {
    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    }))

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: mockSupabaseAdminClient.auth,
      rpc: jest.fn(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'invalid-token',
        name: 'Test User',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
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

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: mockSupabaseAdminClient.auth,
      rpc: jest.fn(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'used-token',
        name: 'Test User',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
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

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: mockSupabaseAdminClient.auth,
      rpc: jest.fn(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'expired-token',
        name: 'Test User',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('This invitation has expired')
  })

  it('should successfully create admin user with valid invitation', async () => {
    const validInvite = {
      ...mockAdminInvite,
      expires_at: '2099-12-31T23:59:59Z',
    }

    const mockFrom = jest.fn((table: string) => {
      if (table === 'admin_invites') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({ data: validInvite, error: null }),
          update: jest.fn().mockReturnThis(),
        }
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      }
    })

    const mockCreateUser = jest.fn().mockResolvedValue({
      data: { user: { id: mockUser.id, email: mockUser.email } },
      error: null,
    })

    const mockRpc = jest.fn().mockResolvedValue({ data: null, error: null })

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockCreateUser,
        },
      },
      rpc: mockRpc,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        name: 'Test Admin',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: validInvite.email,
      password: 'SecurePass123!',
      email_confirm: true,
      user_metadata: {
        name: 'Test Admin',
      },
    })
    expect(mockRpc).toHaveBeenCalledWith('create_admin_user_record', {
      p_user_id: mockUser.id,
      p_email: validInvite.email,
      p_name: 'Test Admin',
      p_role: validInvite.role,
    })
  })

  it('should handle auth user creation errors', async () => {
    const validInvite = {
      ...mockAdminInvite,
      expires_at: '2099-12-31T23:59:59Z',
    }

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: validInvite, error: null }),
    }))

    const mockCreateUser = jest.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    })

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockCreateUser,
        },
      },
      rpc: jest.fn(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        name: 'Test Admin',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Auth error creating new user')
  })

  it('should handle database user creation errors', async () => {
    const validInvite = {
      ...mockAdminInvite,
      expires_at: '2099-12-31T23:59:59Z',
    }

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: validInvite, error: null }),
    }))

    const mockCreateUser = jest.fn().mockResolvedValue({
      data: { user: { id: mockUser.id, email: mockUser.email } },
      error: null,
    })

    const mockRpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB error', code: '42703' },
    })

    ;(createAdminClient as jest.Mock).mockReturnValue({
      from: mockFrom,
      auth: {
        admin: {
          createUser: mockCreateUser,
          deleteUser: jest.fn(),
        },
      },
      rpc: mockRpc,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/setup-admin', {
      method: 'POST',
      body: JSON.stringify({
        token: 'valid-token',
        name: 'Test Admin',
        password: 'SecurePass123!',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Database error creating new user')
  })
})
