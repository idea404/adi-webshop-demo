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
        // Some libraries try the wallet namespace first, or retry with it when
        // `eth_sendTransaction` rejects. Implementing it as an alias keeps the
        // original error visible instead of a "method not supported" from the
        // retry, which is how the real reason gets buried.
        case "eth_sendTransaction":
        case "wallet_sendTransaction": {
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
          if (!tx) throw { code: -32602, message: "a transaction is required" };
          if (tx.from.toLowerCase() !== account.address.toLowerCase()) {
            throw { code: 4100, message: "unauthorised sender" };
          }

          // Estimate gas and read the base fee rather than guessing either. ADI
          // requires the sender's balance to cover the transaction's *maximum*
          // fee, so a padded guess makes a wallet holding plenty of ADI fail
          // validation even though the real cost was a fraction of it.
          const [nonce, fees] = await Promise.all([
            rpc.getTransactionCount({ address: account.address }),
            rpc.estimateFeesPerGas(),
          ]);
          const gas =
            tx.gas !== undefined
              ? BigInt(tx.gas)
              : await rpc.estimateGas({
                  account: account.address,
                  to: tx.to,
                  data: tx.data,
                  value: tx.value ? BigInt(tx.value) : 0n,
                });

          const signed = await account.signTransaction({
            chainId: ADI_TESTNET.id,
            to: tx.to,
            data: tx.data,
            value: tx.value ? BigInt(tx.value) : 0n,
            nonce,
            gas,
            maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : fees.maxFeePerGas,
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas
              ? BigInt(tx.maxPriorityFeePerGas)
              : fees.maxPriorityFeePerGas,
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
