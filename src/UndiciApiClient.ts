import { Dispatcher, Pool, RetryAgent, RetryHandler, errors as UndiciErrors } from "undici"

import { HeadersType, Headers } from "./headers"
import { ApiResponseMessage } from "./enums"
import { AkadeniaApiSuccessResponse, AkadeniaApiErrorResponse, AkadeniaApiResponse } from "./types"

type UndiciHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"

export type UndiciRequestConfig = {
  headers?: HeadersType
  signal?: AbortSignal
  query?: Record<string, unknown>
  timeout?: number
}

export type UndiciRequestContext = {
  url: string
  method: UndiciHttpMethod
  headers: HeadersType
  body?: unknown
  query?: Record<string, unknown>
}

type UndiciApiClientOpts = {
  baseUrl: string
  headers?: HeadersType
  timeout?: number
  retries?: number
  retryDelay?: (retryCount: number) => number
  onRetry?: (retryCount: number, error: Error, requestContext: UndiciRequestContext) => Promise<void> | void
  onRequest?: (context: UndiciRequestContext) => UndiciRequestContext | Promise<UndiciRequestContext>
  onRequestError?: (error: unknown) => unknown
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (value === null || typeof value !== "object") return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

const messageForStatus = (status: number | undefined, fallback?: string): string => {
  if (fallback) return fallback
  switch (status) {
    case 400:
      return ApiResponseMessage.BadRequest
    case 401:
      return ApiResponseMessage.Unauthorized
    case 403:
      return ApiResponseMessage.Forbidden
    case 404:
      return ApiResponseMessage.NotFound
    case 422:
      return ApiResponseMessage.UnProcessableEntity
    case 500:
      return ApiResponseMessage.InternalServerError
    default:
      return ApiResponseMessage.UnknownError
  }
}

const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === "object") {
    const code = (error as { code?: string }).code
    if (typeof code === "string" && /^(E[A-Z]+|UND_ERR_[A-Z_]+)$/.test(code)) return true
    const name = (error as { name?: string }).name
    if (name === "AbortError" || name === "TimeoutError") return true
  }
  return false
}

class UndiciApiClient {
  private pool: Pool
  private dispatcher: Dispatcher
  private headers = new Headers()
  private baseUrl: string
  private timeout: number
  private onRequestHook?: UndiciApiClientOpts["onRequest"]
  private onRequestErrorHook?: UndiciApiClientOpts["onRequestError"]

  constructor({
    baseUrl,
    headers,
    timeout = 30000,
    retries = 3,
    retryDelay,
    onRetry,
    onRequest,
    onRequestError,
  }: UndiciApiClientOpts) {
    this.baseUrl = baseUrl
    this.timeout = timeout
    this.onRequestHook = onRequest
    this.onRequestErrorHook = onRequestError

    if (headers) {
      this.headers.append(headers)
    }

    this.pool = new Pool(baseUrl, {
      connections: 10,
      headersTimeout: timeout,
      bodyTimeout: timeout,
    })

    if (retries > 0) {
      const retryOptions: RetryHandler.RetryOptions = {
        maxRetries: retries,
        throwOnError: false,
        statusCodes: [500, 502, 503, 504, 429],
        errorCodes: [
          "ECONNRESET",
          "ECONNREFUSED",
          "ENOTFOUND",
          "ENETDOWN",
          "ENETUNREACH",
          "EHOSTDOWN",
          "EHOSTUNREACH",
          "EPIPE",
          "UND_ERR_SOCKET",
          "UND_ERR_HEADERS_TIMEOUT",
          "UND_ERR_BODY_TIMEOUT",
        ],
      }

      retryOptions.retry = (err, context, callback) => {
        const counter = context.state.counter
        const { statusCode, code } = err as Error & { statusCode?: number; code?: string }

        if (statusCode != null && retryOptions.statusCodes && !retryOptions.statusCodes.includes(statusCode)) {
          callback(err)
          return
        }
        if (code && code !== "UND_ERR_REQ_RETRY" && retryOptions.errorCodes && !retryOptions.errorCodes.includes(code)) {
          callback(err)
          return
        }
        if (counter > retries) {
          callback(err)
          return
        }
        const delay = retryDelay ? retryDelay(counter) : 0
        const invokeCallback = () => {
          if (onRetry) {
            try {
              const ctx: UndiciRequestContext = {
                url: typeof context.opts.path === "string" ? context.opts.path : "",
                method: (context.opts.method as UndiciHttpMethod) ?? "GET",
                headers: {},
              }
              const result = onRetry(counter, err, ctx)
              if (result && typeof (result as Promise<void>).then === "function") {
                ;(result as Promise<void>).then(
                  () => callback(null),
                  (callbackErr: Error) => callback(callbackErr),
                )
                return
              }
            } catch (callbackErr) {
              callback(callbackErr as Error)
              return
            }
          }
          callback(null)
        }
        if (delay > 0) {
          setTimeout(invokeCallback, delay)
        } else {
          invokeCallback()
        }
      }

      this.dispatcher = new RetryAgent(this.pool, retryOptions)
    } else {
      this.dispatcher = this.pool
    }
  }

  getDispatcher(): Dispatcher {
    return this.dispatcher
  }

  getPool(): Pool {
    return this.pool
  }

  setHeader(name: string, value: string): void {
    this.headers.set(name, value)
  }

  removeHeader(name: string): void {
    this.headers.remove(name)
  }

  async close(): Promise<void> {
    await this.pool.close()
  }

  private mergeHeaders(extra?: HeadersType): HeadersType {
    return { ...this.headers.headers, ...extra }
  }

  private serializeBody(
    body: unknown,
    headers: HeadersType,
  ): { body: string | Buffer | Uint8Array | null; headers: HeadersType } {
    if (body === undefined || body === null) {
      return { body: null, headers }
    }

    if (typeof body === "string" || Buffer.isBuffer(body) || body instanceof Uint8Array) {
      return { body: body as string | Buffer | Uint8Array, headers }
    }

    if (isPlainObject(body) || Array.isArray(body)) {
      const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === "content-type")
      const nextHeaders = hasContentType ? headers : { ...headers, "Content-Type": "application/json" }
      return { body: JSON.stringify(body), headers: nextHeaders }
    }

    return { body: String(body), headers }
  }

  private toUndiciHeaders(headers: HeadersType): Record<string, string> {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers)) {
      result[key] = String(value)
    }
    return result
  }

  private async parseResponseBody(body: Dispatcher.ResponseData["body"], contentType: string | undefined): Promise<unknown> {
    const text = await body.text()
    if (text.length === 0) return ""
    if (contentType && contentType.toLowerCase().includes("application/json")) {
      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    }
    return text
  }

  private getContentType(headers: Dispatcher.ResponseData["headers"]): string | undefined {
    const value = headers["content-type"]
    if (Array.isArray(value)) return value[0]
    return value
  }

  private async runRequest<T>(
    method: UndiciHttpMethod,
    url: string,
    data?: unknown,
    config?: UndiciRequestConfig,
  ): Promise<AkadeniaApiResponse<T>> {
    let context: UndiciRequestContext = {
      url,
      method,
      headers: this.mergeHeaders(config?.headers),
      body: data,
      query: config?.query,
    }

    if (this.onRequestHook) {
      try {
        context = await this.onRequestHook(context)
      } catch (error) {
        if (this.onRequestErrorHook) {
          try {
            await this.onRequestErrorHook(error)
          } catch (rethrown) {
            return {
              success: false,
              message: ApiResponseMessage.UnknownError,
              error: rethrown,
            }
          }
        }
        return {
          success: false,
          message: ApiResponseMessage.UnknownError,
          error,
        }
      }
    }

    const { body: serializedBody, headers: finalHeaders } = this.serializeBody(context.body, context.headers)

    try {
      const response = await this.dispatcher.request({
        origin: this.baseUrl,
        path: context.url,
        method: context.method,
        headers: this.toUndiciHeaders(finalHeaders),
        body: serializedBody,
        query: context.query,
        headersTimeout: config?.timeout ?? this.timeout,
        bodyTimeout: config?.timeout ?? this.timeout,
        signal: config?.signal,
      })

      const contentType = this.getContentType(response.headers)
      const parsedData = await this.parseResponseBody(response.body, contentType)
      const status = response.statusCode
      const statusText = response.statusText ?? ""

      if (status >= 400) {
        const dataAsRecord = isPlainObject(parsedData) ? (parsedData as { message?: string }) : undefined
        const errorResponse: AkadeniaApiErrorResponse = {
          success: false,
          status,
          statusText,
          headers: response.headers as AkadeniaApiErrorResponse["headers"],
          data: parsedData,
          message: messageForStatus(status, dataAsRecord?.message),
          error: new Error(`Request failed with status code ${status}`),
        }
        return errorResponse
      }

      const successResponse: AkadeniaApiSuccessResponse<T> = {
        data: parsedData as T,
        status,
        statusText,
        headers: response.headers,
        success: true,
      }
      return successResponse
    } catch (error) {
      if (isNetworkError(error)) {
        return {
          success: false,
          message: ApiResponseMessage.NetworkError,
          error,
        }
      }
      return {
        success: false,
        message: ApiResponseMessage.UnknownError,
        error,
      }
    }
  }

  async get<T>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("GET", url, undefined, config)
  }

  async head<T>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("HEAD", url, undefined, config)
  }

  async options<T>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("OPTIONS", url, undefined, config)
  }

  async delete<T>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("DELETE", url, undefined, config)
  }

  async post<T, D = unknown>(url: string, data?: D, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("POST", url, data, config)
  }

  async put<T, D = unknown>(url: string, data?: D, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("PUT", url, data, config)
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<T>> {
    return this.runRequest<T>("PATCH", url, data, config)
  }
}

export { UndiciApiClient }
