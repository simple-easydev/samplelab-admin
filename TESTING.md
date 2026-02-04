# Testing Guide

This document provides information about the testing setup and how to run tests in this Next.js admin project.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Best Practices](#best-practices)

## Testing Stack

This project uses the following testing tools:

- **Jest**: JavaScript testing framework
- **React Testing Library**: Testing utilities for React components
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: Simulates user interactions
- **jest-environment-jsdom**: Jest environment for browser-like DOM testing

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

This is useful during development to automatically re-run tests when files change:

```bash
npm run test:watch
```

### Run Tests with Coverage

Generate a coverage report to see which parts of your code are tested:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory. Open `coverage/lcov-report/index.html` in your browser to view the detailed report.

### Run Tests in CI Mode

For continuous integration environments:

```bash
npm run test:ci
```

## Test Structure

Tests are organized in the `__tests__/` directory, mirroring the structure of the application:

```
__tests__/
├── api/
│   ├── auth/
│   │   ├── validate-invite.test.ts
│   │   ├── setup-admin.test.ts
│   │   └── forgot-password.test.ts
│   └── admin/
│       ├── stats.test.ts
│       ├── invite.test.ts
│       ├── users.test.ts
│       └── customers.test.ts
├── components/
│   ├── login.test.tsx
│   ├── forgot-password.test.tsx
│   └── AdminSidebar.test.tsx
└── utils/
    ├── supabase-mock.ts
    └── test-helpers.tsx
```

## Writing Tests

### API Route Tests

API routes are tested by importing the route handler and mocking the Supabase client:

```typescript
import { GET } from '@/app/api/admin/stats/route'
import { createServerClient } from '@/lib/supabase-server'
import { resetAllMocks } from '@/__tests__/utils/supabase-mock'

jest.mock('@/lib/supabase-server')

describe('GET /api/admin/stats', () => {
  beforeEach(() => {
    resetAllMocks()
  })

  it('should return stats for authenticated admin', async () => {
    // Mock implementation
    const mockGetSession = jest.fn().mockResolvedValue({
      data: { session: { user: { id: 'admin-123' } } },
    })
    
    ;(createServerClient as jest.Mock).mockReturnValue({
      auth: { getSession: mockGetSession },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/stats')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('total_users')
  })
})
```

### Component Tests

React components are tested using React Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import LoginPage from '@/app/login/page'

describe('LoginPage', () => {
  it('should render login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('Admin Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('should handle form submission', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText('Email')
    fireEvent.change(emailInput, { target: { value: 'admin@example.com' } })
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)
    
    // Assertions...
  })
})
```

### Using Test Utilities

The project includes reusable test utilities and mocks:

#### Mock Data Factories

```typescript
import { mockUser, mockCustomer, mockSample } from '@/__tests__/utils/test-helpers'

// Use mock data in your tests
const testUser = mockUser
const testCustomer = { ...mockCustomer, name: 'Custom Name' }
```

#### Supabase Mocks

```typescript
import {
  mockSupabaseClient,
  mockSupabaseAdminClient,
  resetAllMocks,
} from '@/__tests__/utils/supabase-mock'

// Reset all mocks before each test
beforeEach(() => {
  resetAllMocks()
})

// Use pre-configured mocks
mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
  data: { user: mockUser, session: {} },
  error: null,
})
```

## Test Coverage

### Current Coverage

Run `npm run test:coverage` to see the latest coverage report.

### Coverage Thresholds

The project enforces the following minimum coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

These thresholds are configured in `jest.config.js` and will cause the test suite to fail if not met.

### What to Test

Focus on testing:

1. **Critical paths**: Authentication, authorization, data mutations
2. **User interactions**: Form submissions, button clicks, navigation
3. **Error handling**: Invalid inputs, network errors, permission errors
4. **Business logic**: Calculations, validations, data transformations
5. **Edge cases**: Empty states, boundary conditions, error states

### What NOT to Test

Avoid testing:

- Third-party library internals
- Auto-generated code
- Simple getters/setters without logic
- Trivial component wrappers

## Best Practices

### 1. Test Behavior, Not Implementation

Focus on what the component/function does, not how it does it:

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.count).toBe(5)

// ✅ Good: Testing behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument()
```

### 2. Use Meaningful Test Descriptions

```typescript
// ❌ Bad
it('should work', () => { ... })

// ✅ Good
it('should display error message when login fails', () => { ... })
```

### 3. Follow the AAA Pattern

Structure tests with Arrange, Act, Assert:

```typescript
it('should create a new admin invitation', async () => {
  // Arrange
  const mockData = { email: 'test@example.com', role: 'content_editor' }
  mockSupabaseClient.from.mockReturnValue(...)

  // Act
  const response = await POST(request)
  const data = await response.json()

  // Assert
  expect(response.status).toBe(201)
  expect(data.invite.email).toBe(mockData.email)
})
```

### 4. Clean Up After Tests

Always reset mocks and clear timers:

```typescript
beforeEach(() => {
  resetAllMocks()
  jest.clearAllTimers()
})

afterEach(() => {
  jest.restoreAllMocks()
})
```

### 5. Test Edge Cases

Don't just test the happy path:

```typescript
describe('POST /api/auth/setup-admin', () => {
  it('should create admin user successfully', () => { ... })
  it('should return 400 if fields are missing', () => { ... })
  it('should return 404 if invite not found', () => { ... })
  it('should return 400 if invite is expired', () => { ... })
  it('should handle database errors gracefully', () => { ... })
})
```

### 6. Use Data-Testid Sparingly

Prefer accessible queries (by role, label, text) over test IDs:

```typescript
// ✅ Good: Using accessible queries
screen.getByRole('button', { name: /sign in/i })
screen.getByLabelText('Email')
screen.getByText('Welcome back')

// ⚠️ Use only when necessary
screen.getByTestId('custom-component')
```

### 7. Mock External Dependencies

Always mock external services and APIs:

```typescript
// Mock Supabase
jest.mock('@/lib/supabase-browser')

// Mock Next.js router
jest.mock('next/navigation')

// Mock fetch
global.fetch = jest.fn()
```

### 8. Keep Tests Independent

Each test should be able to run in isolation:

```typescript
// ❌ Bad: Tests depend on each other
let userId: string
it('should create user', () => {
  userId = createUser()
})
it('should delete user', () => {
  deleteUser(userId) // Depends on previous test
})

// ✅ Good: Tests are independent
it('should create user', () => {
  const userId = createUser()
  expect(userId).toBeDefined()
})
it('should delete user', () => {
  const userId = createUser()
  const result = deleteUser(userId)
  expect(result).toBe(true)
})
```

## Continuous Integration

Tests are automatically run in CI environments when you use `npm run test:ci`. This command:

- Runs all tests once (no watch mode)
- Generates coverage reports
- Limits worker threads for better CI performance
- Fails the build if tests fail or coverage thresholds aren't met

## Troubleshooting

### Common Issues

1. **Module not found errors**: Ensure `moduleNameMapper` in `jest.config.js` is correctly configured
2. **Timeout errors**: Increase timeout for slow tests: `jest.setTimeout(10000)`
3. **Mock not working**: Check that mocks are defined before imports
4. **DOM not available**: Ensure `testEnvironment: 'jsdom'` is set

### Debugging Tests

Run a single test file:

```bash
npm test -- path/to/test.test.ts
```

Run tests matching a pattern:

```bash
npm test -- --testNamePattern="should login"
```

Enable verbose output:

```bash
npm test -- --verbose
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

## Contributing

When adding new features:

1. Write tests for new functionality
2. Ensure all tests pass: `npm test`
3. Check coverage: `npm run test:coverage`
4. Update this guide if you add new testing patterns or utilities
