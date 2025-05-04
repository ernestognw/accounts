/**
 * Base implementation for OpenZeppelin accounts that implements the ERC-4337 standard.
 * This module provides functionality to interact with OpenZeppelin smart contract accounts
 * using viem.
 */
import {
  getUserOperationHash,
  toSmartAccount,
  ToSmartAccountParameters,
  UserOperationRequest,
} from 'viem/account-abstraction';
import { Address, type Client, getContract, Hex, LocalAccount } from 'viem';
import { encodeCalls, decodeCalls } from './erc7579.utils';
import { entryPointV08 } from './constants';

/**
 * Parameters required to create an OpenZeppelin account.
 * @typedef {Object} ToOpenZeppelinAccountParameters
 * @property {Client} client - The viem client to use for blockchain interactions
 * @property {LocalAccount} signer - The local account signer to use for signing messages and operations
 * @property {function(): Promise<Address>} getAddress - Function that resolves to the account's address
 * @property {function(): Promise<{factory?: Address, factoryData?: Hex}>} getFactoryArgs - Function that returns the factory address and data for account deployment
 * @property {function(UserOperationRequest?): Promise<Hex>} getStubSignature - Function that returns a stub signature for gas estimation
 */
type ToOpenZeppelinAccountParameters = {
  client: Client;
  signer: LocalAccount;
  getAddress: () => Promise<Address>;
  getFactoryArgs: () => Promise<{
    factory?: Address | undefined;
    factoryData?: Hex | undefined;
  }>;
  getStubSignature: (parameters?: UserOperationRequest | undefined) => Promise<Hex>;
} & Partial<ToSmartAccountParameters>;

/**
 * Creates a smart account client for an OpenZeppelin account.
 * This function bridges OpenZeppelin's Account contracts with viem's account abstraction interface.
 * 
 * @param {ToOpenZeppelinAccountParameters} parameters - The parameters to create the account
 * @returns {Promise<SmartAccount>} A smart account that can be used with viem to interact with the blockchain
 * 
 * @example
 * ```ts
 * import { createPublicClient, http, parseEther } from 'viem';
 * import { createBundlerClient } from 'viem/account-abstraction';
 * import { privateKeyToAccount } from 'viem/accounts';
 * import { sepolia } from 'viem/chains';
 * import { toOpenZeppelinAccount } from '@openzeppelin/accounts';
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
 * // Create your signer
 * const signer = privateKeyToAccount('0x...');
 * 
 * // Create an OpenZeppelin account
 * const account = await toOpenZeppelinAccount({
 *   client: publicClient,
 *   signer,
 *   getAddress: async () => '0x...',
 *   getFactoryArgs: async () => ({
 *     factory: '0x...',
 *     factoryData: '0x...',
 *   }),
 *   getStubSignature: async () => '0x...',
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
const toOpenZeppelinAccount = async (parameters: ToOpenZeppelinAccountParameters) => {
  const { client, signer, getAddress, getFactoryArgs, ...override } = parameters;

  return toSmartAccount({
    client,
    entryPoint: entryPointV08,
    decodeCalls,
    encodeCalls,
    getAddress,
    getFactoryArgs,
    async getNonce({ key } = {}) {
      return this.getAddress().then(addr => getContract({ client, ...entryPointV08 }).read.getNonce([addr, key ?? 0n]));
    },
    signMessage: signer.signMessage,
    signTypedData: signer.signTypedData,
    async signUserOperation(userOperation) {
      const userOpHash = getUserOperationHash({
        entryPointAddress: entryPointV08.address,
        entryPointVersion: entryPointV08.version,
        userOperation: {
          ...userOperation,
          sender: userOperation.sender ?? (await this.getAddress()),
        },
        chainId: userOperation.chainId!,
      });
      return signer.signMessage({ message: { raw: userOpHash } });
    },
    ...override,
  });
};

export { ToOpenZeppelinAccountParameters, toOpenZeppelinAccount };
