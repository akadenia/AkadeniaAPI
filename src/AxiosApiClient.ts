import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

import axiosRetry, { IAxiosRetryConfig } from "axios-retry"
import { HeadersType, Headers } from "./headers"
import { ApiResponseMessage } from "./enums"
import { getGenericResponseFromError } from "./helpers"
import { AkadeniaApiSuccessResponse, AkadeniaApiErrorResponse, AkadeniaApiResponse } from "./types"

type AxiosApiClientOpts = {
  baseUrl: string
  headers?: HeadersType
  timeout?: number
  retries?: number
  retryDelay?: (retryCount: number) => number
  onRetry?: (retryCount: number, error: AxiosError, requestConfig: AxiosRequestConfig) => Promise<void> | void
}

class AxiosApiClient {
  private instance: AxiosInstance
  private headers = new Headers()

  constructor({ baseUrl, headers, timeout = 30000, retries = 3, retryDelay, onRetry }: AxiosApiClientOpts) {
    this.instance = axios.create({
      baseURL: baseUrl,
      timeout,
      headers,
    })
    if (headers) {
      this.headers.append(headers)
    }
    const retryConfig: IAxiosRetryConfig = { retries }

    if (retryDelay) {
      retryConfig.retryDelay = retryDelay
    }

    if (onRetry) {
      retryConfig.onRetry = onRetry
    }

    axiosRetry(this.instance, retryConfig)

    this.instance.interceptors.response.use(this.successResponseHandler, this.errorResponseHandler)
  }

  getInstance(): AxiosInstance {
    return this.instance
  }

  private successResponseHandler(response: AxiosResponse): AkadeniaApiSuccessResponse {
    let success = true
    if ("success" in response && response.success === false) {
      success = false
    }
    return { ...response, success }
  }

  private errorResponseHandler(error: unknown): AkadeniaApiErrorResponse {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        //  The request was made and the server responded with a status code that falls out of the range of 2xx
        return getGenericResponseFromError(error)
      }
      if (error.request) {
        // The request was made but no response was received, mostly due to network errors
        return { success: false, message: ApiResponseMessage.NetworkError, error }
      }
    }
    // Something happened in setting up the request, probably axios was not properly configured
    return { success: false, message: ApiResponseMessage.UnknownError, error }
  }

  private setConfigRequestHeaders(config?: AxiosRequestConfig) {
    const headers = { ...this.headers.headers, ...config?.headers }
    return { ...config, headers }
  }

  setHeader(name: string, value: string): void {
    this.headers.set(name, value)
  }

  removeHeader(name: string): void {
    this.headers.remove(name)
    const defaults = this.instance.defaults.headers
    delete defaults.common[name]
    delete (defaults as Record<string, any>)[name]
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.get(url, config)
  }

  async head<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.head(url, config)
  }

  async options<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.options(url, config)
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.post(url, data, config)
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.put(url, data, config)
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.delete(url, config)
  }
}

export { AxiosApiClient, type AxiosError }
