export const CMS_URL = process.env.CMS_URL || 'http://localhost:5148'

export interface CmsStatus {
  cmsUrl: string
  isReachable: boolean
  collections: string[]
}

export interface CmsMediaItem {
  id: string | number
  alt?: string
  filename?: string
  mimeType?: string
  filesize?: number
  url?: string
  createdAt?: string
}

export interface CmsMediaResponse {
  docs: CmsMediaItem[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
}

/**
 * Checks connectivity to the Payload CMS service
 */
export async function getCmsStatus(): Promise<CmsStatus> {
  try {
    const res = await fetch(`${CMS_URL}/api/users`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    })

    // Payload returns 403 or 200 when alive
    const isReachable = res.status < 500

    return {
      cmsUrl: CMS_URL,
      isReachable,
      collections: ['users', 'media'],
    }
  } catch {
    return {
      cmsUrl: CMS_URL,
      isReachable: false,
      collections: ['users', 'media'],
    }
  }
}

/**
 * Queries uploaded media from Payload CMS
 */
export async function listCmsMedia(page = 1, limit = 10): Promise<CmsMediaResponse> {
  try {
    const res = await fetch(`${CMS_URL}/api/media?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(3000),
    })

    if (!res.ok) {
      return {
        docs: [],
        totalDocs: 0,
        limit,
        totalPages: 1,
        page,
      }
    }

    const data = await res.json()
    return data
  } catch {
    return {
      docs: [],
      totalDocs: 0,
      limit,
      totalPages: 1,
      page,
    }
  }
}
