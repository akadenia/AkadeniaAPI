import { AxiosApiClient } from "../src"
import { AxiosError } from "axios"
import { describe, it, expect, jest } from "@jest/globals"
import nock from "nock"

const TEST_URL = "https://jsonplaceholder.typicode.com"

describe("Axios API Client Methods", () => {
  it("should be able to execute a GET request to a server", async () => {
    const client = new AxiosApiClient(TEST_URL)
    const result = await client.get("/posts/1")
    expect(result.status).toBe(200)
    expect(result.data).toBeDefined()
    expect(result.data).toHaveProperty("userId")
    expect(result.data).toHaveProperty("id")
    expect(result.data).toHaveProperty("title")
    expect(result.data).toHaveProperty("body")
  })

  it("should be able to execute a POST request to a server", async () => {
    const client = new AxiosApiClient("https://jsonplaceholder.typicode.com")
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
    const client = new AxiosApiClient("https://jsonplaceholder.typicode.com")
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
    const client = new AxiosApiClient("https://jsonplaceholder.typicode.com")
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
    const client = new AxiosApiClient("https://jsonplaceholder.typicode.com")
    const result = await client.delete("/posts/1")
    expect(result.status).toBe(200)
  })
})

describe("Axios API Client Retry Logic", () => {
  it("should be able to retry a request", async () => {
    nock(TEST_URL).get("/posts/1").times(4).reply(502)

    const client = new AxiosApiClient(TEST_URL, undefined, undefined, undefined, undefined, (retryCount) => {
      console.log(retryCount)
    })
    const spy = jest.spyOn(console, "log")

    await expect(async () => {
      await client.get("/posts/1")
      expect(spy).toHaveBeenCalledWith(1)
      expect(spy).toHaveBeenCalledWith(2)
      expect(spy).toHaveBeenCalledWith(3)
    }).rejects.toThrow(new AxiosError("Request failed with status code 502"))
  })
})

describe("Axios API Client Headers Interface", () => {
  it("should set headers correctly when initialized with axios instance", async () => {
    const client = new AxiosApiClient(TEST_URL, {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    })

    nock(TEST_URL, {
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
    const client = new AxiosApiClient(TEST_URL)

    nock(TEST_URL, {
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
    const client = new AxiosApiClient(TEST_URL)

    nock(TEST_URL, {
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
    const client = new AxiosApiClient(TEST_URL, {
      "Content-Type": "application/json",
      Authorization: "Bearer token",
    })

    nock(TEST_URL, {
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
    const client = new AxiosApiClient(TEST_URL, {
      "Content-Type": "application/json",
    })

    nock(TEST_URL, {
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
