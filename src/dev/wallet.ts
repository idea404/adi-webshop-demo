/**
 * A browser wallet for demos, injected as `window.ethereum` when a private key
 * is supplied at dev time. It is the smallest honest EIP-1193 provider the page
 * needs: accounts, chain, and `eth_sendTransaction`. Everything else (balances,
 * receipts, finality) goes to the public RPC directly, which is also what a real
 * wallet does past the send.
 *
 * This exists so the ADI flow can be demoed and tested without installing an
 * extension, and it is never part of a build that lacks VITE_DEV_WALLET_KEY.
 */
import { createPublicClient, http, type Address, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ADI_TESTNET } from "../lib/adi";

const key = import.meta.env.VITE_DEV_WALLET_KEY as Hex | undefined;

if (key) {
  const account = privateKeyToAccount(key);
  const rpc = createPublicClient({ chain: ADI_TESTNET, transport: http(ADI_TESTNET.rpcUrls.default.http[0]) });
  const hexChainId = `0x${ADI_TESTNET.id.toString(16)}`;

  const provider = {
    isMetaMask: false,
    isDevWallet: true,
    async request({ method, params }: { method: string; params?: unknown }): Promise<unknown> {
      switch (method) {
        case "eth_requestAccounts":
        case "eth_accounts":
          return [account.address];
        case "eth_chainId":
          return hexChainId;
        case "net_version":
          return String(ADI_TESTNET.id);
        case "wallet_switchEthereumChain":
        case "wallet_addEthereumChain":
          return null;
        case "eth_sendTransaction": {
          const [tx] = (params ?? []) as {
            from: Address;
            to: Address;
            data?: Hex;
            value?: Hex;
            gas?: Hex;
            maxFeePerGas?: Hex;
            maxPriorityFeePerGas?: Hex;
            nonce?: Hex;
          }[];
          if (!tx) throw { code: -32602, message: "eth_sendTransaction needs a transaction" };
          if (tx.from.toLowerCase() !== account.address.toLowerCase()) {
            throw { code: 4100, message: "unauthorised sender" };
          }

          const [nonce, gasPrice] = await Promise.all([
            rpc.getTransactionCount({ address: account.address }),
            rpc.getGasPrice(),
          ]);
          const signed = await account.signTransaction({
            chainId: ADI_TESTNET.id,
            to: tx.to,
            data: tx.data,
            value: tx.value ? BigInt(tx.value) : 0n,
            nonce,
            gas: tx.gas ? BigInt(tx.gas) : 120_000n,
            maxFeePerGas: gasPrice * 2n,
            maxPriorityFeePerGas: 1_000_000_000n,
            type: "eip1559",
          });
          // eth_sendTransaction returns a hash, not a signed blob: the wallet is
          // responsible for broadcasting. A real extension does this too.
          return rpc.sendRawTransaction({ serializedTransaction: signed });
        }
        default:
          throw { code: 4200, message: `dev wallet does not implement ${method}` };
      }
    },
    on() {},
    removeListener() {},
  };

  Reflect.set(window, "ethereum", provider);
  console.info(`[dev wallet] injected ${account.address}`);
}
