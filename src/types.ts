import { AxiosResponse } from "axios"

export type SuccessResponse = AxiosResponse<any, any> & {
  success: true
}

export type GenericErrorResponse = {
  success: false
  message: string
  data?: any
}

export type Response = SuccessResponse | GenericErrorResponse
