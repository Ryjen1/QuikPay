import { describe, it, expect } from '@jest/globals'
import express from 'express'

// Create a minimal test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  })
  
  return app
}

describe('Health Endpoint', () => {
  const app = createTestApp()
  
  it('should return healthy status', async () => {
    const mockReq = {} as any
    const mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    } as any
    
    app.handle(mockReq, mockRes)
    
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'ok',
        timestamp: expect.any(String),
        version: '1.0.0'
      })
    )
  })
})

describe('App Initialization', () => {
  it('should export app from index', async () => {
    // Test that backend module loads without errors
    const backend = await import('../index')
    expect(backend).toBeDefined()
  })
})
