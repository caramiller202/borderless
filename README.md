# Borderless

A decentralized protocol for transparent, low-cost, and efficient cross-border payments using Clarity smart contracts on Bitcoin L2 (Stacks).

## **Overview**

**Borderless** enables individuals and small businesses to send and receive stablecoin-based payments internationally with real-time FX, privacy-preserving KYC, and compliance automation.

The protocol is composed of multiple modular smart contracts that handle routing, escrow, KYC, FX conversion, and dispute resolution.

## **Smart Contracts (Clarity)**

1. **Payment Router Contract**
   - Routes payments between senders and recipients in different currencies
   - Handles payment metadata, recipient preferences, and delivery conditions

2. **Multi-Currency Escrow Contract**
   - Temporarily locks funds until confirmation or timeout
   - Supports dual confirmation and dispute triggers

3. **FX Oracle Adapter Contract**
   - Retrieves and validates exchange rates from off-chain sources
   - Provides normalized pricing for currency swaps

4. **Fee Manager Contract**
   - Calculates dynamic protocol and FX fees
   - Distributes to treasury and operators

5. **KYC Registry Contract**
   - Stores attestations of verified identities using DIDs
   - Enables privacy-preserving compliance checks

6. **Compliance Rules Contract**
   - Enforces AML limits, blacklists, and jurisdictional restrictions
   - Allows upgradability via governance

7. **Dispute Resolution Contract**
   - Facilitates resolution of contested payments via DAO or timeouts
   - Provides evidence submission mechanisms

8. **Reward Incentives Contract**
   - Issues protocol reward tokens to users and liquidity operators
   - Powers referral and usage-based incentives

9. **Stablecoin Interface Contract**
   - Supports whitelisted stablecoins (e.g., USDC, cEUR, cNGN)
   - Handles deposits, transfers, and withdrawals

10. **Governance DAO Contract**
    - Protocol parameters are managed by community vote
    - Proposals can include upgrades, rule changes, or treasury movements

## **Features**

- Instant settlement with stablecoins
- Real-time FX rate integration via oracle
- Multi-currency escrow and settlement logic
- Regulatory compliance with privacy-preserving KYC
- Incentives for liquidity providers and referrers
- Dispute resolution through DAO or automation
- Fully open-source and modular smart contracts

## **Installation**

1. Install [Clarinet CLI](https://docs.stacks.co/clarity/clarinet-cli)
2. Clone this repository:
   ```bash
   git clone https://github.com/your-org/borderless.git
   cd borderless
3. Run tests:
    ```bash
    npm install
    npm test
    ```
4. Deploy contracts:
    ```bash
    clarinet deploy
    ```

## **Usage**

Each contract is modular and deployable independently. Refer to the contracts/ folder and individual README files for ABI specifications and usage examples.

You can integrate Borderless into mobile wallets, merchant platforms, or B2B apps via contract interfaces.

## **Testing**

Tests are written in TypeScript using Vitest. To run the full suite:
    ```bash
    npm test
    ```

Mock data is included for FX rates, KYC attestations, and escrow events.

## **License**

MIT License 