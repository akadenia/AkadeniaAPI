import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

import axiosRetry from "axios-retry"
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
  onRetry?: (retryCount: number, error: any) => void
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
    axiosRetry(this.instance, { retries, retryDelay, onRetry })

    this.instance.interceptors.response.use(this.successResponseHandler, this.errorResponseHandler)
  }

  getInstance(): AxiosInstance {
    return this.instance
  }

  private successResponseHandler(response: AxiosResponse): AkadeniaApiSuccessResponse {
    let success = true
    if ("success" in response && !response.success) {
      success = response.success as boolean
    }
    return { ...response, success }
  }

  private errorResponseHandler(error: any): AkadeniaApiErrorResponse {
    if (error.response) {
      //  The request was made and the server responded with a status code that falls out of the range of 2xx
      return getGenericResponseFromError(error)
    } else if (error.request) {
      // The request was made but no response was received, mostly due to network errors
      return { success: false, message: ApiResponseMessage.NetworkError, error }
    } else {
      // Something happened in setting up the request, probably axios was not properly configured
      return { success: false, message: ApiResponseMessage.UnknownError, error }
    }
  }

  private setConfigRequestHeaders(config?: AxiosRequestConfig) {
    const headers = { ...this.headers.headers, ...config?.headers }
    return { ...config, headers }
  }

  setHeader(name: string, value: string): void {
    this.headers.set(name, value)
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.put(url, data, config)
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return await this.instance.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.delete(url, config)
  }
}

export { AxiosApiClient, type AxiosError }
