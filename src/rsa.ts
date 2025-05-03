/**
 * Implementation for OpenZeppelin accounts with RSA signature verification.
 * This module provides functionality to interact with OpenZeppelin smart contract accounts
 * that use RSA keys for authentication, commonly used in traditional PKI systems
 * and X.509 certificates.
 */
import { concat, Hex, PrivateKeyAccount, zeroAddress, hashMessage, fromBytes, hashTypedData } from 'viem';
import { PrivateKeyToAccountOptions, toAccount } from 'viem/accounts';
import { toOpenZeppelinAccount, ToOpenZeppelinAccountParameters } from './account';
import { createPublicKey, privateEncrypt } from 'crypto';
import { type KeyObject } from 'crypto';

type ToOpenZeppelinRSAAccountParameters = Omit<ToOpenZeppelinAccountParameters, 'getStubSignature'>;

const RSA_2048_BITS_STUB_SIGNATURE: Hex =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * Creates a viem account from an RSA private key.
 *
 * @param {KeyObject} privateKey - The RSA private key from Node.js crypto module
 * @param {PrivateKeyToAccountOptions} options - Options for account creation
 * @returns {PrivateKeyAccount} A viem account that can sign messages and transactions using RSA
 *
 * @example
 * ```ts
 * import { generateKeyPairSync } from 'crypto';
 *
 * // Generate an RSA key pair
 * const { privateKey } = generateKeyPairSync('rsa', {
 *   modulusLength: 2048,
 * });
 *
 * const account = privateKeyRSAToAccount(privateKey);
 * ```
 */
function privateKeyRSAToAccount(privateKey: KeyObject, options: PrivateKeyToAccountOptions = {}): PrivateKeyAccount {
  const { nonceManager } = options;

  const sign = (digest: Hex) =>
    fromBytes(
      privateEncrypt(
        privateKey,
        // SHA256 OID = 608648016503040201 (9 bytes) | NULL = 0500 (2 bytes) (explicit) | OCTET_STRING length (0x20) = 0420 (2 bytes)
        concat(['0x3031300d060960864801650304020105000420', digest]),
      ),
      'hex',
    );

  const account = toAccount({
    address: zeroAddress, // Depends on the account implementation. Will be set in `toOpenZeppelinAccount`
    nonceManager,
    async sign({ hash }) {
      return sign(hash);
    },
    async signAuthorization() {
      throw new Error('Authorizations unsupported in non-native accounts');
    },
    async signMessage({ message }) {
      return sign(hashMessage(message));
    },
    async signTransaction() {
      throw new Error('Native transactions unsupported in non-native accounts');
    },
    async signTypedData(typedData) {
      return sign(hashTypedData(typedData));
    },
  });

  return {
    ...account,
    publicKey: createPublicKey(privateKey).export({ format: 'pem', type: 'spki' }),
    source: 'privateKey',
  } as PrivateKeyAccount;
}

/**
 * Creates a smart account client for an OpenZeppelin account that uses RSA signatures.
 * This is particularly useful for accounts that need to integrate with traditional PKI systems.
 *
 * @param {ToOpenZeppelinRSAAccountParameters} parameters - The parameters to create the account
 * @returns {Promise<SmartAccount>} A smart account that can be used with viem to interact with the blockchain
 *
 * @example
 * ```ts
 * import { createPublicClient, http, parseEther } from 'viem';
 * import { createBundlerClient } from 'viem/account-abstraction';
 * import { sepolia } from 'viem/chains';
 * import { generateKeyPairSync } from 'crypto';
 * import { privateKeyRSAToAccount, toOpenZeppelinRSAAccount } from '@openzeppelin/accounts';
 *
 * // Set up clients
 * const publicClient = createPublicClient({
 *   chain: sepolia,
 *   transport: http(),
 * });
 *
 * const bundlerClient = createBundlerClient({
 *   chain: sepolia,
 *   transport: http('https://public.pimlico.io/v2/1/rpc'),
 * });
 *
 * // Generate an RSA key pair
 * const { privateKey } = generateKeyPairSync('rsa', {
 *   modulusLength: 2048,
 * });
 *
 * const signer = privateKeyRSAToAccount(privateKey);
 *
 * // Create an OpenZeppelin account with RSA signature verification
 * const account = await toOpenZeppelinRSAAccount({
 *   client: publicClient,
 *   signer,
 *   getAddress: async () => '0x...',
 *   getFactoryArgs: async () => ({
 *     factory: '0x...', // Your account factory address
 *     factoryData: '0x...', // Data to initialize your account
 *   }),
 * });
 *
 * // Send a user operation through the bundler
 * const hash = await bundlerClient.sendUserOperation({
 *   account,
 *   calls: [
 *     {
 *       to: '0x...',
 *       value: parseEther('0.01'),
 *       data: '0x',
 *     },
 *   ],
 * });
 *
 * // Wait for the user operation to be included
 * const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });
 * console.log(`Transaction hash: ${receipt.transactionHash}`);
 * ```
 */
const toOpenZeppelinRSAAccount = (parameters: ToOpenZeppelinRSAAccountParameters) =>
  toOpenZeppelinAccount({
    ...parameters,
    getStubSignature: async () => RSA_2048_BITS_STUB_SIGNATURE,
  });

export { ToOpenZeppelinRSAAccountParameters, privateKeyRSAToAccount, toOpenZeppelinRSAAccount };
