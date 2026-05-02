import { AxiosResponse, AxiosError } from "axios"

export type AkadeniaApiSuccessResponse<T = unknown> = AxiosResponse<T> & {
  success: boolean // due to the retry-logic, we cannot guarantee that a AkadeniaApiSuccessResponse type will always have success to be true
  message?: string
}

export type AkadeniaApiErrorResponse = Partial<AxiosError["response"]> & {
  success: false
  message: string
  data?: unknown
  error: unknown
}

export type AkadeniaApiResponse<T = unknown> = AkadeniaApiSuccessResponse<T> | AkadeniaApiErrorResponse
