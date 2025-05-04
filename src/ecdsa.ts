/**
 * Implementation for OpenZeppelin accounts with ECDSA signature verification.
 * This module provides functionality to interact with OpenZeppelin smart contract accounts
 * that use ECDSA signatures for authentication.
 */
import { Hex } from 'viem';
import { toOpenZeppelinAccount, ToOpenZeppelinAccountParameters } from './account.js';

type ToOpenZeppelinECDSAAccountParameters = Omit<ToOpenZeppelinAccountParameters, 'getStubSignature'>;

const ECDSA_STUB_SIGNATURE: Hex =
  '0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c';

/**
 * Creates a smart account client for an OpenZeppelin account that uses ECDSA signatures.
 *
 * @param {ToOpenZeppelinECDSAAccountParameters} parameters - The parameters to create the account
 * @returns {Promise<SmartAccount>} A smart account that can be used with viem to interact with the blockchain
 *
 * @example
 * ```ts
 * import { createPublicClient, http, parseEther } from 'viem';
 * import { createBundlerClient } from 'viem/account-abstraction';
 * import { privateKeyToAccount } from 'viem/accounts';
 * import { sepolia } from 'viem/chains';
 * import { toOpenZeppelinECDSAAccount } from '@openzeppelin/accounts';
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
 * // Create an ECDSA signer
 * const signer = privateKeyToAccount('0x...');
 *
 * // Create an OpenZeppelin account
 * const account = await toOpenZeppelinECDSAAccount({
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
const toOpenZeppelinECDSAAccount = (parameters: ToOpenZeppelinECDSAAccountParameters) =>
  toOpenZeppelinAccount({
    ...parameters,
    getStubSignature: async () => ECDSA_STUB_SIGNATURE,
  });

export { ToOpenZeppelinECDSAAccountParameters, toOpenZeppelinECDSAAccount };
