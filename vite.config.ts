import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    // O plugin de integrações para agentes (MCP) só é empacotado fora da build
    // de produção: no site público ele não é utilizado.
    plugins: [react(), isProduction ? null : mcpPlugin()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // Em produção, o adaptador de sessão do ambiente de pré-visualização é
        // substituído por um stub neutro (o navegador usa localStorage).
        ...(isProduction
          ? {
              "./previewAuthStorage": path.resolve(
                __dirname,
                "./src/integrations/supabase/previewAuthStorageProd.ts",
              ),
            }
          : {}),
      },
    },
  };
});
