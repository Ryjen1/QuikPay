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
  Operation: {
    payment: vi.fn().mockReturnValue('mock_payment_op'),
  },
  Asset: {
    native: () => 'native_asset',
  },
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

describe('payroll_vault contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('buildDepositTx', () => {
    it('should create a valid deposit transaction', async () => {
      const { buildDepositTx, VAULT_ACCOUNT } = await import('../contracts/payroll_vault')
      
      // VAULT_ACCOUNT should be set
      expect(VAULT_ACCOUNT).toBeTruthy()
      
      // Build transaction
      const result = await buildDepositTx(
        'GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ',
        '',
        BigInt(10000000)
      )
      
      expect(result.preparedXdr).toContain('prepared_')
    })

    it('should throw error when vault account not set', async () => {
      // Temporarily override env
      const original = import.meta.env.VITE_VAULT_ACCOUNT
      import.meta.env.VITE_VAULT_ACCOUNT = ''
      
      await expect(async () => {
        const { buildDepositTx } = await import('../contracts/payroll_vault')
        await buildDepositTx('GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ', '', BigInt(10000000))
      }).rejects.toThrow('VITE_VAULT_ACCOUNT is not set')
      
      import.meta.env.VITE_VAULT_ACCOUNT = original
    })
  })
})
