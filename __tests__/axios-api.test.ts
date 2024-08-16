import { AxiosApiClient } from "../src"
import { describe, it, expect, jest } from "@jest/globals"
import nock from "nock"

const FAKE_API_URL = "https://jsonplaceholder.typicode.com"

describe("Axios API Client Methods", () => {
  it("should be able to execute a GET request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.get("/posts/1")
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
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
    expect(result.data).toHaveProperty("userId")
  })

  it("should be able to execute a DELETE request to a server", async () => {
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL })
    const result = await client.delete("/posts/1")
    expect(result.status).toBe(200)
  })
})

describe("Axios API Client Retry Logic", () => {
  it("should be able to retry a request", async () => {
    // By default, it retries if it is a network error or a 5xx error on an idempotent request (GET, HEAD, OPTIONS, PUT or DELETE).
    nock(FAKE_API_URL).delete("/posts/1").times(4).reply(500)

    const spy = jest.fn()
    const client = new AxiosApiClient({ baseUrl: FAKE_API_URL, retries: 3, onRetry: spy })

    const result = await client.delete("/posts/1")

    expect(spy).toHaveBeenCalledTimes(3)
    expect(result.success).toBeFalsy()
    expect(result.message).toBe("Internal Server Error")
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
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("id")
  })
})
