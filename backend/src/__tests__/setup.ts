// Jest setup file
jest.setTimeout(10000)

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key'
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'

// Global afterAll to close any connections
afterAll(async () => {
  // Allow time for cleanup
  await new Promise(resolve => setTimeout(resolve, 100))
})
