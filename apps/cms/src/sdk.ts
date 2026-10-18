import { PayloadSDK, PayloadSDKError } from '@payloadcms/sdk'
import type { Config } from './payload-types.js'

export { PayloadSDK, PayloadSDKError }
export type TypedPayloadSDK = PayloadSDK<Config>
export type { Config }

export interface PayloadSdkOptions {
  /**
   * Base API URL for Payload REST API.
   * Defaults to CMS_API_URL or `${CMS_URL || 'http://localhost:5174'}/api`
   * @example 'http://localhost:5174/api'
   */
  baseURL?: string

  /**
   * Optional API Key for service-to-service authentication
   */
  apiKey?: string

  /**
   * Optional default JWT Bearer token
   */
  token?: string

  /**
   * Base RequestInit for all requests (credentials, headers, etc.)
   */
  baseInit?: RequestInit

  /**
   * Custom fetch implementation
   */
  fetch?: typeof fetch

  /**
   * Request timeout in milliseconds (default: 10,000ms)
   */
  timeoutMs?: number

  /**
   * Maximum retry attempts on transient network errors (default: 2)
   */
  maxRetries?: number
}

function resolveDefaultBaseURL(): string {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.CMS_API_URL) return process.env.CMS_API_URL
    if (process.env.PAYLOAD_URL) return `${process.env.PAYLOAD_URL.replace(/\/+$/, '')}/api`
    if (process.env.CMS_URL) return `${process.env.CMS_URL.replace(/\/+$/, '')}/api`
    if (process.env.NEXT_PUBLIC_SERVER_URL) {
      return `${process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/+$/, '')}/api`
    }
  }
  return 'http://localhost:5174/api'
}

/**
 * Creates a resilient fetch wrapper with timeout, retries, and informative error handling
 */
function createResilientFetch(options: PayloadSdkOptions): typeof fetch {
  const customFetch = options.fetch || globalThis.fetch
  const timeoutMs = options.timeoutMs ?? 10_000
  const maxRetries = options.maxRetries ?? 2

  const resilientFetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    let lastError: unknown = null
    const targetUrl = typeof url === 'string' ? url : url.toString()

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      // Merge signals if an existing signal was passed
      const signal = init?.signal
        ? anySignal([init.signal, controller.signal])
        : controller.signal

      try {
        const response = await customFetch(url, {
          ...init,
          signal,
        })
        clearTimeout(timeoutId)

        // Retry on 502/503/504 if attempts remain
        if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
          const backoff = Math.min(100 * Math.pow(2, attempt) + Math.random() * 50, 1000)
          await sleep(backoff)
          continue
        }

        return response
      } catch (err: any) {
        clearTimeout(timeoutId)
        lastError = err

        // Abort due to timeout
        if (err?.name === 'AbortError' || signal?.aborted) {
          if (attempt < maxRetries) {
            await sleep(150 * (attempt + 1))
            continue
          }
          throw new PayloadSDKError({
            errors: [{ message: `Payload SDK request timed out after ${timeoutMs}ms: [${init?.method || 'GET'}] ${targetUrl}` }],
            message: `Payload SDK request timed out after ${timeoutMs}ms: [${init?.method || 'GET'}] ${targetUrl}`,
            response: new Response(null, { status: 504 }),
            status: 504,
          })
        }

        // Network connection error
        if (attempt < maxRetries) {
          const backoff = Math.min(100 * Math.pow(2, attempt) + Math.random() * 50, 1000)
          await sleep(backoff)
          continue
        }
      }
    }

    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError)
    throw new PayloadSDKError({
      errors: [{ message: errorMsg }],
      message: `Payload SDK network failure connecting to ${targetUrl}: ${errorMsg}. Ensure CMS is running at ${options.baseURL || resolveDefaultBaseURL()}`,
      response: new Response(null, { status: 503 }),
      status: 503,
    })
  }

  return resilientFetch as typeof fetch
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort()
      return signal
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Factory to create a fully type-safe PayloadSDK instance for PersianPart CMS
 */
export function createPayloadSDK(options: PayloadSdkOptions = {}): TypedPayloadSDK {
  const baseURL = options.baseURL || resolveDefaultBaseURL()
  const resilientFetch = createResilientFetch({ ...options, baseURL })

  const baseHeaders: Record<string, string> = {
    Accept: 'application/json',
  }

  if (options.apiKey) {
    baseHeaders['Authorization'] = `users API-Key ${options.apiKey}`
  } else if (options.token) {
    baseHeaders['Authorization'] = `Bearer ${options.token}`
  }

  const baseInit: RequestInit = {
    ...options.baseInit,
    headers: {
      ...baseHeaders,
      ...(options.baseInit?.headers as Record<string, string>),
    },
  }

  return new PayloadSDK<Config>({
    baseURL,
    baseInit,
    fetch: resilientFetch,
  })
}

/**
 * Singleton instance configured for PersianPart CMS
 */
export const sdk: TypedPayloadSDK = createPayloadSDK()
