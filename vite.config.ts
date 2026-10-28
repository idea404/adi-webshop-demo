import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Loads the demo wallet in dev only. The module itself no-ops unless
 * VITE_DEV_WALLET_KEY is set, so a plain `bun run dev` still has no
 * `window.ethereum` — the state a shop without a wallet extension must handle.
 */
function devWallet(): Plugin {
  return {
    name: "meridian-dev-wallet",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        // Vite appends a ?t= cache-buster to module scripts before later hooks run,
        // so match the src attribute rather than the whole tag.
        return html.replace(
          /(<script type="module" src="\/src\/main\.tsx)([^"]*)(">)/,
          '<script type="module" src="/src/dev/wallet.ts"></script>\n    $1$2$3',
        );
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), devWallet()],
  server: { port: 5173, host: "127.0.0.1" },
  preview: { port: 4173, host: "127.0.0.1" },
});
