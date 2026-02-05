// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

if (typeof global.ReadableStream === 'undefined') {
  global.ReadableStream = ReadableStream
}

delete window.location
window.location = { origin: 'http://localhost:3000' }

process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.VITE_APP_URL = 'http://localhost:3000'

const React = require('react')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useSearchParams: () => [new URLSearchParams()],
  useLocation: () => ({ pathname: '/', state: null }),
  useParams: () => ({}),
  Link: ({ to, children, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  Navigate: () => null,
  BrowserRouter: ({ children }) => children,
  Routes: ({ children }) => children,
  Route: () => null,
}))

global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
}
