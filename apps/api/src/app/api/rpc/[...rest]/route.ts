const CMS_ORIGIN = process.env.CMS_URL || 'http://localhost:5148'

async function handle(request: Request) {
  const url = new URL(request.url)
  const targetUrl = new URL(url.pathname + url.search, CMS_ORIGIN)

  const headers = new Headers(request.headers)
  headers.set('host', targetUrl.host)

  try {
    const res = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    })

    return res
  } catch (error) {
    console.error('[API Proxy Error]:', error)
    return new Response(JSON.stringify({ error: 'Gateway error - CMS offline or unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const OPTIONS = handle

