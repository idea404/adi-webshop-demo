/**
 * ADI Chain payment. No backend: the payer's browser talks to the token
 * contract through a public RPC, and the receiving address is a build-time
 * constant.
 *
 * Values here were read from the live testnet, not copied from a doc: chain id
 * 99999, mUSDC at 0x9bC8…41e1 with 6 decimals, permissionless `mint`, and
 * `zks_getTransactionFinality` for the pending → committed → executed stages.
 */
import {
  createPublicClient,
  createWalletClient,
  custom,
  erc20Abi,
  formatUnits,
  http,
  parseAbi,
  type Address,
  type Chain,
} from "viem";

const RPC_URL = "https://rpc.ab.testnet.adifoundation.ai";
const EXPLORER_URL = "https://explorer.ab.testnet.adifoundation.ai";

export const ADI_TESTNET: Chain = {
  id: 99999,
  name: "ADI Network AB Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] } },
  blockExplorers: { default: { name: "ADI Explorer", url: EXPLORER_URL } },
  testnet: true,
};

/** Permissionless-mint MockERC20 on ADI testnet: symbol mUSDC, 6 decimals. */
export const SETTLEMENT_TOKEN = {
  symbol: "mUSDC",
  address: "0x9bC8244c0F531F27fe3636FFdAf2C586d11241e1" as Address,
  decimals: 6,
} as const;

const publicClient = createPublicClient({ chain: ADI_TESTNET, transport: http(RPC_URL) });

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, listener: () => void): void;
  removeListener?(event: string, listener: () => void): void;
}

function isProvider(value: unknown): value is Eip1193Provider {
  if (typeof value !== "object" || value === null) return false;
  return "request" in value && typeof value.request === "function";
}

/** Browser wallet, if one injected `window.ethereum`. */
export function injectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const candidate: unknown = Reflect.get(window, "ethereum");
  return isProvider(candidate) ? candidate : null;
}

/**
 * Fires `onChange` when the wallet swaps account or chain, so a panel can reset
 * instead of showing a stale address. Wallets may not implement events; that is
 * not an error, the panel just will not self-reset.
 */
export function watchWallet(onChange: () => void): () => void {
  const provider = injectedProvider();
  if (!provider?.on) return () => {};
  provider.on("accountsChanged", onChange);
  provider.on("chainChanged", onChange);
  return () => {
    provider.removeListener?.("accountsChanged", onChange);
    provider.removeListener?.("chainChanged", onChange);
  };
}

export class WalletError extends Error {
  readonly code: number | undefined;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

/**
 * Providers reject with `{ code, message }`, but viem wraps that in one or two
 * `cause` layers. Walk the chain for the first coded error so a rejection is
 * reported as a rejection and not as a paragraph of contract-call internals.
 */
function walkCauses(error: unknown): { code: number | undefined; message: string } {
  let current: unknown = error;
  let code: number | undefined;
  let message = "";
  for (let depth = 0; depth < 6 && current; depth++) {
    if (typeof current === "object") {
      if (code === undefined && "code" in current && typeof current.code === "number") code = current.code;
      if (!message && "message" in current && typeof current.message === "string") message = current.message;
      current = "cause" in current ? current.cause : undefined;
    } else {
      break;
    }
  }
  return { code, message };
}

function toWalletError(error: unknown): WalletError {
  const { code, message } = walkCauses(error);
  if (code === 4001 || /user rejected|rejected the request/i.test(message)) {
    return new WalletError("You rejected the request in your wallet.", 4001);
  }
  if (code === -32000 || /insufficient funds/i.test(message)) {
    return new WalletError("Not enough ADI to cover the network fee.", code);
  }
  // Wallet and node messages can be paragraphs; the panel needs one sentence.
  const short = message.split("\n")[0]?.slice(0, 180).trim();
  return new WalletError(short || "The wallet request failed.", code);
}

async function switchToAdi(provider: Eip1193Provider, address: Address): Promise<void> {
  const hexChainId = `0x${ADI_TESTNET.id.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexChainId }] });
  } catch (error) {
    // 4902 means the wallet does not know this chain; adding it opens the
    // confirmation the payer expects and most wallets switch automatically.
    const unknownChain =
      typeof error === "object" && error !== null && "code" in error && error.code === 4902;
    if (!unknownChain) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: hexChainId,
          chainName: ADI_TESTNET.name,
          nativeCurrency: ADI_TESTNET.nativeCurrency,
          rpcUrls: [RPC_URL],
          blockExplorerUrls: [EXPLORER_URL],
        },
      ],
    });
  }

  const current: unknown = await provider.request({ method: "eth_chainId" });
  const chainId = typeof current === "string" ? Number.parseInt(current, 16) : Number.NaN;
  if (chainId !== ADI_TESTNET.id) {
    throw new WalletError(`Your wallet is on chain ${chainId}. Switch it to ${ADI_TESTNET.name}.`);
  }

  // A chain switch can leave the account list stale in some wallets; re-read it.
  const accounts: unknown = await provider.request({ method: "eth_accounts" });
  const listed = Array.isArray(accounts) ? accounts : [];
  if (!listed.some((account) => String(account).toLowerCase() === address.toLowerCase())) {
    throw new WalletError("The wallet switched accounts. Connect again.");
  }
}

export async function connectWallet(): Promise<{ address: Address }> {
  const provider = injectedProvider();
  if (!provider) throw new WalletError("No browser wallet found. Install MetaMask or Rabby to pay with ADI.");

  try {
    const accounts: unknown = await provider.request({ method: "eth_requestAccounts" });
    const listed = Array.isArray(accounts) ? accounts : [];
    const first = listed[0];
    if (typeof first !== "string" || !first.startsWith("0x")) {
      throw new WalletError("The wallet returned no account.");
    }
    // viem guarantees this shape from a wallet; the check above is what makes it so.
    const address = first as Address;
    await switchToAdi(provider, address);
    return { address };
  } catch (error) {
    throw toWalletError(error);
  }
}

/**
 * The testnet token is a mock whose `mint` is open to anyone, so the panel can
 * top the payer up in one wallet transaction. This is the faucet for mUSDC: the
 * official ADI faucet is Turnstile-gated and only hands out native ADI.
 */
const mintAbi = parseAbi(["function mint(address to, uint256 amount)"]);

export async function mintTestTokens(to: Address, amountRaw: bigint): Promise<`0x${string}`> {
  const provider = injectedProvider();
  if (!provider) throw new WalletError("No browser wallet found.");
  const wallet = createWalletClient({ chain: ADI_TESTNET, transport: custom(provider) });
  const [account] = await wallet.requestAddresses();
  if (!account) throw new WalletError("The wallet returned no account.");
  try {
    const hash = await wallet.writeContract({
      address: SETTLEMENT_TOKEN.address,
      abi: mintAbi,
      functionName: "mint",
      args: [to, amountRaw],
      account,
      chain: ADI_TESTNET,
    });
    await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    return hash;
  } catch (error) {
    throw toWalletError(error);
  }
}

/** Native balance in wei, for the gas readiness check. */
export async function adiBalance(address: Address): Promise<bigint> {
  return publicClient.getBalance({ address });
}

export async function tokenBalance(address: Address): Promise<bigint> {
  return publicClient.readContract({
    address: SETTLEMENT_TOKEN.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
  });
}

export class InsufficientTokenError extends WalletError {
  readonly balance: bigint;
  readonly required: bigint;
  constructor(balance: bigint, required: bigint) {
    const held = formatUnits(balance, SETTLEMENT_TOKEN.decimals);
    const need = formatUnits(required, SETTLEMENT_TOKEN.decimals);
    super(`This wallet holds ${held} ${SETTLEMENT_TOKEN.symbol}; the order needs ${need}.`);
    this.name = "InsufficientTokenError";
    this.balance = balance;
    this.required = required;
  }
}

export interface AdiPaymentResult {
  txHash: `0x${string}`;
  blockNumber: number;
}

/**
 * One ERC-20 transfer, resolving once it is in a block. The wallet popup is the
 * only interaction; receipt polling goes to the public RPC, because wallets are
 * unreliable JSON-RPC proxies for anything past the send.
 *
 * The balance check happens first so an underfunded wallet fails before a popup.
 */
export async function payWithAdi(to: Address, amountRaw: bigint): Promise<AdiPaymentResult> {
  const provider = injectedProvider();
  if (!provider) throw new WalletError("No browser wallet found.");

  const wallet = createWalletClient({ chain: ADI_TESTNET, transport: custom(provider) });
  const [account] = await wallet.requestAddresses();
  if (!account) throw new WalletError("The wallet returned no account.");

  const balance = await tokenBalance(account);
  if (balance < amountRaw) throw new InsufficientTokenError(balance, amountRaw);

  try {
    const hash = await wallet.writeContract({
      address: SETTLEMENT_TOKEN.address,
      abi: erc20Abi,
      functionName: "transfer",
      args: [to, amountRaw],
      account,
      chain: ADI_TESTNET,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
    if (receipt.status !== "success") throw new WalletError("The transfer was mined but reverted.");
    return { txHash: hash, blockNumber: Number(receipt.blockNumber) };
  } catch (error) {
    throw toWalletError(error);
  }
}

export type FinalityStage = "pending" | "committed" | "executed";

interface FinalityResult {
  stage: FinalityStage;
  blockNumber: number | null;
  batchNumber: number | null;
}

/**
 * ADI is a zkSync-OS L2: inclusion is one block, finality is a batch committed
 * to Ethereum. Read the stage from `zks_getTransactionFinality` rather than
 * inferring it from block depth, which this chain does not populate the way
 * L1 tooling expects.
 */
export async function transactionFinality(hash: string): Promise<FinalityResult> {
  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "zks_getTransactionFinality", params: [hash] }),
  });
  if (!response.ok) throw new Error(`finality request failed: ${response.status}`);
  const body: unknown = await response.json();
  const result = typeof body === "object" && body !== null && "result" in body ? body.result : null;
  if (typeof result !== "object" || result === null || !("stage" in result)) {
    return { stage: "pending", blockNumber: null, batchNumber: null };
  }
  const stage = result.stage;
  return {
    stage: stage === "committed" || stage === "executed" ? stage : "pending",
    blockNumber: "blockNumber" in result && typeof result.blockNumber === "number" ? result.blockNumber : null,
    batchNumber: "batchNumber" in result && typeof result.batchNumber === "number" ? result.batchNumber : null,
  };
}

export function explorerTx(hash: string): string {
  return `${EXPLORER_URL}/tx/${hash}`;
}
