# `@openzeppelin/accounts`

**A JavaScript library to interact with OpenZeppelin Account contracts.**

This library bridges the gap between OpenZeppelin's ERC-4337 compliant Account contracts and viem, enabling developers to easily interact with smart contract accounts using different signature verification schemes.

[![NPM Package](https://img.shields.io/npm/v/@openzeppelin/accounts.svg)](https://www.npmjs.org/package/@openzeppelin/accounts)

## Features

- 🔐 Support for multiple signature verification methods:
  - ECDSA (Standard Ethereum signatures)
  - P256 (secp256r1, used in WebAuthn/FIDO2 and secure enclaves)
  - RSA (Used in traditional PKI systems and X.509 certificates)
- ⚡ Built on top of viem's account abstraction implementation
- 🧩 Compatible with OpenZeppelin's Account contracts
- 🚀 Simple and intuitive API that follows viem's patterns

## Installation

```bash
npm install @openzeppelin/accounts
```

## Quick Start

```js
import { createPublicClient, http, parseEther } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { toOpenZeppelinECDSAAccount } from '@openzeppelin/accounts';

// Set up clients
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const bundlerClient = createBundlerClient({
  chain: sepolia,
  transport: http('https://public.pimlico.io/v2/1/rpc'),
});

// Create a signer
const owner = privateKeyToAccount('0x...');

// Create an OpenZeppelin account
const account = await toOpenZeppelinECDSAAccount({
  client: publicClient,
  signer: owner,
  getAddress: async () => '0x...', // Your deployed account address
  getFactoryArgs: async () => ({
    factory: '0x...', // Your account factory address
    factoryData: '0x...', // Data to initialize your account
  }),
});

// Send a user operation through the bundler
const hash = await bundlerClient.sendUserOperation({
  account,
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});

// Wait for the user operation to be included
const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
console.log(`Transaction hash: ${receipt.transactionHash}`);
```

## Usage

### Setting up Clients

First, set up the necessary clients for interacting with the blockchain and the bundler:

```js
import { createPublicClient, http } from 'viem';
import { createBundlerClient } from 'viem/account-abstraction';
import { sepolia } from 'viem/chains';

// Set up a public client for blockchain interactions
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

// Set up a bundler client for sending user operations
const bundlerClient = createBundlerClient({
  chain: sepolia,
  transport: http('https://public.pimlico.io/v2/1/rpc'),
});
```

### ECDSA Accounts (Ethereum Standard)

ECDSA accounts use the same signature scheme as standard Ethereum accounts:

```js
import { privateKeyToAccount } from 'viem/accounts';
import { toOpenZeppelinECDSAAccount } from '@openzeppelin/accounts';

// Create an ECDSA signer
const owner = privateKeyToAccount('0x...');

// Create an OpenZeppelin account
const account = await toOpenZeppelinECDSAAccount({
  client: publicClient,
  signer: owner,
  getAddress: async () => '0x...', // Your deployed account address
  getFactoryArgs: async () => ({
    factory: '0x...', // Your account factory address
    factoryData: '0x...', // Data to initialize your account
  }),
});

// Send a user operation through the bundler
const hash = await bundlerClient.sendUserOperation({
  account,
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});
```

### P256 Accounts (WebAuthn/FIDO2)

P256 accounts use the secp256r1 curve, which is often used in web standards like WebAuthn/FIDO2 and in secure enclaves:

```js
import { secp256r1 } from '@noble/curves/p256';
import { privateKeyP256ToAccount, toOpenZeppelinP256Account } from '@openzeppelin/accounts';

// Generate or import a P256 private key
const privateKey = secp256r1.utils.randomPrivateKey();
const signer = privateKeyP256ToAccount(privateKey);

// Create an OpenZeppelin account with P256 signature verification
const account = await toOpenZeppelinP256Account({
  client: publicClient,
  signer,
  getAddress: async () => '0x...', // Your deployed account address
  getFactoryArgs: async () => ({
    factory: '0x...', // Your account factory address
    factoryData: '0x...', // Data to initialize your account
  }),
});

// Send a user operation through the bundler
const hash = await bundlerClient.sendUserOperation({
  account,
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});
```

### RSA Accounts (PKI Systems)

RSA accounts use the RSA signature scheme, common in traditional PKI systems and X.509 certificates:

```js
import { generateKeyPairSync } from 'crypto';
import { privateKeyRSAToAccount, toOpenZeppelinRSAAccount } from '@openzeppelin/accounts';

// Generate an RSA key pair
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const signer = privateKeyRSAToAccount(privateKey);

// Create an OpenZeppelin account with RSA signature verification
const account = await toOpenZeppelinRSAAccount({
  client: publicClient,
  signer,
  getAddress: async () => '0x...', // Your deployed account address
  getFactoryArgs: async () => ({
    factory: '0x...', // Your account factory address
    factoryData: '0x...', // Data to initialize your account
  }),
});

// Send a user operation through the bundler
const hash = await bundlerClient.sendUserOperation({
  account,
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});
```

### Optional: Hoisting the Account onto the Bundler Client

If you prefer not to pass the account to every action, you can hoist it onto the bundler client:

```js
// Hoist the account onto the bundler client
const bundlerClient = createBundlerClient({
  account, // Add the account here
  chain: sepolia,
  transport: http('https://public.pimlico.io/v2/1/rpc'),
});

// Now you can omit the account parameter
const hash = await bundlerClient.sendUserOperation({
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});
```

## Gas Sponsorship with Paymasters

ERC-4337 allows for gas sponsorship via paymasters. You can add paymaster support to the bundler client:

```js
import { createPaymasterClient } from 'viem/account-abstraction';

// Set up a paymaster client
const paymasterClient = createPaymasterClient({
  transport: http('https://public.pimlico.io/v2/1/rpc'),
});

// Create a bundler client with paymaster support
const bundlerClient = createBundlerClient({
  account,
  chain: sepolia,
  paymaster: paymasterClient, // Add the paymaster client
  transport: http('https://public.pimlico.io/v2/1/rpc'),
});

// Send a user operation (fees will be sponsored)
const hash = await bundlerClient.sendUserOperation({
  calls: [
    {
      to: '0x...',
      value: parseEther('0.01'),
      data: '0x',
    },
  ],
});
```

> **Note**
> If your bundler also supports paymaster sponsorship (`pm_` JSON-RPC methods), you can set `paymaster: true` instead of declaring a separate paymaster client.

## Compatible Smart Contract Accounts

This library is designed to work with accounts built using OpenZeppelin's Account and Signer contracts from the community contracts repository. Here are some common patterns:

```solidity
// ECDSA Account
import {Account} from "@openzeppelin/community-contracts/account/Account.sol";
import {SignerECDSA} from "@openzeppelin/community-contracts/utils/cryptography/SignerECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MyAccountECDSA is Account, SignerECDSA, Initializable {
    function initialize(address signerAddr) public initializer {
        _setSigner(signerAddr);
    }
}

// P256 Account
import {Account} from "@openzeppelin/community-contracts/account/Account.sol";
import {SignerP256} from "@openzeppelin/community-contracts/utils/cryptography/SignerP256.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MyAccountP256 is Account, SignerP256, Initializable {
    function initialize(bytes32 qx, bytes32 qy) public initializer {
        _setSigner(qx, qy);
    }
}

// RSA Account
import {Account} from "@openzeppelin/community-contracts/account/Account.sol";
import {SignerRSA} from "@openzeppelin/community-contracts/utils/cryptography/SignerRSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract MyAccountRSA is Account, SignerRSA, Initializable {
    function initialize(bytes memory e, bytes memory n) public initializer {
        _setSigner(e, n);
    }
}
```

### Account Factory Example

If you're deploying a new account, you can create a factory that deploys an account with the corresponding signer:

```solidity
// For an ECDSA account factory
contract MyAccountFactory {
    function createAccount(address owner, uint256 salt) public returns (address) {
        bytes32 byteSalt = bytes32(salt);
        address account = Create2.computeAddress(byteSalt, keccak256(type(MyAccount).creationCode));

        if (account.code.length == 0) {
            account = address(new MyAccount{salt: byteSalt}());
            MyAccount(payable(account)).initialize(owner);
        }

        return account;
    }
}
```

## API Reference

### `toOpenZeppelinAccount`

```typescript
function toOpenZeppelinAccount(parameters: ToOpenZeppelinAccountParameters): Promise<SmartAccount>;
```

Base function for creating an OpenZeppelin account. This is used internally by the signature-specific functions.

### `toOpenZeppelinECDSAAccount`

```typescript
function toOpenZeppelinECDSAAccount(parameters: ToOpenZeppelinECDSAAccountParameters): Promise<SmartAccount>;
```

Creates a smart account using ECDSA signature verification.

### `toOpenZeppelinP256Account`

```typescript
function toOpenZeppelinP256Account(parameters: ToOpenZeppelinP256AccountParameters): Promise<SmartAccount>;
```

Creates a smart account using P256 (secp256r1) signature verification.

### `toOpenZeppelinRSAAccount`

```typescript
function toOpenZeppelinRSAAccount(parameters: ToOpenZeppelinRSAAccountParameters): Promise<SmartAccount>;
```

Creates a smart account using RSA signature verification.

### `privateKeyP256ToAccount`

```typescript
function privateKeyP256ToAccount(privateKey: PrivKey, options?: PrivateKeyToAccountOptions): PrivateKeyAccount;
```

Creates a viem account from a P256 private key.

### `privateKeyRSAToAccount`

```typescript
function privateKeyRSAToAccount(privateKey: KeyObject, options?: PrivateKeyToAccountOptions): PrivateKeyAccount;
```

Creates a viem account from an RSA private key.

## Contributing

Contributions are welcome! Feel free to open issues or pull requests on the GitHub repository.

## License

This library is released under the MIT License.
