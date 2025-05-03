import { Address } from 'viem';
import { entryPoint08Abi, EntryPointVersion } from 'viem/account-abstraction';

const entryPointV08 = {
  abi: entryPoint08Abi,
  address: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108' as Address,
  version: '0.8' as EntryPointVersion,
  types: {
    PackedUserOperation: [
      { name: 'sender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'initCode', type: 'bytes' },
      { name: 'callData', type: 'bytes' },
      { name: 'accountGasLimits', type: 'bytes32' },
      { name: 'preVerificationGas', type: 'uint256' },
      { name: 'gasFees', type: 'bytes32' },
      { name: 'paymasterAndData', type: 'bytes' },
    ],
  },
} as const;

export { entryPointV08 };
