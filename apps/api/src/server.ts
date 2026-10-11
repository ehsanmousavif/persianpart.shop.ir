import path from 'node:path'
import { handler } from './rpc/handler'
import { createContext } from './rpc/context'

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

export const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,

  async fetch(req) {
    const url = new URL(req.url)

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      const origin = req.headers.get('origin') || '*'
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      })
    }

    try {
      // 1. Media server powered natively by Bun.file()
      if (url.pathname.startsWith('/api/media/')) {
        const segments = url.pathname.split('/').filter(Boolean)
        const rawFilename = segments[segments.length - 1]
        if (!rawFilename) {
          return new Response('Bad Request', { status: 400 })
        }

        const filename = decodeURIComponent(rawFilename)

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

        return new Response('File Not Found', { status: 404 })
      }

      // 2. oRPC endpoints (/api/rpc/*)
      if (url.pathname.startsWith('/api/rpc')) {
        const { matched, response } = await handler.handle(req, {
          prefix: '/api/rpc',
          context: async () => createContext(req),
        })

        if (matched) {
          return response
        }

        return new Response(
          JSON.stringify({ error: 'Procedure Not Found' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // 3. OpenAPI forward proxy (/api/openapi/*)
      if (url.pathname.startsWith('/api/openapi')) {
        const targetUrl = new URL(url.pathname + url.search, CMS_ORIGIN)
        const forwardHeaders = new Headers(req.headers)
        forwardHeaders.set('host', targetUrl.host)

        try {
          return await fetch(targetUrl.toString(), {
            method: req.method,
            headers: forwardHeaders,
            body:
              req.method !== 'GET' && req.method !== 'HEAD'
                ? await req.arrayBuffer()
                : undefined,
          })
        } catch {
          return new Response(
            JSON.stringify({ error: 'OpenAPI not configured or CMS offline' }),
            {
              status: 502,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      }

      // 4. Health Check (/health & /api/health)
      if (url.pathname === '/health' || url.pathname === '/api/health') {
        return Response.json({
          status: 'ok',
          runtime: 'bun',
          version: Bun.version,
          port: PORT,
          uptime: Math.round(process.uptime()),
        })
      }

      // 5. Root status landing page (/)
      if (url.pathname === '/' || url.pathname === '') {
        const html = `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>سرویس API پرشین پارت (Bun Runtime)</title>
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
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
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
      <span class="badge">⚡ Bun v${Bun.version} Active</span>
    </div>
    <p>
      این سرویس به صورت بومی روی ران‌تایم پرسرعت <strong>Bun</strong> و فریم‌ورک ارتباطی تایپ‌سیف <strong>oRPC v2</strong> اجرا شده است. سرو تمامی تصاویر رسانه‌ای به شکل بهینه و با وب‌استریم‌های <code>Bun.file()</code> انجام می‌شود.
    </p>
    <h2>اندپوینت‌های فعال:</h2>
    <ul>
      <li><strong>oRPC API:</strong> <code>/api/rpc</code> (فراخوانی متدهای تایپ‌سیف کاتالوگ، سفارشات، سبد و احراز هویت)</li>
      <li><strong>Media Server:</strong> <code>/api/media/file/:filename</code> (سرو استریمینگ تصاویر با Bun.file)</li>
      <li><strong>OpenAPI REST:</strong> <code>/api/openapi</code> (دسترسی REST به پایگاه داده و CMS)</li>
      <li><strong>Health Check:</strong> <code>/health</code> (بررسی سلامت سرور)</li>
    </ul>
    <div class="footer">
      <span>PersianPart 2.0 API Server</span>
      <span>Port: ${PORT}</span>
    </div>
  </div>
</body>
</html>`

        return new Response(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        })
      }

      return new Response('Not Found', { status: 404 })
    } catch (err: any) {
      console.error('[Bun server error]:', err)
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: err?.message || 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  },
})

console.log(`🚀 PersianPart API running on http://localhost:${PORT} (Bun v${Bun.version})`)
