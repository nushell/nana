import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig, splitVendorChunkPlugin } from "vite";

export default defineConfig({
    clearScreen: false,
    server: {
        port: 3000,
        strictPort: true,
    },
    envPrefix: ["NODE_", "VITE_", "TAURI_"],
    plugins: [svelte(), splitVendorChunkPlugin()],
});
