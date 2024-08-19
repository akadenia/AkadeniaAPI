type HeadersType = {
  [key: string]: string | number | boolean
}

interface IHttpHeaders {
  headers?: HeadersType

  set(name: string, value: string): void

  get(name: string): void

  append(headers: HeadersType): void
}

class Headers implements IHttpHeaders {
  headers: HeadersType = {}

  constructor(headers?: HeadersType) {
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

  append(headers: HeadersType): void {
    this.headers = { ...this.headers, ...headers }
  }
}

export { type HeadersType, type IHttpHeaders, Headers }
