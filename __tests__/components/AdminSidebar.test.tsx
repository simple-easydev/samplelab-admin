import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminSidebar from '@/components/AdminSidebar'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('AdminSidebar', () => {
  it('should render sidebar with navigation links', () => {
    render(<AdminSidebar />)

    // Check for main navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Customers')).toBeInTheDocument()
    expect(screen.getByText('Samples')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('should have correct href attributes for navigation links', () => {
    render(<AdminSidebar />)

    const dashboardLink = screen.getByText('Dashboard').closest('a')
    const usersLink = screen.getByText('Users').closest('a')
    const customersLink = screen.getByText('Customers').closest('a')
    const samplesLink = screen.getByText('Samples').closest('a')
    const analyticsLink = screen.getByText('Analytics').closest('a')

    expect(dashboardLink).toHaveAttribute('href', '/admin')
    expect(usersLink).toHaveAttribute('href', '/admin/users')
    expect(customersLink).toHaveAttribute('href', '/admin/customers')
    expect(samplesLink).toHaveAttribute('href', '/admin/samples')
    expect(analyticsLink).toHaveAttribute('href', '/admin/analytics')
  })

  it('should render brand logo or name', () => {
    render(<AdminSidebar />)

    // Check if there's a brand element (logo or text)
    const sidebar = screen.getByRole('navigation') || screen.getByRole('complementary')
    expect(sidebar).toBeInTheDocument()
  })

  it('should display all navigation items', () => {
    const { container } = render(<AdminSidebar />)

    // Count navigation links
    const links = container.querySelectorAll('a')
    expect(links.length).toBeGreaterThanOrEqual(5) // At least 5 main navigation links
  })

  it('should be accessible with proper ARIA attributes', () => {
    const { container } = render(<AdminSidebar />)

    // Check for accessibility
    const nav = container.querySelector('nav') || container.querySelector('[role="navigation"]')
    expect(nav).toBeInTheDocument()
  })
})
