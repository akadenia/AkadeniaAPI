<div align="center">
  <img src="https://cdn.akadenia.com/images/akadenia-webp/logo/horizontal-logo.svg" alt="Akadenia" width="200" />
  
  <h2><code>@akadenia/api</code></h2>
  
  <img src="https://cdn.akadenia.com/images/badges/npm-version-api.svg" alt="npm version" />
  <img src="https://cdn.akadenia.com/images/badges/license-mit.svg" alt="License: MIT" />
  <img src="https://cdn.akadenia.com/images/badges/typescript.svg" alt="TypeScript" />
  
  An opinionated HTTP client library built on Undici that gives every HTTP request a consistent response shape, built-in retry logic, and typed error handling — so you stop writing the same boilerplate across every project.
  
  [Documentation](https://akadenia.com/packages/akadenia-api) · [GitHub](https://github.com/akadenia/AkadeniaAPI) · [Issues](https://github.com/akadenia/AkadeniaAPI/issues)
</div>

## Features

- 🚀 **Consistent Response Format**: All responses follow a standardized structure
- 🔄 **Built-in Retry Logic**: Configurable retries for network failures, server errors and rate limiting
- 🛡️ **Error Handling**: Requests never throw; failures come back as typed error responses with meaningful messages
- 📝 **TypeScript Support**: Full TypeScript support with generic types
- 🔧 **Header Management**: Easy header manipulation and management
- ⏱️ **Timeout & Cancellation**: Client-wide and per-request timeouts, plus `AbortSignal` support
- ⚡ **Undici Connection Pooling**: Built on [Undici](https://undici.nodejs.org/) with a pooled connection per client
- 🚦 **Request Hooks**: Modify requests before they are sent

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Common Usage Cases](#common-usage-cases)
- [Advanced Features](#advanced-features)
- [Error Handling](#error-handling)
- [Configuration Options](#configuration-options)
- [Real-World Examples](#real-world-examples)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Migrating from AxiosApiClient](#migrating-from-axiosapiclient)
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## Installation

```sh
npm install @akadenia/api
```

Requires Node.js 22 or later.

## Quick Start

### Basic Setup

```ts
import { UndiciApiClient } from "@akadenia/api";

const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Bearer your-token"
  }
});
```

`baseUrl` must be an origin (protocol, host and optional port) without a path. Put any path prefix such as `/v1` in the request paths instead.

### Making Your First Request

```ts
// GET request
const response = await client.get("/users");
if (response.success) {
  console.log("Users:", response.data);
} else {
  console.error("Error:", response.message);
}
```

### Closing the Client

Each client keeps a pool of open connections. Close it when you are done, for example on shutdown:

```ts
await client.close();
```

## Common Usage Cases

### 1. RESTful API Operations

### GET Requests

```ts
// Fetch a single user
const userResponse = await client.get<User>("/users/1");
if (userResponse.success) {
  const user = userResponse.data;
  console.log(`${user.firstName} ${user.lastName}`);
}

// Fetch with query parameters (arrays become repeated keys: ?tag=a&tag=b)
const usersResponse = await client.get<User[]>("/users", {
  query: { page: 1, limit: 10 }
});

// If the path already has a query string, the query option is appended to it
const searchResponse = await client.get("/search?q=shoes", {
  query: { page: 2 } // -> /search?q=shoes&page=2
});

// Fetch with custom headers
const response = await client.get("/protected-resource", {
  headers: { "X-Custom-Header": "value" }
});
```

### POST Requests

```ts
interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

const newUser: CreateUserRequest = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com"
};

// Plain objects and arrays are sent as JSON, with Content-Type: application/json added automatically
const response = await client.post<User, CreateUserRequest>("/users", newUser);
if (response.success) {
  console.log("User created:", response.data);
} else {
  console.error("Creation failed:", response.message);
}

// Strings, Buffers and Uint8Arrays are sent as-is; set the Content-Type yourself
const csvResponse = await client.post("/imports", "id,name\n1,John", {
  headers: { "Content-Type": "text/csv" }
});
```

### PUT Requests

```ts
const response = await client.put<User>("/users/1", {
  firstName: "Jane",
  lastName: "Smith"
});
if (response.success) {
  console.log("User updated:", response.data);
}
```

### PATCH Requests

```ts
const response = await client.patch<User>("/users/1", { firstName: "Jane" });
if (response.success) {
  console.log("User partially updated:", response.data);
}
```

### DELETE Requests

```ts
const response = await client.delete("/users/1");
if (response.success) {
  console.log("User deleted successfully");
} else {
  console.error("Deletion failed:", response.message);
}
```

### HEAD and OPTIONS Requests

```ts
const head = await client.head("/files/report.pdf");
if (head.success) {
  console.log("Size:", head.headers["content-length"]);
}

const options = await client.options("/users");
```

### 2. Authentication Scenarios

### Bearer Token Authentication

```ts
// Initialize with token
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Bearer your-jwt-token"
  }
});

// Update token dynamically
client.setHeader("Authorization", "Bearer new-token");

// Handle token expiration
const response = await client.get("/protected-endpoint");
if (!response.success && response.status === 401) {
  const newToken = await refreshToken();
  client.setHeader("Authorization", `Bearer ${newToken}`);
  return client.get("/protected-endpoint");
}
```

### API Key Authentication

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "X-API-Key": "your-api-key",
    "X-API-Version": "v1"
  }
});

// Rotate API keys
client.setHeader("X-API-Key", "new-api-key");
```

### Basic Authentication

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Basic " + Buffer.from("username:password").toString("base64")
  }
});
```

### 3. TypeScript Integration

```ts
interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Use generics for type safety
const response = await client.post<User, CreateUserRequest>("/users", {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com"
});

if (response.success) {
  // TypeScript knows this is a User
  const user: User = response.data;
  console.log(user.firstName); // ✅ Type-safe
}

// Paginated responses
const usersResponse = await client.get<PaginatedResponse<User>>("/users", {
  query: { page: 1, limit: 10 }
});

if (usersResponse.success) {
  const { data: users, total, page } = usersResponse.data;
  console.log(`Page ${page}: ${users.length} of ${total} users`);
}
```

The generic type is not validated at runtime. Validate response data yourself if you don't trust the API.

### 4. Header Management

```ts
// Set headers during initialization
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Bearer initial-token"
  }
});

// Set and remove headers dynamically
client.setHeader("X-API-Key", "your-api-key");
client.removeHeader("X-API-Key");

// Headers are automatically included in all requests
const response = await client.get("/protected-endpoint");

// Override headers for specific requests
const responseWithCustomHeaders = await client.get("/special-endpoint", {
  headers: { "X-Custom-Header": "override-value" }
});
```

### 5. Error Handling

Requests never throw. Check `response.success`, then use `response.status` or `response.message`:

```ts
const response = await client.get("/users/999");

if (response.success) {
  console.log("User found:", response.data);
} else {
  switch (response.status) {
    case 404:
      console.log("User doesn't exist");
      break;
    case 401:
      console.log("Please log in again");
      break;
    case undefined:
      // No HTTP response: network failure, timeout or abort
      console.log(response.message); // "Network Error"
      break;
    default:
      console.error("Unexpected error:", response.message);
  }
}
```

### 6. Retry Logic Configuration

Connection failures such as `ECONNRESET`, `ECONNREFUSED` and closed sockets are retried for every HTTP method.

Timeouts are not retried, for any method. When `timeout` runs out the request is aborted and returns a `"Network Error"` response. Retrying it could repeat a `POST` or `PATCH` that the server already received.

Responses with status `429`, `500`, `502`, `503` or `504` are retried only for `GET`, `HEAD`, `OPTIONS`, `PUT` and `DELETE`. `POST` and `PATCH` are not retried on these statuses, because the server may already have acted on the request. Other status codes are returned immediately.

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  retries: 5, // Retry up to 5 times (default: 3)
  retryDelay: (retryCount) => {
    // Exponential backoff: 2s, 4s, 8s, 16s, 32s
    return Math.pow(2, retryCount) * 1000;
  },
  onRetry: (retryCount, error, request) => {
    console.log(`Retry ${retryCount} for ${request.method} ${request.url}: ${error.message}`);
  }
});

// Linear backoff
const linearClient = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000 // 1s, 2s, 3s
});

// Disable retries
const noRetryClient = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  retries: 0
});
```

Without `retryDelay`, retries happen immediately. If `onRetry` throws or returns a rejected promise, retrying stops and the request fails.

### 7. Timeout Configuration

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  timeout: 10000 // 10 seconds for every request (default: 30000)
});

// Override for a single request
const report = await client.get("/reports/annual", { timeout: 60000 });
```

A request that times out returns `{ success: false, message: "Network Error" }`.

### 8. Cancelling Requests

```ts
const controller = new AbortController();

const pending = client.get("/search", {
  query: { q: "shoes" },
  signal: controller.signal
});

controller.abort();

const response = await pending; // { success: false, message: "Network Error", ... }
```

### 9. Response Bodies

Responses with a JSON `Content-Type`, including `+json` types such as `application/problem+json`, are parsed into objects. All other responses, including JSON that fails to parse, are returned as text. Empty bodies become `""`.

```ts
const json = await client.get<User[]>("/users"); // data: User[]
const text = await client.get<string>("/health"); // data: "ok"
```

## Advanced Features

### Request Hooks

`onRequest` runs before every request. It receives the request context and returns the context to send, so you can log, add headers, or rewrite the request:

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  onRequest: async (request) => {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
    const token = await getAccessToken();
    return {
      ...request,
      headers: { ...request.headers, Authorization: `Bearer ${token}` }
    };
  },
  onRequestError: (error) => {
    // Called if onRequest throws; the request is not sent
    console.error("Failed to prepare request:", error);
  }
});
```

The context has `url`, `method`, `headers`, `body` and `query`.

### Accessing Undici Directly

For anything the client doesn't cover, use the underlying Undici objects:

```ts
// The dispatcher includes the retry handling (a RetryAgent, or the Pool when retries is 0)
const dispatcher = client.getDispatcher();
const { statusCode, body } = await dispatcher.request({
  origin: "https://api.example.com",
  path: "/files/large-file.zip",
  method: "GET"
});

// Stream the body instead of buffering it
for await (const chunk of body) {
  // ...
}

// The connection pool
const pool = client.getPool();
console.log(pool.stats);
```

## Error Handling

### Understanding Responses

All responses follow this consistent structure:

```ts
// Success Response
{
  success: true,
  data: T,             // Parsed response body
  status: number,      // HTTP status code
  statusText: string,  // HTTP status text
  headers: object      // Response headers
}

// Error Response
{
  success: false,
  message: string,      // Human-readable error message
  error: unknown,       // Underlying error
  status?: number,      // HTTP status code (when the server responded)
  statusText?: string,  // HTTP status text (when the server responded)
  headers?: object,     // Response headers (when the server responded)
  data?: unknown        // Parsed error body (when the server responded)
}
```

Any status of `400` or above is an error response.

### Error Messages

If an error response body is a JSON object with a `message` field, that message is used. Otherwise:

| Status | `message` |
|---|---|
| `400` | `Bad Request` |
| `401` | `Unauthorized` |
| `403` | `Forbidden` |
| `404` | `Resource Not Found` |
| `422` | `Unprocessable Entity` |
| `500` | `Internal Server Error` |
| Other statuses | `An Unknown Error Occurred` |
| Network error, timeout or abort | `Network Error` |

### Error Handling Patterns

```ts
// Pattern 1: Check success flag
const response = await client.get<User[]>("/users");
if (response.success) {
  return response.data;
}
throw new Error(response.message);

// Pattern 2: Handle specific status codes
const users = await client.get<User[]>("/users");
if (!users.success) {
  switch (users.status) {
    case 401:
      await refreshToken();
      return client.get<User[]>("/users");
    case 404:
      return [];
    default:
      throw new Error(users.message);
  }
}
return users.data;
```

## Configuration Options

### Constructor Options

```ts
const client = new UndiciApiClient({
  baseUrl,         // Required: origin for all requests, without a path
  headers,         // Optional: default headers
  timeout,         // Optional: request timeout in milliseconds (default: 30000)
  retries,         // Optional: number of retry attempts (default: 3)
  retryDelay,      // Optional: (retryCount) => delay in milliseconds (default: no delay)
  onRetry,         // Optional: (retryCount, error, request) => called before each retry
  onRequest,       // Optional: (request) => request, called before each request
  onRequestError   // Optional: (error) => called if onRequest throws
});
```

### Request Options

Every method accepts an optional config as its last argument:

```ts
{
  headers?: Record<string, string | number | boolean>, // Merged over the client headers
  query?: Record<string, unknown>,  // Query string parameters
  timeout?: number,                 // Overrides the client timeout
  signal?: AbortSignal              // Cancels the request
}
```

## Real-World Examples

### Complete User Management Example

```ts
import { UndiciApiClient } from "@akadenia/api";

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
}

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

class UserService {
  private client: UndiciApiClient;

  constructor() {
    this.client = new UndiciApiClient({
      baseUrl: "https://api.example.com",
      headers: {
        "Authorization": "Bearer your-token"
      },
      retries: 3,
      retryDelay: (retryCount) => Math.pow(2, retryCount) * 500,
      timeout: 10000
    });
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<User[]> {
    const response = await this.client.get<User[]>("/v1/users", {
      query: { page, limit }
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async getUserById(id: number): Promise<User> {
    const response = await this.client.get<User>(`/v1/users/${id}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.client.post<User, CreateUserRequest>("/v1/users", userData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const response = await this.client.put<User, UpdateUserRequest>(`/v1/users/${id}`, userData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async deleteUser(id: number): Promise<void> {
    const response = await this.client.delete(`/v1/users/${id}`);
    if (!response.success) {
      throw new Error(response.message);
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}

// Usage
const userService = new UserService();

try {
  const users = await userService.getUsers(1, 20);
  console.log(`Found ${users.length} users`);

  const newUser = await userService.createUser({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com"
  });

  const updatedUser = await userService.updateUser(newUser.id, { firstName: "Jane" });
  console.log("Updated user:", updatedUser);
} catch (error) {
  console.error("User service error:", (error as Error).message);
} finally {
  await userService.close();
}
```

### E-commerce API Example

```ts
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface Order {
  id: number;
  userId: number;
  products: Array<{ productId: number; quantity: number }>;
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered";
  createdAt: string;
}

class EcommerceAPI {
  private client: UndiciApiClient;

  constructor(apiKey: string) {
    this.client = new UndiciApiClient({
      baseUrl: "https://api.ecommerce.com",
      headers: { "X-API-Key": apiKey },
      retries: 3,
      timeout: 15000
    });
  }

  async getProducts(category?: string, page: number = 1): Promise<Product[]> {
    const response = await this.client.get<Product[]>("/products", {
      query: category ? { page, category } : { page }
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async createOrder(orderData: Omit<Order, "id" | "createdAt">): Promise<Order> {
    const response = await this.client.post<Order>("/orders", orderData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async updateOrderStatus(orderId: number, status: Order["status"]): Promise<Order> {
    const response = await this.client.patch<Order>(`/orders/${orderId}`, { status });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

### 1. `invalid url` When Creating the Client

`baseUrl` can't include a path. Use the origin and put the path in each request:

```ts
// ❌ Throws: invalid url
new UndiciApiClient({ baseUrl: "https://api.example.com/v1" });

// ✅
const client = new UndiciApiClient({ baseUrl: "https://api.example.com" });
await client.get("/v1/users");
```

### 2. Network Errors

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  retries: 5,
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
  timeout: 30000
});
```

### 3. Authentication Issues

Refresh tokens before each request with `onRequest`:

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  onRequest: async (request) => ({
    ...request,
    headers: { ...request.headers, Authorization: `Bearer ${await getValidToken()}` }
  })
});
```

### 4. Rate Limiting

`429` responses to `GET`, `HEAD`, `OPTIONS`, `PUT` and `DELETE` requests are retried automatically. Add a delay so retries back off:

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000 // Wait 2s, 4s, 6s
});
```

### 5. Multipart and File Uploads

The client sends plain objects as JSON and strings or binary data as-is. It does not serialize `FormData`. Send binary data with an explicit `Content-Type`, or use `getDispatcher()` for multipart requests:

```ts
import { readFile } from "node:fs/promises";

const file = await readFile("./report.pdf");
const response = await client.put("/files/report.pdf", file, {
  headers: { "Content-Type": "application/pdf" },
  timeout: 300000 // 5 minutes for large uploads
});
```

### Debug Logging

```ts
const client = new UndiciApiClient({
  baseUrl: "https://api.example.com",
  onRequest: (request) => {
    console.log("🚀 Request:", request.method, request.url, request.query ?? "");
    return request;
  },
  onRetry: (retryCount, error, request) => {
    console.log(`🔁 Retry ${retryCount}:`, request.method, request.url, error.message);
  }
});

const response = await client.get("/users");
console.log(response.success ? "✅ Response:" : "❌ Error:", response.status, response.success ? response.data : response.message);
```

## API Reference

### Constructor

```ts
new UndiciApiClient({
  baseUrl: string,
  headers?: Record<string, string | number | boolean>,
  timeout?: number, // default: 30000
  retries?: number, // default: 3
  retryDelay?: (retryCount: number) => number,
  onRetry?: (retryCount: number, error: Error, request: UndiciRequestContext) => void | Promise<void>,
  onRequest?: (request: UndiciRequestContext) => UndiciRequestContext | Promise<UndiciRequestContext>,
  onRequestError?: (error: unknown) => unknown
})
```

### HTTP Methods

- `get<TResponse>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `head<TResponse>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `options<TResponse>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `post<TResponse, TBody>(url: string, data?: TBody, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `put<TResponse, TBody>(url: string, data?: TBody, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `patch<TResponse, TBody>(url: string, data?: TBody, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`
- `delete<TResponse>(url: string, config?: UndiciRequestConfig): Promise<AkadeniaApiResponse<TResponse>>`

### Utility Methods

- `setHeader(name: string, value: string): void` - Set a header for all future requests
- `removeHeader(name: string): void` - Remove a header from all future requests
- `getDispatcher(): Dispatcher` - Get the Undici dispatcher used for requests (includes retry handling)
- `getPool(): Pool` - Get the underlying Undici connection pool
- `close(): Promise<void>` - Cancel pending retries and close all connections

### Types

```ts
type UndiciRequestConfig = {
  headers?: Record<string, string | number | boolean>;
  signal?: AbortSignal;
  query?: Record<string, unknown>;
  timeout?: number;
};

type UndiciRequestContext = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  headers: Record<string, string | number | boolean>;
  body?: unknown;
  query?: Record<string, unknown>;
};

type AkadeniaApiSuccessResponse<T = unknown> = {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  success: true;
  message?: string;
};

type AkadeniaApiErrorResponse = {
  success: false;
  status?: number;
  statusText?: string;
  headers?: any;
  data?: unknown;
  message: string;
  error: unknown;
};

type AkadeniaApiResponse<T = unknown> = AkadeniaApiSuccessResponse<T> | AkadeniaApiErrorResponse;
```

## Migrating from AxiosApiClient

`AxiosApiClient` was removed in version 2. Replace it with `UndiciApiClient`; the constructor options, method names and response shape are the same, with these differences:

| `AxiosApiClient` | `UndiciApiClient` |
|---|---|
| `baseUrl` could include a path | `baseUrl` must be an origin; move the path into each request |
| `params` request option | `query` request option; if the path already has a query string, `query` is appended to it, ahead of any `#fragment` |
| `params` encoded arrays as `tags[]=x&tags[]=y` and spaces as `+` | `query` encodes arrays as `tags=x&tags=y` and spaces as `%20` |
| Followed up to 21 redirects | Redirects are not followed; a `3xx` is returned as a success response with that status and body |
| Any axios request option | Only `headers`, `query`, `timeout` and `signal` |
| `responseType` (`blob`, `arraybuffer`, `stream`) | JSON or text only; use `getDispatcher()` for binary or streamed responses |
| `FormData` bodies | Not serialized; send strings or binary data, or use `getDispatcher()` |
| `delete` with a `data` body | `delete` has no body |
| `getInstance()` and axios interceptors | `onRequest` hook, `getDispatcher()` and `getPool()` |
| `onRequest(config)` with an axios config | `onRequest(request)` with `url`, `method`, `headers`, `body`, `query` |
| `onRetry(retryCount, axiosError, axiosConfig)` | `onRetry(retryCount, error, request)` |
| Success response had `config` and `request` | Success response has `data`, `status`, `statusText`, `headers` |
| Retried connection errors for all methods, and `429` and every `5xx` (`500`–`599`) for idempotent methods. Did not retry timeouts | Retries connection errors for all methods, and `429` for idempotent methods. Only `500`, `502`, `503` and `504` are retried among `5xx`; `501` and `505`–`599` are returned immediately. Does not retry timeouts |
| `AxiosError` type export | Removed |
| Nothing to clean up | Call `close()` when done |

## Best Practices

1. **Always check `response.success`** before accessing `response.data`
2. **Use TypeScript generics** for better type safety
3. **Configure `retryDelay`** so retries back off instead of firing immediately
4. **Set appropriate timeouts** based on your API's response times
5. **Reuse one client per API** to benefit from connection pooling, and `close()` it on shutdown
6. **Use header management** for authentication and API keys
7. **Use `onRequest`** for cross-cutting concerns like logging and token refresh
8. **Validate responses** before processing data
9. **Use environment-specific configurations** for different deployment stages

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/akadenia/AkadeniaAPI.git
cd AkadeniaAPI
pnpm install
pnpm run build
pnpm test
```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for our semantic release process. **We prefer commit messages to include a scope in parentheses** for better categorization and changelog generation.

### Preferred Format
```
type(scope): description

[optional body]

[optional footer]
```

### Examples
```bash
## ✅ Preferred - with scope
feat(api): add new retry configuration options
fix(auth): resolve token refresh issue
docs(readme): add troubleshooting section
chore(deps): update undici to latest version

## ❌ Less preferred - without scope
feat: add new retry configuration options
fix: resolve token refresh issue
docs: add troubleshooting section
chore: update undici to latest version
```

### Common Scopes
- `api` - API client functionality
- `auth` - Authentication and authorization
- `types` - TypeScript type definitions
- `docs` - Documentation updates
- `deps` - Dependency updates
- `test` - Test-related changes
- `build` - Build and build tooling
- `ci` - CI/CD configuration

### Commit Types
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

## License

[MIT](https://github.com/akadenia/AkadeniaAPI/blob/main/LICENSE)

## Support

For support, please open an issue on [GitHub](https://github.com/akadenia/AkadeniaAPI/issues).
