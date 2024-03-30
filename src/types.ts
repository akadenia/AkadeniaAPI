import { AxiosResponse, AxiosError } from "axios"

export type AkadeniaApiSuccessResponse<T = any> = AxiosResponse<T, any> & {
  success: boolean // due to the retry-logic, we cannot guarantee that a AkadeniaApiSuccessResponse type will always have success to be true
  message?: string
}

export type AkadeniaApiErrorResponse = Partial<AxiosError["response"]> & {
  success: false
  message: string
  data?: any
  error: any
}

export type AkadeniaApiResponse<T = any> = AkadeniaApiSuccessResponse<T> | AkadeniaApiErrorResponse
