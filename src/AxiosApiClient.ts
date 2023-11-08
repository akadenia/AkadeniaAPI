import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

import axiosRetry from "axios-retry"

export class AxiosApiClient {
  private instance: AxiosInstance

  constructor(
    baseUrl: string,
    timeout: number = 30000,
    retries: number = 3,
    retryDelay?: (retryCount: number) => number,
    onRetry?: (retryCount: number, error: any) => void,
  ) {
    this.instance = axios.create({
      baseURL: baseUrl,
      timeout,
    })

    axiosRetry(this.instance, { retries, retryDelay, onRetry })
  }

  getInstance(): AxiosInstance {
    return this.instance
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get(url, config)
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post(url, data, config)
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put(url, data, config)
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return await this.instance.patch(url, data, config)
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete(url, config)
  }
}
