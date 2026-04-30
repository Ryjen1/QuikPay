<div align="center">

# QuikPay

### Decentralized Payroll Protocol on Stellar

Real-time wage accrual. On-demand withdrawal. Zero counterparty risk.

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-black?style=flat&logo=stellar&logoColor=white)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Rust-orange?style=flat&logo=rust&logoColor=white)](https://soroban.stellar.org)

</div>

---

## Overview

QuikPay is a decentralized payroll protocol built on **Stellar** using **Soroban smart contracts**. It enables employers to create time-based wage streams that accrue in real-time, and workers to withdraw their earned wages on-demand — all enforced by immutable Rust contracts.

### How It Works

```
┌──────────┐     Create Stream      ┌──────────────────┐     Real-time Accrual
│  Employer │ ───────────────────► │  PayrollStream   │ ───────────────────► │  Worker
└──────────┘     Deposit XLM       │  Contract        │     Withdraw Anytime
                 to Vault          └──────────────────┘
```

**1.** Employer deposits XLM into the treasury vault
**2.** Employer creates a wage stream for a worker (flow rate + duration)
**3.** Worker's earnings accrue every second, mathematically enforced
**4.** Worker withdraws earned wages at any time

---

## Smart Contracts

All contracts are written in Rust and deployed to Stellar Testnet via Soroban.

### Architecture

```
┌─────────────────────────┐
│   PayrollVault            │   Treasury management
│   - deposit()             │   Tracks XLM balances
│   - withdraw()            │   Tracks liabilities
│   - get_balance()         │
└─────────────────────────┘
┌─────────────────────────┐
│   PayrollStream           │   Wage stream lifecycle
│   - create_stream()       │   Streams accrue in real-time
│   - withdraw()            │   Workers claim earnings
│   - cancel_stream()       │   Employers can cancel
│   - get_withdrawable()     │
└─────────────────────────┘
┌─────────────────────────┐
│   WorkforceRegistry       │   Worker management
│   - register_worker()      │   Add workers to payroll
│   - remove_worker()       │   Remove workers
│   - is_registered()       │
└─────────────────────────┘
┌─────────────────────────┐
│   AutomationGateway       │   Agent permissions
│   - register_agent()      │   Manage automation
│   - is_authorized()      │   Permission checks
└─────────────────────────┘
```

### Deployed Contracts (Testnet)

| Contract | ID | Functions |
|----------|-----|-----------|
| PayrollVault | `CAT5QOY3Z2PCRLXXG7IOHBUCUOQ5TFDULAEP7LOJDJCKRY6UHJY47TNY` | `deposit`, `withdraw`, `get_balance`, `get_liability` |
| PayrollStream | `CBO5YPMOPEK2MYCO6663Q6LUAPAFZO5QDG5FEU2SUNIKTMKOV6624EA4` | `create_stream`, `withdraw`, `cancel_stream`, `get_withdrawable` |
| WorkforceRegistry | `CDTDZY5TI7JT6HLTV4SY2UFQJKANZAV2NCHHLT4RBOVQG4YSVB4DK75U` | `register_worker`, `remove_worker`, `is_registered` |
| AutomationGateway | `CBB7OSDXJJUMSR6CX4VCEMPV5ZARMWKIXS2IVHYGR4US3LFJCT5IRBKM` | `register_agent`, `remove_agent`, `is_authorized` |

---

## Project Structure

```
QuikPay/
├── contracts/              # Soroban smart contracts (Rust)
│   ├── common/             # Shared error types and utilities
│   ├── payroll_vault/      # Treasury balance management
│   ├── payroll_stream/     # Wage stream lifecycle
│   ├── workforce_registry/  # Worker registration
│   ├── automation_gateway/ # Agent permissions
│   └── wage_accrual/       # Wage accrual tracking
├── frontend/               # Frontend (React + Vite + TypeScript)
│   ├── pages/              # Route pages
│   │   ├── Home.tsx          # Landing page
│   │   ├── EmployerSpace.tsx  # Employer dashboard
│   │   ├── WorkerSpace.tsx   # Worker portal
│   │   └── NotFound.tsx      # 404 page
│   ├── contracts/          # Soroban contract TypeScript wrappers
│   ├── hooks/              # React hooks for contract interaction
│   ├── components/         # UI components
│   ├── providers/          # React context providers
│   └── lib/                # Utilities
├── backend/                # API server (Express + TypeScript)
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/       # Auth, RBAC, rate limiting
│   │   ├── services/        # Business logic services
│   │   ├── db/             # PostgreSQL + Drizzle ORM
│   │   └── schemas/         # Request/response schemas
│   └── tests/              # Backend test suite
├── .env                    # Environment configuration (gitignored)
└── .env.example            # Environment template
```

---

## API Reference

### Authentication

Wallet-based JWT authentication using Stellar challenge-response.

#### `POST /auth/challenge`

Generate a challenge message for wallet signature.

**Request Body:**
```json
{
  "walletAddress": "GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ"
}
```

**Response `200`:**
```json
{
  "challenge": "QuikPay Auth Challenge\nWallet: GDELFT...\nNonce: abc123\n...",
  "expiresIn": 600
}
```

#### `POST /auth/verify`

Verify signed challenge and receive JWT.

**Request Body:**
```json
{
  "walletAddress": "GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ",
  "signedMessage": "signed_challenge_xdr..."
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "walletAddress": "GDELFTXEWUV42EYZGIRL2L4BP7I72EDWOZJ47UMCQP7DZME32BGWBFEJ",
  "expiresIn": 604800
}
```

#### `POST /auth/refresh`

Refresh an existing JWT token.

**Headers:** `Authorization: Bearer <token>`

**Response `200`: Same as `/auth/verify`

---

### Smart Contract Endpoints

#### `POST /api/streams`

Create a new payroll stream.

#### `GET /api/streams?worker=<address>`

List all streams for a worker.

#### `GET /api/employers/:id/streams`

List all streams for an employer.

#### `POST /api/proofs/:streamId`

Get payment proof for a completed stream.

---

### Monitoring

#### `GET /health`

Health check endpoint.

**Response `200`: `{ "status": "ok", "timestamp": "..." }`

#### `GET /monitor/status`

Treasury monitoring status (requires auth).

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://rustup.rs/) (with `wasm32-unknown-unknown` target)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli)
- [Freighter](https://www.freighter.app/) wallet extension

### Installation

```bash
# Clone the repository
git clone https://github.com/LFGBanditLabs/QuikPay.git
cd QuikPay

# Install frontend dependencies
npm install

# Build smart contracts
cargo build --target wasm32-unknown-unknown --release
```

### Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `PUBLIC_STELLAR_NETWORK` | `"TESTNET"` for testnet |
| `PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `"Test SDF Network ; September 2015"` |
| `PUBLIC_STELLAR_RPC_URL` | `"https://soroban-testnet.stellar.org"` |
| `PUBLIC_STELLAR_HORIZON_URL` | `"https://horizon-testnet.stellar.org"` |
| `VITE_PAYROLL_VAULT_CONTRACT_ID` | Deployed vault contract ID |
| `VITE_PAYROLL_STREAM_CONTRACT_ID` | Deployed stream contract ID |
| `VITE_WORKFORCE_REGISTRY_CONTRACT_ID` | Deployed registry contract ID |
| `VITE_AUTOMATION_GATEWAY_CONTRACT_ID` | Deployed gateway contract ID |

### Running

```bash
# Start the frontend development server
npm run dev
# → http://localhost:5173

# Start the backend server (in a separate terminal)
cd backend
npm install
npm run dev
# → http://localhost:3001
```

### Deploying Contracts to Testnet

```bash
# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy each contract
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/payroll_vault.wasm \
  --source-account <YOUR_KEY> \
  --network testnet

# Initialize the vault contract
stellar contract invoke \
  --id <VAULT_CONTRACT_ID> \
  -- --network testnet \
  -- initialize \
  -- -- <YOUR_ADMIN_ADDRESS>
```

---

## Usage Guide

### For Employers

**1. Fund Your Treasury**
- Navigate to the Employer Space
- Enter the XLM amount to deposit
- Click "Deposit to Treasury"
- Sign the transaction in Freighter

**2. Create a Wage Stream**
- Enter the worker's Stellar public key
- Set the flow rate (XLM per second)
- Set the start and end dates
- Click "Create Stream"

**3. Monitor Active Streams**
- View all active streams and balances
- Track total liabilities vs available funds

### For Workers

**1. Connect Your Wallet**
- Open the app and click "Connect"
- Select your Freighter wallet
- Ensure you're on the Testnet

**2. View Your Earnings**
- Navigate to the Worker Space
- See real-time earnings accruing per second
- View hourly/daily rate projections
- See active stream details

**3. Withdraw Earned Wages**
- Click "Withdraw" on any active stream
- Sign the transaction in Freighter
- Funds are sent to your wallet immediately

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Rust + Soroban SDK 23.4 |
| Frontend | React 19 + Vite + TypeScript |
| Wallet Integration | @creit.tech/stellar-wallets-kit |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Express + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Auth | JWT + Stellar wallet signatures |
| CI/CD | GitHub Actions |
| Deployment | Docker + Kubernetes + Terraform |

---

## License

[Apache-2.0](LICENSE)
