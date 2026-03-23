# TimeBasedInheritance - Smart Contract Capstone

## Project Overview

**TimeBasedInheritance** is a decentralized smart contract that enables secure, time-locked asset inheritance on the Rootstock blockchain. The contract implements a simple but powerful primitive: ownership automatically transfers to a designated beneficiary if the current owner fails to prove they are alive for 90 consecutive days.

This project was built as the capstone for the Rootstock Blockchain Developer Course, demonstrating proficiency in Solidity development, testing, deployment, and contract verification.

---

## Core Concept: The "Dead Man's Switch"

The contract functions as a digital inheritance mechanism:

1. **Owner registers** an asset with a beneficiary address
2. **Owner checks in** periodically (at least every 90 days) to prove they are alive
3. **If 90 days pass** without a check-in, the beneficiary can claim ownership

This elegantly solves the problem of digital asset inheritance without requiring anyone to hold private keys after the owner's death.

---

## Contract Address

**Rootstock Testnet:** `0x3e97Ffed859c57Fc412213ADb8Bc17EA6aDBE4Ff`

🔗 [View on Rootstock Explorer](https://explorer.testnet.rootstock.io/address/0x3e97Ffed859c57Fc412213ADb8Bc17EA6aDBE4Ff#code)

---

## How It Works


### Key Functions

| Function | Description | Requirements |
|----------|-------------|--------------|
| `registerAsset(bytes32 assetId, address beneficiary)` | Register a new asset | Beneficiary cannot be zero or self |
| `checkIn(bytes32 assetId)` | Reset the 90-day timer | Only the current owner can call |
| `claimInheritance(bytes32 assetId)` | Claim ownership after inactivity | Only beneficiary, after 90 days of no check-in |
| `getAsset(bytes32 assetId)` | View asset details | Anyone can call |

### Events

- `AssetRegistered` — Emitted when a new asset is created
- `CheckedIn` — Emitted when owner resets the timer
- `InheritanceClaimed` — Emitted when beneficiary claims ownership

---

## Why 90 Days?

The 90-day period was chosen to balance:
- **Realism**: Short enough to be testable, long enough to be realistic for inheritance scenarios
- **Security**: Prevents accidental claims due to brief owner absence (vacation, illness)
- **Demonstrability**: Can be simulated in tests using Hardhat's time manipulation

---

## Technical Implementation

### Solidity Version
`pragma solidity ^0.8.20` — Uses built-in overflow protection and modern Solidity features.

### No External Dependencies
The contract contains no imports (no OpenZeppelin, no external libraries). This was a deliberate design choice to:
- Demonstrate deep understanding of Solidity fundamentals
- Minimize attack surface
- Ensure complete code audibility
- Showcase original thinking (a key evaluation criterion)

### Security Considerations

1. **Reentrancy Protection**: State changes occur before external calls (though no external calls are made in this contract)
2. **Access Control**: Critical functions have `require` checks (`only owner`, `only beneficiary`)
3. **Time-Based Logic**: Uses `block.timestamp` with a constant 90-day period

---

## Testing

### Test Coverage

The contract includes comprehensive tests covering:
- ✅ Successful registration
- ✅ Registration with invalid beneficiaries (zero address, self)
- ✅ Duplicate asset prevention
- ✅ Successful check-ins
- ✅ Non-owner check-in prevention
- ✅ Claim after inactivity period
- ✅ Early claim prevention
- ✅ Non-beneficiary claim prevention
- ✅ Claim after already claimed
- ✅ Time calculation accuracy

### Running Tests

```bash
npx hardhat test