import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/login/page'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock Supabase browser client
jest.mock('@/lib/supabase-browser')

describe('LoginPage', () => {
  const mockPush = jest.fn()
  const mockSearchParams = new URLSearchParams()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  it('should render login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('SampleLab Admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/admin@samplelab.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/••••••••/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('should require email field', () => {
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    expect(emailInput).toBeRequired()
  })

  it('should have email input with correct type', () => {
    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('should require password field', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByPlaceholderText(/••••••••/)
    expect(passwordInput).toBeRequired()
  })

  it('should successfully log in with valid credentials', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
      error: null,
    })

    const mockFrom = jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { is_admin: true },
        error: null,
      }),
    }))

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
      from: mockFrom,
    })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123',
      })
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  it('should show error when login fails', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid credentials' },
    })

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
      },
    })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('should show error when user is not admin', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({
      data: { user: { id: '123' }, session: {} },
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

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        signInWithPassword: mockSignIn,
        signOut: jest.fn(),
      },
      from: mockFrom,
    })

    render(<LoginPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const passwordInput = screen.getByPlaceholderText(/••••••••/)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/access denied/i)).toBeInTheDocument()
    })
  })

  it('should have link to forgot password page', () => {
    render(<LoginPage />)

    const forgotPasswordLink = screen.getByText(/forgot password/i)
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/forgot-password')
  })

  it('should redirect to setup page when invite token is present', async () => {
    const mockReplace = jest.fn()
    const mockSearchParamsWithToken = {
      get: jest.fn((key) => (key === 'token' ? 'test-token' : null)),
    }
    
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: jest.fn(),
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsWithToken)

    render(<LoginPage />)

    // Wait for useEffect to run
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth/setup?token=test-token')
    })
  })
})
