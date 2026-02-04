import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/forgot-password/route'
import { createServerClient } from '@/lib/supabase-server'
import { mockSupabaseClient, resetAllMocks } from '@/__tests__/utils/supabase-mock'

// Mock the Supabase server module
jest.mock('@/lib/supabase-server')

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('should return 400 if email format is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('should send password reset email for valid email', async () => {
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com' }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBe(
      'If an account exists with this email, you will receive password reset instructions.'
    )
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('admin@example.com', {
      redirectTo: 'http://localhost:3000/auth/reset-password',
    })
  })

  it('should handle Supabase errors gracefully', async () => {
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'SMTP error' },
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@example.com' }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to send reset email')
  })

  it('should always return success for security (even if email not found)', async () => {
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    })

    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    })
    const response = await POST(request)
    const data = await response.json()

    // Should still return 200 to prevent email enumeration
    expect(response.status).toBe(200)
    expect(data.message).toBe(
      'If an account exists with this email, you will receive password reset instructions.'
    )
  })
})
