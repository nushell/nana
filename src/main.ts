import App from "./App.svelte";

const app = new App({
    target: document.body,
    props: {},
});

export default app;

import { WebviewWindow } from "@tauri-apps/api/window";

if (typeof window !== "undefined") {
    addEventListener("keydown", async (event) => {
        // Create a new window
        if (event.ctrlKey && event.key === "s") {
            console.log("listening for ctrl+s");
            // event.preventDefault();
            // // @ts-ignore - marked private
            // return new WebviewWindow(
            // 	Math.random().toString(36).slice(2)
            // );
        }
    });
}
