import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals"
import { createServer, IncomingMessage, Server, ServerResponse } from "node:http"
import { AddressInfo } from "node:net"

import { UndiciApiClient, UndiciRequestContext } from "../src"

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>

let server: Server
let baseUrl = ""
let handler: Handler = (_req, res) => {
  res.statusCode = 200
  res.end()
}
const requestLog: { method: string; url: string; headers: IncomingMessage["headers"]; body: string }[] = []

const readBody = (req: IncomingMessage): Promise<string> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on("data", (chunk: Buffer) => chunks.push(chunk))
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
    req.on("error", reject)
  })

beforeAll(async () => {
  server = createServer(async (req, res) => {
    const body = await readBody(req)
    requestLog.push({ method: req.method ?? "", url: req.url ?? "", headers: req.headers, body })
    try {
      await handler(req, res)
    } catch (err) {
      res.statusCode = 500
      res.end(String((err as Error).message))
    }
  })
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
  const address = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${address.port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())))
})

afterEach(() => {
  requestLog.length = 0
  handler = (_req, res) => {
    res.statusCode = 200
    res.end()
  }
})

describe("Undici API Client Methods", () => {
  it("should execute a GET request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1, title: "hello" }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.get<{ id: number; title: string }>("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    if (result.success) {
      expect(result.data).toEqual({ id: 1, title: "hello" })
    }
  })

  it("should execute a POST request with JSON body", async () => {
    handler = (_req, res) => {
      res.statusCode = 201
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 99 }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.post<{ id: number }>("/posts", { title: "foo", userId: 1 })
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(201)
    expect(result.data).toEqual({ id: 99 })
    expect(requestLog[0].headers["content-type"]).toBe("application/json")
    expect(JSON.parse(requestLog[0].body)).toEqual({ title: "foo", userId: 1 })
  })

  it("should execute a PUT request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1 }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.put("/posts/1", { id: 1, title: "foo" })
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
  })

  it("should execute a PATCH request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1, title: "patched" }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.patch<{ id: number; title: string }>("/posts/1", { title: "patched" })
    await client.close()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ id: 1, title: "patched" })
    }
  })

  it("should execute a DELETE request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.delete("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
  })

  it("should execute a HEAD request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("x-custom", "value")
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.head("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
  })

  it("should execute an OPTIONS request", async () => {
    handler = (_req, res) => {
      res.statusCode = 204
      res.setHeader("allow", "GET,POST,OPTIONS")
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.options("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(204)
  })
})

describe("Undici API Client Retry Logic", () => {
  it("should retry failed requests and eventually fail", async () => {
    let count = 0
    handler = (_req, res) => {
      count += 1
      res.statusCode = 500
      res.end()
    }
    const onRetrySpy = jest.fn()
    const client = new UndiciApiClient({ baseUrl, retries: 3, onRetry: onRetrySpy })
    const result = await client.delete("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toBe("Internal Server Error")
    }
    expect(count).toBe(4)
    expect(onRetrySpy).toHaveBeenCalledTimes(3)
  })

  it("should succeed without retries when first request succeeds", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1, title: "test" }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 3 })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    if (result.success) {
      expect(result.data).toEqual({ id: 1, title: "test" })
    }
  })

  it("should not retry on 4xx errors", async () => {
    let count = 0
    handler = (_req, res) => {
      count += 1
      res.statusCode = 404
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 3 })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    expect(result.status).toBe(404)
    if (!result.success) {
      expect(result.message).toBe("Resource Not Found")
    }
    expect(count).toBe(1)
  })

  it("should call retryDelay between retries", async () => {
    let count = 0
    handler = (_req, res) => {
      count += 1
      res.statusCode = 500
      res.end()
    }
    const retryDelaySpy = jest.fn(() => 1)
    const client = new UndiciApiClient({ baseUrl, retries: 2, retryDelay: retryDelaySpy })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    expect(count).toBe(3)
    expect(retryDelaySpy).toHaveBeenCalled()
  })
})

describe("Undici API Client Headers Interface", () => {
  it("should set default headers on every request", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1 }))
    }
    const client = new UndiciApiClient({
      baseUrl,
      retries: 0,
      headers: { "Content-Type": "application/json", Authorization: "Bearer token" },
    })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(requestLog[0].headers["content-type"]).toBe("application/json")
    expect(requestLog[0].headers["authorization"]).toBe("Bearer token")
  })

  it("should set headers configured at request level", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.get("/posts/1", {
      headers: { "X-Custom": "yes" },
    })
    await client.close()
    expect(result.success).toBe(true)
    expect(requestLog[0].headers["x-custom"]).toBe("yes")
  })

  it("setHeader should add a header to subsequent requests", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    client.setHeader("X-Token", "abc")
    await client.get("/posts/1")
    await client.close()
    expect(requestLog[0].headers["x-token"]).toBe("abc")
  })

  it("removeHeader should remove a previously set header", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({
      baseUrl,
      retries: 0,
      headers: { Authorization: "Bearer token" },
    })
    client.removeHeader("Authorization")
    await client.get("/posts/1")
    await client.close()
    expect(requestLog[0].headers["authorization"]).toBeUndefined()
  })

  it("request level headers should override default headers", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({
      baseUrl,
      retries: 0,
      headers: { "Content-Type": "application/json" },
    })
    await client.get("/posts/1", { headers: { "Content-Type": "application/xml" } })
    await client.close()
    expect(requestLog[0].headers["content-type"]).toBe("application/xml")
  })
})

describe("Undici API Client Request Interceptors", () => {
  it("should invoke onRequest before the request is sent", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const onRequestSpy = jest.fn((ctx: UndiciRequestContext) => ctx)
    const client = new UndiciApiClient({ baseUrl, retries: 0, onRequest: onRequestSpy })
    await client.get("/posts/1")
    await client.close()
    expect(onRequestSpy).toHaveBeenCalledTimes(1)
    const ctx = onRequestSpy.mock.calls[0][0]
    expect(ctx.url).toBe("/posts/1")
    expect(ctx.method).toBe("GET")
  })

  it("should allow onRequest to mutate request context", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({
      baseUrl,
      retries: 0,
      onRequest: (ctx) => {
        ctx.headers["X-Injected"] = "yes"
        return ctx
      },
    })
    await client.get("/posts/1")
    await client.close()
    expect(requestLog[0].headers["x-injected"]).toBe("yes")
  })

  it("should invoke onRequestError when onRequest throws", async () => {
    const onRequestErrorSpy = jest.fn((error: unknown) => {
      throw error
    })
    const client = new UndiciApiClient({
      baseUrl,
      retries: 0,
      onRequest: () => {
        throw new Error("onRequest boom")
      },
      onRequestError: onRequestErrorSpy,
    })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    expect(onRequestErrorSpy).toHaveBeenCalledTimes(1)
  })
})

describe("Undici API Client Edge Cases", () => {
  it("should handle network errors with retries disabled", async () => {
    const client = new UndiciApiClient({ baseUrl: "http://127.0.0.1:1", retries: 0 })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toBe("Network Error")
    }
  })

  it("should map AbortSignal aborts to network errors", async () => {
    handler = async (_req, res) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 50)
    const result = await client.get("/posts/1", { signal: controller.signal })
    await client.close()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toBe("Network Error")
    }
  })

  it("should handle different HTTP status codes", async () => {
    const client = new UndiciApiClient({ baseUrl, retries: 0 })

    handler = (_req, res) => {
      res.statusCode = 400
      res.end()
    }
    let result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.message).toBe("Bad Request")

    handler = (_req, res) => {
      res.statusCode = 401
      res.end()
    }
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.message).toBe("Unauthorized")

    handler = (_req, res) => {
      res.statusCode = 403
      res.end()
    }
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.message).toBe("Forbidden")

    handler = (_req, res) => {
      res.statusCode = 422
      res.end()
    }
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.message).toBe("Unprocessable Entity")

    await client.close()
  })

  it("should expose pool and dispatcher", async () => {
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    expect(client.getPool()).toBeDefined()
    expect(client.getDispatcher()).toBeDefined()
    await client.close()
  })

  it("should handle empty response data", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(true)
    expect(result.data).toBe("")
  })

  it("should handle POST with no data", async () => {
    handler = (_req, res) => {
      res.statusCode = 201
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ id: 1 }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.post("/posts")
    await client.close()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({ id: 1 })
    }
  })

  it("should pull error message from response body when present", async () => {
    handler = (_req, res) => {
      res.statusCode = 400
      res.setHeader("content-type", "application/json")
      res.end(JSON.stringify({ message: "validation failed" }))
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    const result = await client.get("/posts/1")
    await client.close()
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.message).toBe("validation failed")
    }
  })

  it("should send raw string bodies without overriding content-type", async () => {
    handler = (_req, res) => {
      res.statusCode = 200
      res.end()
    }
    const client = new UndiciApiClient({ baseUrl, retries: 0 })
    await client.post("/raw", "plain text", { headers: { "Content-Type": "text/plain" } })
    await client.close()
    expect(requestLog[0].headers["content-type"]).toBe("text/plain")
    expect(requestLog[0].body).toBe("plain text")
  })
})
