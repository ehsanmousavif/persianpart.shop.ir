import path from 'node:path'
import { Hono } from 'hono'
import type { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { jwt } from 'hono/jwt'
import { handler } from './rpc/handler'
import { createContext } from './rpc/context'
import { JWT_SECRET } from './lib/jwt'

const PORT = Number(process.env.PORT) || 5175
const HOSTNAME = process.env.HOST || '0.0.0.0'
const CMS_ORIGIN = process.env.CMS_URL || 'http://localhost:5174'

// Candidate directories for media assets
const candidateMediaDirs = [
  path.resolve(import.meta.dir, '../../cms/media'),
  path.resolve(import.meta.dir, '../../web/public/assets/images'),
  path.resolve(import.meta.dir, '../media'),
  path.resolve(process.cwd(), 'apps/cms/media'),
  path.resolve(process.cwd(), 'apps/web/public/assets/images'),
  path.resolve(process.cwd(), 'media'),
]

// Initialize Hono Application
export const app = new Hono()

// Global Middlewares (Logger, Formatting, CORS)
app.use('*', logger())
app.use('*', prettyJSON())
app.use(trimTrailingSlash())
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400,
  })
)

// 1. Health Checks
const healthHandler = (c: Context) => {
  return c.json({
    status: 'ok',
    framework: 'hono',
    runtime: 'bun',
    version: Bun.version,
    port: PORT,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  })
}

app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

// 2. Built-in Hono JWT Protected Endpoint (/api/auth/me)
app.use(
  '/api/auth/me',
  jwt({
    secret: JWT_SECRET,
    alg: 'HS256',
  })
)

app.get('/api/auth/me', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({
    status: 'authenticated',
    user: payload,
  })
})

// 3. Media Server Powered by Bun.file()
app.get('/api/media/*', async (c) => {
  const segments = c.req.path.split('/').filter(Boolean)
  const rawFilename = segments[segments.length - 1]
  if (!rawFilename) {
    return c.text('Bad Request', 400)
  }

  // Prevent path traversal attacks
  const filename = path.basename(decodeURIComponent(rawFilename))

  for (const dir of candidateMediaDirs) {
    const candidatePath = path.join(dir, filename)
    const file = Bun.file(candidatePath)
    if (await file.exists()) {
      return new Response(file, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }
  }

  return c.text('File Not Found', 404)
})

// 3. oRPC Server Integration (/api/rpc/*)
const rpcHandler = async (c: Context) => {
  const { matched, response } = await handler.handle(c.req.raw, {
    prefix: '/api/rpc',
    context: async () => createContext(c.req.raw),
  })

  if (matched && response) {
    return response
  }

  return c.json({ error: 'Procedure Not Found' }, 404)
}

app.all('/api/rpc', rpcHandler)
app.all('/api/rpc/*', rpcHandler)

// 4. OpenAPI Forward Proxy to CMS (/api/openapi/*)
const openApiHandler = async (c: Context) => {
  const url = new URL(c.req.url)
  const targetUrl = new URL(url.pathname + url.search, CMS_ORIGIN)
  const forwardHeaders = new Headers(c.req.raw.headers)
  forwardHeaders.set('host', targetUrl.host)

  try {
    return await fetch(targetUrl.toString(), {
      method: c.req.method,
      headers: forwardHeaders,
      body:
        c.req.method !== 'GET' && c.req.method !== 'HEAD'
          ? await c.req.raw.arrayBuffer()
          : undefined,
    })
  } catch {
    return c.json({ error: 'OpenAPI not configured or CMS offline' }, 502)
  }
}

app.all('/api/openapi', openApiHandler)
app.all('/api/openapi/*', openApiHandler)

// 5. Root Status & Dashboard Landing Page
app.get('/', (c) => {
  const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سرویس API پرشین پارت (Hono + Bun)</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 680px;
      margin: 40px auto;
      padding: 0 20px;
      line-height: 1.7;
      color: #0f172a;
      background: #f8fafc;
    }
    .card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 22px;
      margin: 0;
      color: #0f172a;
    }
    .badges {
      display: flex;
      gap: 8px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }
    .badge-hono {
      background: #fff7ed;
      color: #ea580c;
      border: 1px solid #fed7aa;
    }
    .badge-bun {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    p {
      color: #475569;
      font-size: 14px;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 16px;
      margin-bottom: 12px;
      color: #1e293b;
    }
    ul {
      padding-right: 20px;
      margin: 0;
      color: #334155;
      font-size: 13.5px;
    }
    li {
      margin-bottom: 10px;
    }
    code {
      background: #f1f5f9;
      color: #0284c7;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12.5px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      direction: ltr;
      display: inline-block;
    }
    .footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #94a3b8;
      display: flex;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>سرویس API پرشین پارت</h1>
      <div class="badges">
        <span class="badge badge-hono">🔥 Hono v4</span>
        <span class="badge badge-bun">⚡ Bun v${Bun.version}</span>
      </div>
    </div>
    <p>
      این سرویس با معماری فوق‌سریع بر پایه فریم‌ورک استاندارد وب <strong>Hono</strong>، ران‌تایم مدرن <strong>Bun</strong> و لایه ارتباطی تایپ‌سیف <strong>oRPC v2</strong> پیکربندی شده است.
    </p>
    <h2>اندپوینت‌های فعال:</h2>
    <ul>
      <li><strong>oRPC API:</strong> <code>/api/rpc</code> (فراخوانی متدهای تایپ‌سیف کاتالوگ، سفارشات، سبد و احراز هویت)</li>
      <li><strong>Media Server:</strong> <code>/api/media/:filename</code> (سرو استریمینگ بومی رسانه‌ها با Bun.file)</li>
      <li><strong>OpenAPI REST:</strong> <code>/api/openapi</code> (هدایت درخواست‌ها به پایگاه داده و CMS)</li>
      <li><strong>Health Check:</strong> <code>/health</code> و <code>/api/health</code> (بررسی وضعیت زنده سرور)</li>
    </ul>
    <div class="footer">
      <span>PersianPart 2.0 API Server</span>
      <span>Port: ${PORT}</span>
    </div>
  </div>
</body>
</html>`
  return c.html(html)
})

// 6. Global Error & 404 Handlers
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      {
        error: err.message || 'Unauthorized',
        status: err.status,
      },
      err.status
    )
  }
  console.error('[Hono Server Error]:', err)
  return c.json(
    {
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error',
    },
    500
  )
})

app.notFound((c) => {
  return c.json({ error: 'Route Not Found', path: c.req.path }, 404)
})

console.log(
  `🚀 PersianPart API running on http://${HOSTNAME === '0.0.0.0' ? 'localhost' : HOSTNAME}:${PORT} (Hono + Bun v${Bun.version})`
)

// Export for Bun's native HTTP server
export default {
  port: PORT,
  hostname: HOSTNAME,
  fetch: app.fetch,
}
