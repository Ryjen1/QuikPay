import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Stellar SDK
vi.mock('@stellar/stellar-sdk', () => ({
  Contract: vi.fn().mockImplementation(() => ({
    call: vi.fn().mockResolvedValue({}),
  })),
  TransactionBuilder: vi.fn().mockImplementation(() => ({
    addOperation: vi.fn().mockReturnThis(),
    setTimeout: vi.fn().mockReturnThis(),
    build: vi.fn().mockReturnValue({
      toXDR: () => 'mock_xdr_string',
    }),
  })),
  nativeToScVal: vi.fn().mockReturnValue('mock_scval'),
  scValToNative: vi.fn().mockImplementation((val) => val),
  Address: vi.fn().mockImplementation(() => ({
    toScVal: () => 'mock_address_scval',
  })),
}))

vi.mock('./util', () => ({
  rpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: 'Test SDF Network ; September 2015',
  getRpcServer: vi.fn().mockImplementation(() => ({
    getAccount: vi.fn().mockResolvedValue({
      getSequence: () => '1000',
    }),
    prepareTransaction: vi.fn().mockImplementation((tx) => ({
      toXDR: () => 'prepared_' + tx.toXDR(),
    })),
  })),
}))

describe('payroll_stream contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildCreateStreamTx', () => {
    it('should create a valid stream transaction', async () => {
      const { buildCreateStreamTx, PAYROLL_STREAM_CONTRACT_ID } = await import('../contracts/payroll_stream')
      
      expect(PAYROLL_STREAM_CONTRACT_ID).toBeTruthy()
      
      const result = await buildCreateStreamTx({
        employer: 'GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ',
        worker: 'GCQRHJJIB2U5VEOTW77I6NCSUXLE4YSTABZPSUA5ABTQC66F7T47GLPQ',
        token: '',
        rate: BigInt(1000000),
        amount: BigInt(100000000),
        startTs: Math.floor(Date.now() / 1000),
        endTs: Math.floor(Date.now() / 1000) + 86400 * 30,
      })
      
      expect(result.preparedXdr).toContain('prepared_')
    })

    it('should throw error when contract ID not set', async () => {
      const original = import.meta.env.VITE_PAYROLL_STREAM_CONTRACT_ID
      import.meta.env.VITE_PAYROLL_STREAM_CONTRACT_ID = ''
      
      await expect(async () => {
        const { buildCreateStreamTx } = await import('../contracts/payroll_stream')
        await buildCreateStreamTx({
          employer: 'GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ',
          worker: 'GCQRHJJIB2U5VEOTW77I6NCSUXLE4YSTABZPSUA5ABTQC66F7T47GLPQ',
          token: '',
          rate: BigInt(1000000),
          amount: BigInt(100000000),
          startTs: Math.floor(Date.now() / 1000),
          endTs: Math.floor(Date.now() / 1000) + 86400 * 30,
        })
      }).rejects.toThrow('VITE_PAYROLL_STREAM_CONTRACT_ID is not set')
      
      import.meta.env.VITE_PAYROLL_STREAM_CONTRACT_ID = original
    })
  })
})
