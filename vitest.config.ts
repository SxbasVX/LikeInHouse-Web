import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    test: {
        environment: "node",
        globals: true,
        include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
        // next-intl importa "next/server" sin extensión; procesarlo con Vite permite probar el middleware.
        server: { deps: { inline: ["next-intl"] } },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
