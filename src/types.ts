import { AxiosResponse, AxiosError } from "axios"

export type AkadeniaApiSuccessResponse<T = unknown> = {
  data: T
  status: number
  statusText: string
  headers: any
  config?: any
  request?: any
  success: true
  message?: string
}

export type AkadeniaApiErrorResponse = {
  success: false
  status?: number
  statusText?: string
  headers?: any
  data?: unknown
  message: string
  error: unknown
}

export type AkadeniaApiResponse<T = unknown> = AkadeniaApiSuccessResponse<T> | AkadeniaApiErrorResponse
