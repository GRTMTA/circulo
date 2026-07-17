# <img src="public/logo.jpg" alt="Circulo Logo" width="300"/>

**Circulo** is a non-custodial, invite-only Rotating Savings and Credit Association (ROSCA) designed for trusted groups. It leverages Soroban smart contracts on the Stellar network to enforce collateral rules, ensuring all members are protected and payouts are executed fairly and transparently.

---

### 🌐 Live Deployment
**Try it now:** [**https://circulo-eta.vercel.app/**](https://circulo-eta.vercel.app/)

---

## 🎯 About Circulo

Traditional Rotating Savings and Credit Associations (ROSCAs) rely entirely on social trust. If a member drops out early or misses a payment after receiving their payout, the remaining members suffer. 

Circulo solves this by introducing **Soroban-powered collateral escrows**. 

### How it Works:
1. **Create/Join a Circle:** Invite trusted members to form a circle with a fixed contribution amount, cycle schedule, and collateral requirements.
2. **Escrow Collateral:** Every member posts collateral upfront to the Soroban smart contract.
3. **Contribute and Rotate:** Members make contributions each round. At the end of each round, one member receives the entire pool.
4. **On-Chain Enforcement:** If a member misses a payment, the smart contract slashes their collateral to compensate the pool, keeping other members whole.

---

## ✨ Key Features

- **Decentralized Collateral Management:** On-chain deposits and automated slashing using Stellar & Soroban smart contracts.
- **Unanimous Dissolution & Voting System:** If members decide to delete/dissolve a circle mid-cycle, a dissolution proposal is created. It requires **100% unanimous approval** from all members.
- **Collateral Recovery Logic:** If a circle is dissolved, the smart contract distributes the escrowed collateral to compensate members who *have not yet received their round payout*, making them whole before returning remaining collateral.
- **Real-Time Audit Trail:** Comprehensive activity tracking (`audit_events`) details who paid whom, contribution status, and on-chain tx hashes.
- **Dynamic Notifications:** Alerts for pending agreements, upcoming contribution deadlines, vote invitations, and payment statuses.
- **Interactive UI:** Smooth transitions, dashboard overview widgets, and settings management for circle creators and members.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React 19, Tailwind CSS v4, Base UI
- **Stellar Integration:** Stellar Wallet Kit, `@stellar/stellar-sdk`, Soroban
- **Database & Auth:** Supabase (PostgreSQL, Realtime, RLS Policies)
- **Smart Contracts:** Rust, `soroban-sdk`
- **Component Explorer:** Storybook

---

## 🚀 Getting Started

### 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18+)
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) (for contract compilation/testing)
- [Rust](https://www.rust-lang.org/) (for smart contract development)

### 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/circulo.git
   cd circulo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and fill in your Supabase credentials, Soroban RPC URLs, and deployed Contract ID:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 📜 Smart Contract Commands

The smart contract source code is located in `/contracts/circulo`.

- **Build the contract:**
  ```bash
  npm run contract:build
  ```
- **Run contract tests:**
  ```bash
  npm run contract:test
  ```

---

## 🎨 UI Component Development

We use Storybook to design and test UI components in isolation:

- **Launch Storybook:**
  ```bash
  npm run storybook
  ```
- **Build Storybook for deployment:**
  ```bash
  npm run build-storybook
  ```

---

## 📄 License

This project is licensed under the MIT License.
