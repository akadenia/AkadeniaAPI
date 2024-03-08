import { ApiResponseMessage } from "./enums"
import { GenericErrorResponse } from "./types"

export function getGenericResponseFromError(error: any): GenericErrorResponse {
  let message = error?.response?.data?.message
  const data = error?.response?.data

  switch (error.response?.status) {
    case 400:
      message = message || ApiResponseMessage.BadRequest
      break
    case 401:
      message = message || ApiResponseMessage.Unauthorized
      break
    case 403:
      message = message || ApiResponseMessage.Forbidden
      break
    case 404:
      message = message || ApiResponseMessage.NotFound
      break
    case 422:
      message = message || ApiResponseMessage.UnProcessableEntity
      break
    case 500:
      message = message || ApiResponseMessage.InternalServerError
      break
    default:
      message = message || ApiResponseMessage.UnknownError
  }

  return {
    success: false,
    message,
    data,
  }
}