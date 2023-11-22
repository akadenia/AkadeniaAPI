type Headers = {
  [key: string]: string | number | boolean
}

interface IHttpHeaders {
  headers?: Headers

  set(name: string, value: string): void

  get(name: string): void

  append(headers: Headers): void
}

export { type Headers, type IHttpHeaders }
