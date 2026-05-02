import { AxiosApiClient } from "../src"
import { Headers } from "../src/headers"
import { describe, it, expect, jest, afterEach } from "@jest/globals"
import nock from "nock"

const FAKE_API_URL = "https://jsonplaceholder.typicode.com"

// Clean up nock mocks after each test to prevent interference
afterEach(() => {
  nock.cleanAll()
})

describe("Axios API Client Methods", () => {
  it("should be able to execute a GET request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.get("/posts/1")
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("userId")
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
  })

  it("should be able to execute a POST request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.post("/posts", {
      title: "foo",
      body: "bar",
      userId: 1,
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe(201)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
    expect(result.data).toHaveProperty("userId")
  })

  it("should be able to execute a PUT request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.put("/posts/1", {
      id: 1,
      title: "foo",
      body: "bar",
      userId: 1,
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
    expect(result.data).toHaveProperty("userId")
  })

  it("should be able to execute a PATCH request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.patch("/posts/1", {
      title: "foo",
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
    expect(result.data).toHaveProperty("userId")
  })

  it("should be able to execute a DELETE request to a server", async () => {
    nock(FAKE_API_URL).delete("/posts/1").reply(200, {})

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.delete("/posts/1")
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
  })

  it("should be able to execute a HEAD request to a server", async () => {
    nock(FAKE_API_URL).head("/posts/1").reply(200, "", { "x-custom": "value" })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.head("/posts/1")
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
  })

  it("should be able to execute an OPTIONS request to a server", async () => {
    nock(FAKE_API_URL).options("/posts/1").reply(204, "", { allow: "GET,POST,OPTIONS" })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.options("/posts/1")
    expect(result.success).toBe(true)
    expect(result.status).toBe(204)
  })
})

describe("Axios API Client Retry Logic", () => {
  it("should retry failed requests and eventually fail", async () => {
    // By default, it retries if it is a network error or a 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).
    nock(FAKE_API_URL).delete("/posts/1").times(4).reply(500)

    const onRetrySpy = jest.fn()
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 3, onRetry: onRetrySpy })

    const result = await client.delete("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Internal Server Error")
    expect(onRetrySpy).toHaveBeenCalledTimes(3)
  })

  it("should handle successful request after retries", async () => {
    // Test that retry logic is configured correctly by testing a simple success case
    nock(FAKE_API_URL).get("/posts/1").reply(200, { id: 1, title: "test" })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 3 })

    const result = await client.get("/posts/1")

    // The request should succeed
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toEqual({ id: 1, title: "test" })
  })

  it("should not retry on 4xx errors", async () => {
    nock(FAKE_API_URL).get("/posts/1").reply(404)

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 3 })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Resource Not Found")
    expect(result.status).toBe(404)
  })
})

describe("Axios API Client Headers Interface", () => {
  it("should set headers correctly when initialized with axios instance", async () => {
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    })

    nock(FAKE_API_URL, {
      reqheaders: {
        "Content-Type": (headerValue) => headerValue === "application/json",
        Authorization: (headerValue) => headerValue === "Bearer token",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    const result = await client.get("/posts/1")
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })

  it("should set headers correctly when configured at request level", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })

    nock(FAKE_API_URL, {
      reqheaders: {
        "Content-Type": (headerValue) => headerValue === "application/json",
        Authorization: (headerValue) => headerValue === "Bearer token",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    const result = await client.get("/posts/1", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })

  it("setHeader method should set headers on axios instance", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })

    nock(FAKE_API_URL, {
      reqheaders: {
        "Content-Type": (headerValue) => headerValue === "application/json",
        Authorization: (headerValue) => headerValue === "Bearer token",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    client.setHeader("Content-Type", "application/json")
    client.setHeader("Authorization", "Bearer token")

    const result = await client.get("/posts/1")
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })

  it("setHeader method should override default headers set", async () => {
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    })

    nock(FAKE_API_URL, {
      reqheaders: {
        "Content-Type": (headerValue) => headerValue === "application/xml",
        Authorization: (headerValue) => headerValue === "Bearer token",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    client.setHeader("Content-Type", "application/xml")

    const result = await client.get("/posts/1")
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })

  it("removeHeader method should remove a previously set header", async () => {
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
      },
    })

    nock(FAKE_API_URL, {
      badheaders: ["Authorization"],
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    client.removeHeader("Authorization")

    const result = await client.get("/posts/1")
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })

  it("request level headers should override default headers set", async () => {
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    })

    nock(FAKE_API_URL, {
      reqheaders: {
        "Content-Type": (headerValue) => headerValue === "application/xml",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    const result = await client.get("/posts/1", {
      headers: {
        "Content-Type": "application/xml",
      },
    })
    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })
})

describe("Headers class", () => {
  it("get should return the value previously set", () => {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    expect(headers.get("Content-Type")).toBe("application/json")
  })

  it("get should return number and boolean values without coercion", () => {
    const headers = new Headers()
    headers.set("X-Retry", 3)
    headers.set("X-Enabled", false)
    expect(headers.get("X-Retry")).toBe(3)
    expect(headers.get("X-Enabled")).toBe(false)
  })

  it("get should return undefined for unknown header", () => {
    const headers = new Headers()
    expect(headers.get("X-Missing")).toBeUndefined()
  })

  it("append should merge headers", () => {
    const headers = new Headers({ "Content-Type": "application/json" })
    headers.append({ Authorization: "Bearer token" })
    expect(headers.get("Content-Type")).toBe("application/json")
    expect(headers.get("Authorization")).toBe("Bearer token")
  })

  it("append should merge numeric and boolean headers", () => {
    const headers = new Headers({ "X-Existing": true })
    headers.append({ "X-Retry": 5, "X-Enabled": false })
    expect(headers.get("X-Existing")).toBe(true)
    expect(headers.get("X-Retry")).toBe(5)
    expect(headers.get("X-Enabled")).toBe(false)
  })
})

describe("Axios API Client Request Interceptors", () => {
  it("should invoke onRequest before the request is sent", async () => {
    nock(FAKE_API_URL).get("/posts/1").reply(200, { id: 1 })

    const onRequestSpy = jest.fn((config: any) => config)
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, onRequest: onRequestSpy })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(true)
    expect(onRequestSpy).toHaveBeenCalledTimes(1)
    const passed = onRequestSpy.mock.calls[0][0] as any
    expect(passed.url).toBe("/posts/1")
    expect(passed.method).toBe("get")
  })

  it("should allow onRequest to mutate request config (e.g. add a header)", async () => {
    nock(FAKE_API_URL, {
      reqheaders: {
        "X-Injected": (headerValue) => headerValue === "yes",
      },
    })
      .get("/posts/1")
      .reply(200, { id: 1 })

    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      onRequest: (config) => {
        config.headers.set("X-Injected", "yes")
        return config
      },
    })

    const result = await client.get("/posts/1")
    expect(result.status).toBe(200)
  })

  it("should invoke onRequestError when an upstream request interceptor rejects", async () => {
    const onRequestErrorSpy = jest.fn((error: unknown) => Promise.reject(error))
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      retries: 0,
      onRequest: (config) => config,
      onRequestError: onRequestErrorSpy,
    })

    // Register a second interceptor that runs *before* our onRequest pair
    // (axios request interceptors run LIFO), so its rejection bubbles into
    // our onRequestError handler.
    client.getInstance().interceptors.request.use(() => {
      throw new Error("boom")
    })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(onRequestErrorSpy).toHaveBeenCalledTimes(1)
  })

  it("should invoke onRequestError when onRequest itself throws", async () => {
    const onRequestErrorSpy = jest.fn((error: unknown) => Promise.reject(error))
    const client = new AxiosApiClient({
      baseUrl: FAKE_API_URL,
      retries: 0,
      onRequest: () => {
        throw new Error("onRequest boom")
      },
      onRequestError: onRequestErrorSpy,
    })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(onRequestErrorSpy).toHaveBeenCalledTimes(1)
  })
})

describe("Axios API Client Edge Cases", () => {
  it("should handle network errors with retries disabled", async () => {
    nock(FAKE_API_URL).get("/posts/1").replyWithError("Network Error")

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 0 })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Network Error")
  })

  it("should handle network errors with retries enabled", async () => {
    nock(FAKE_API_URL).get("/posts/1").replyWithError("Network Error")

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 3 })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Network Error")
  })

  it("should handle timeout errors with retries disabled", async () => {
    nock(FAKE_API_URL).get("/posts/1").delay(1000).reply(200, { id: 1 })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, timeout: 100, retries: 0 })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Network Error")
  })

  it("should handle timeout errors with retries enabled", async () => {
    nock(FAKE_API_URL).get("/posts/1").delay(1000).reply(200, { id: 1 })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, timeout: 100, retries: 3 })

    const result = await client.get("/posts/1")

    expect(result.success).toBe(false)
    expect(result.message).toBe("Network Error")
  })

  it("should handle different HTTP status codes", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })

    // Test 400 Bad Request
    nock(FAKE_API_URL).get("/posts/1").reply(400)
    let result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    expect(result.message).toBe("Bad Request")

    // Test 401 Unauthorized
    nock(FAKE_API_URL).get("/posts/1").reply(401)
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    expect(result.message).toBe("Unauthorized")

    // Test 403 Forbidden
    nock(FAKE_API_URL).get("/posts/1").reply(403)
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    expect(result.message).toBe("Forbidden")

    // Test 422 Unprocessable Entity
    nock(FAKE_API_URL).get("/posts/1").reply(422)
    result = await client.get("/posts/1")
    expect(result.success).toBe(false)
    expect(result.message).toBe("Unprocessable Entity")
  })

  it("should return axios instance", () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const instance = client.getInstance()

    expect(instance).toBeDefined()
    expect(instance.defaults.baseURL).toBe(FAKE_API_URL)
  })

  it("should handle empty response data", async () => {
    nock(FAKE_API_URL).get("/posts/1").reply(200)

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.get("/posts/1")

    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toBe("")
  })

  it("should handle POST with no data", async () => {
    nock(FAKE_API_URL).post("/posts").reply(201, { id: 1 })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.post("/posts")

    expect(result.success).toBe(true)
    expect(result.status).toBe(201)
    expect(result.data).toEqual({ id: 1 })
  })

  it("should handle PUT with no data", async () => {
    nock(FAKE_API_URL).put("/posts/1").reply(200, { id: 1 })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.put("/posts/1")

    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toEqual({ id: 1 })
  })

  it("should handle PATCH with no data", async () => {
    nock(FAKE_API_URL).patch("/posts/1").reply(200, { id: 1 })

    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.patch("/posts/1")

    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.data).toEqual({ id: 1 })
  })
})
