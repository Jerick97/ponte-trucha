import { defineConfig } from 'vitest/config';
import { loadEnv, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Proxy del servidor de desarrollo.
 *
 * El emulador local (Floci) no responde con headers CORS y expone el HTTP API
 * en una ruta interna (`/restapis/{id}/$default/_user_request_`). En vez de
 * meter esa forma en el frontend, el dev server la publica en su mismo origen:
 *
 *   /api      -> HTTP API (API Gateway + Lambda + DynamoDB del emulador)
 *   /cognito  -> cognito-idp del User Pool adulto
 *
 * Los valores salen de `.env.local`, que genera `scripts/entorno-floci.sh` a
 * partir de los outputs de Terraform. Contra AWS real no se usa proxy: el
 * frontend apunta a la URL pública del API y al dominio de Cognito.
 */
function proxyLocal(env: Record<string, string>): Record<string, ProxyOptions> {
  const endpoint = env.PTK_LOCAL_AWS_ENDPOINT;
  const apiId = env.PTK_LOCAL_API_ID;
  if (!endpoint || !apiId) return {};

  const stage = '$default';
  return {
    '/api': {
      target: endpoint,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, `/restapis/${apiId}/${stage}/_user_request_`),
    },
    '/cognito': {
      target: endpoint,
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/cognito/, '') || '/',
    },
  };
}

// Build estatico: el resultado de dist/ se sube tal cual a S3 + CloudFront.
export default defineConfig(({ mode }) => {
  // Prefijo vacio: tambien lee las variables sin `VITE_`, que solo usa el
  // proxy en Node y nunca entran al bundle publico.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    base: './',
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
    server: {
      proxy: proxyLocal(env),
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
    },
  };
});
