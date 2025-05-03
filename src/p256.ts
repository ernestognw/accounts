/**
 * Implementation for OpenZeppelin accounts with P256 signature verification.
 * This module provides functionality to interact with OpenZeppelin smart contract accounts
 * that use P256 curve (secp256r1) for authentication, commonly used in web standards
 * like WebAuthn/FIDO2 and secure enclaves.
 */
import { Hex, PrivateKeyAccount, zeroAddress, hashMessage, hashTypedData, serializeSignature, toHex } from 'viem';
import { PrivateKeyToAccountOptions, toAccount } from 'viem/accounts';
import { toOpenZeppelinAccount, ToOpenZeppelinAccountParameters } from './account';
import { secp256r1 } from '@noble/curves/p256';
import { PrivKey } from '@noble/curves/abstract/utils';

type ToOpenZeppelinP256AccountParameters = Omit<ToOpenZeppelinAccountParameters, 'getStubSignature'>;

const P256_STUB_SIGNATURE: Hex =
  '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

/**
 * Creates a viem account from a P256 (secp256r1) private key.
 *
 * @param {PrivKey} privateKey - The P256 private key
 * @param {PrivateKeyToAccountOptions} options - Options for account creation
 * @returns {PrivateKeyAccount} A viem account that can sign messages and transactions using P256
 *
 * @example
 * ```ts
 * // Generate or import a P256 private key
 * const privateKey = secp256r1.utils.randomPrivateKey(); // from @noble/curves/p256
 * const account = privateKeyP256ToAccount(privateKey);
 * ```
 */
function privateKeyP256ToAccount(privateKey: PrivKey, options: PrivateKeyToAccountOptions = {}): PrivateKeyAccount {
  const { nonceManager } = options;

  const sign = (digest: Hex) => {
    const { r, s, recovery } = secp256r1.sign(digest, privateKey, {
      lowS: true,
    });
    return serializeSignature({ r: toHex(r, { size: 32 }), s: toHex(s, { size: 32 }), v: recovery ? 0x1cn : 0x1bn });
  };

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
    publicKey: toHex(secp256r1.getPublicKey(privateKey, false)),
    source: 'privateKey',
  } as PrivateKeyAccount;
}

/**
 * Creates a smart account client for an OpenZeppelin account that uses P256 signatures.
 * This is particularly useful for accounts that use WebAuthn/FIDO2 keys or secure enclaves.
 *
 * @param {ToOpenZeppelinP256AccountParameters} parameters - The parameters to create the account
 * @returns {Promise<SmartAccount>} A smart account that can be used with viem to interact with the blockchain
 *
 * @example
 * ```ts
 * import { createPublicClient, http, parseEther } from 'viem';
 * import { createBundlerClient } from 'viem/account-abstraction';
 * import { sepolia } from 'viem/chains';
 * import { secp256r1 } from '@noble/curves/p256';
 * import { privateKeyP256ToAccount, toOpenZeppelinP256Account } from '@openzeppelin/accounts';
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
 * // Generate or import a P256 private key
 * const privateKey = secp256r1.utils.randomPrivateKey();
 * const signer = privateKeyP256ToAccount(privateKey);
 *
 * // Create an OpenZeppelin account with P256 signature verification
 * const account = await toOpenZeppelinP256Account({
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
const toOpenZeppelinP256Account = (parameters: ToOpenZeppelinP256AccountParameters) =>
  toOpenZeppelinAccount({
    ...parameters,
    getStubSignature: async () => P256_STUB_SIGNATURE,
  });

export { ToOpenZeppelinP256AccountParameters, privateKeyP256ToAccount, toOpenZeppelinP256Account };
