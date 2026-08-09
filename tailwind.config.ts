import type { Config } from "tailwindcss";

export default { darkMode: "class", content: ["./index.html", "./src/**/*.{ts,tsx}"], theme: { extend: { fontFamily: { sans: ["Inter", "ui-sans-serif", "system-ui"] } } }, plugins: [] } satisfies Config;
