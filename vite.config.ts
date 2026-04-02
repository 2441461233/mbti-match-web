import { defineConfig, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

// 简单的 Vite 插件用于在本地开发时 Mock Vercel 的 API 路由
function apiMockPlugin() {
  return {
    name: 'api-mock',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.url === '/api/admin/login' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: Buffer) => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const { username, password } = JSON.parse(body)
              const user = process.env.ADMIN_USER || 'admin'
              const pass = process.env.ADMIN_PASSWORD || '123'
              const token = process.env.ADMIN_TOKEN || 'mbti-match-admin-token-dev'

              res.setHeader('Content-Type', 'application/json')
              if (username === user && password === pass) {
                res.statusCode = 200
                res.end(JSON.stringify({ token }))
              } else {
                res.statusCode = 401
                res.end(JSON.stringify({ error: 'Invalid credentials' }))
              }
            } catch (e) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Bad Request' }))
            }
          })
          return
        }
        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiMockPlugin()
  ],
})
