import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

import axiosRetry from "axios-retry"
import { Headers, IHttpHeaders } from "./headers"

class AxiosHeaders implements IHttpHeaders {
  headers: Headers = {}

  constructor(headers?: Headers) {
    if (headers) {
      this.headers = headers
    }
  }

  set(name: string, value: string): void {
    this.headers[name] = value
  }

  get(name: string) {
    return this.headers[name]
  }

  append(headers: Headers): void {
    this.headers = { ...this.headers, ...headers }
  }
}

class AxiosApiClient {
  private instance: AxiosInstance
  private headers: AxiosHeaders = new AxiosHeaders()

  constructor(
    baseUrl: string,
    headers?: Headers,
    timeout: number = 30000,
    retries: number = 3,
    retryDelay?: (retryCount: number) => number,
    onRetry?: (retryCount: number, error: any) => void,
  ) {
    this.instance = axios.create({
      baseURL: baseUrl,
      timeout,
      headers,
    })
    if (headers) {
      this.headers.append(headers)
    }
    axiosRetry(this.instance, { retries, retryDelay, onRetry })
  }

  getInstance(): AxiosInstance {
    return this.instance
  }

  private setConfigRequestHeaders(config?: AxiosRequestConfig) {
    const headers = { ...this.headers.headers, ...config?.headers }
    return { ...config, headers }
  }

  setHeader(name: string, value: string): void {
    this.headers.set(name, value)
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.put(url, data, config)
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return await this.instance.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    config = this.setConfigRequestHeaders(config)
    return this.instance.delete(url, config)
  }
}

export { AxiosApiClient, type AxiosError }
