import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await context.params
    if (!slug || slug.length === 0) {
      return new NextResponse('Bad Request', { status: 400 })
    }

    // Extract filename from last slug segment
    const rawFilename = slug[slug.length - 1]
    const filename = decodeURIComponent(rawFilename)

    // Check candidate media directories
    const candidateDirs = [
      path.resolve(process.cwd(), '../cms/media'),
      path.resolve(process.cwd(), 'apps/cms/media'),
      path.resolve(process.cwd(), '../../apps/cms/media'),
      path.resolve(process.cwd(), 'media'),
      path.resolve(process.cwd(), '../web/public/assets/images'),
    ]

    let foundPath: string | null = null
    for (const dir of candidateDirs) {
      const candidate = path.join(dir, filename)
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        foundPath = candidate
        break
      }
    }

    if (!foundPath) {
      return new NextResponse('File Not Found', { status: 404 })
    }

    const fileBuffer = fs.readFileSync(foundPath)
    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_MAP[ext] || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('[media route error]:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
