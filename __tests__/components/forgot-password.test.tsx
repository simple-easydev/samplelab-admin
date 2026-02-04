import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ForgotPasswordPage from '@/app/auth/forgot-password/page'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase-browser'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Supabase browser client
jest.mock('@/lib/supabase-browser')

describe('ForgotPasswordPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
    })
  })

  it('should render forgot password form', () => {
    render(<ForgotPasswordPage />)

    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/admin@samplelab.com/i)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /continue/i })
    ).toBeInTheDocument()
  })

  it('should require email field', () => {
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    expect(emailInput).toBeRequired()
  })

  it('should have email input with correct type', () => {
    render(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('should successfully send reset email', async () => {
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({
      data: {},
      error: null,
    })

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    render(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalled()
      const callArgs = mockResetPasswordForEmail.mock.calls[0]
      expect(callArgs[0]).toBe('admin@example.com')
      expect(callArgs[1].redirectTo).toContain('/auth/reset-password')
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('should handle API errors gracefully', async () => {
    const mockResetPasswordForEmail = jest.fn().mockResolvedValue({
      data: null,
      error: new Error('SMTP error'),
    })

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    render(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      // The component shows the error message from Supabase
      expect(screen.getByText('SMTP error')).toBeInTheDocument()
    })
  })

  it('should have link back to login page', () => {
    render(<ForgotPasswordPage />)

    const backToLoginLink = screen.getByText(/back to log in/i)
    expect(backToLoginLink).toHaveAttribute('href', '/login')
  })

  it('should disable submit button while submitting', async () => {
    let resolvePromise: any
    const mockResetPasswordForEmail = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve
          })
      )

    ;(createBrowserClient as jest.Mock).mockReturnValue({
      auth: {
        resetPasswordForEmail: mockResetPasswordForEmail,
      },
    })

    render(<ForgotPasswordPage />)

    const emailInput = screen.getByPlaceholderText(/admin@samplelab.com/i)
    const submitButton = screen.getByRole('button', { name: /continue/i })

    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    fireEvent.click(submitButton)

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled()
    expect(submitButton).toHaveTextContent('Sending...')
  })
})
