<div align="center">
  <img src="https://cdn.akadenia.com/images/akadenia-webp/logo/horizontal-logo.svg" alt="Akadenia" width="200" style="filter: drop-shadow(0 0 1px rgba(0,0,0,1)) drop-shadow(0 0 1px rgba(255,255,255,1));" />
  
  # @akadenia/api
  
  [![npm version](https://badge.fury.io/js/%40akadenia%2Fapi.svg)](https://badge.fury.io/js/%40akadenia%2Fapi)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
  
  An opinionated wrapper around axios library that provides a consistent response structure, built-in retry logic, and simplified error handling for HTTP requests.
  
  [Documentation](https://akadenia.com/packages/akadenia-api) • [GitHub](https://github.com/akadenia/AkadeniaAPI) • [Issues](https://github.com/akadenia/AkadeniaAPI/issues)
</div>

## Features

- 🚀 **Consistent Response Format**: All responses follow a standardized structure
- 🔄 **Built-in Retry Logic**: Configurable retry mechanism for failed requests
- 🛡️ **Error Handling**: Comprehensive error handling with meaningful messages
- 📝 **TypeScript Support**: Full TypeScript support with generic types
- 🔧 **Header Management**: Easy header manipulation and management
- ⏱️ **Timeout Support**: Configurable request timeouts
- 🎯 **Axios Compatible**: Built on top of axios with full compatibility
- 🔒 **Authentication Support**: Built-in support for various auth methods
- 📊 **Response Interceptors**: Automatic response processing and error handling
- 🚦 **Request Interceptors**: Custom request modification capabilities

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
- [Best Practices](#best-practices)
- [Contributing](#contributing)

## License

[MIT](LICENSE)

## Installation

```sh
npm install @akadenia/api
```

## Quick Start

### Basic Setup

```js
import { AxiosApiClient } from "@akadenia/api";

const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  }
});
```

### Making Your First Request

```js
// GET request
const response = await client.get("/users");
if (response.success) {
  console.log("Users:", response.data);
} else {
  console.error("Error:", response.message);
}
```

## Common Usage Cases

### 1. RESTful API Operations

#### GET Requests

```js
// Fetch a single user
const userResponse = await client.get<User>("/users/1");
if (userResponse.success) {
  const user = userResponse.data;
  console.log(`${user.firstName} ${user.lastName}`);
}

// Fetch with query parameters
const usersResponse = await client.get<User[]>("/users", {
  params: { page: 1, limit: 10 }
});

// Fetch with custom headers
const response = await client.get("/protected-resource", {
  headers: { "X-Custom-Header": "value" }
});

// Fetch with response type configuration
const pdfResponse = await client.get("/documents/report.pdf", {
  responseType: "blob"
});
```

#### POST Requests

```js
// Create a new user
const newUser = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com"
};

const response = await client.post<User>("/users", newUser);
if (response.success) {
  console.log("User created:", response.data);
} else {
  console.error("Creation failed:", response.message);
}

// POST with form data
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("description", "User avatar");

const uploadResponse = await client.post("/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
```

#### PUT Requests

```js
// Update an existing user
const updatedUser = {
  firstName: "Jane",
  lastName: "Smith"
};

const response = await client.put<User>("/users/1", updatedUser);
if (response.success) {
  console.log("User updated:", response.data);
}
```

#### PATCH Requests

```js
// Partial update
const partialUpdate = {
  firstName: "Jane"
};

const response = await client.patch<User>("/users/1", partialUpdate);
if (response.success) {
  console.log("User partially updated:", response.data);
}
```

#### DELETE Requests

```js
// Delete a user
const response = await client.delete("/users/1");
if (response.success) {
  console.log("User deleted successfully");
} else {
  console.error("Deletion failed:", response.message);
}

// Delete with confirmation
const deleteResponse = await client.delete("/users/1", {
  data: { confirm: true, reason: "User requested deletion" }
});
```

### 2. Authentication Scenarios

#### Bearer Token Authentication

```js
// Initialize with token
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Bearer your-jwt-token"
  }
});

// Update token dynamically
client.setHeader("Authorization", "Bearer new-token");

// Handle token expiration
try {
  const response = await client.get("/protected-endpoint");
  if (!response.success && response.message === "Unauthorized") {
    // Refresh token logic
    const newToken = await refreshToken();
    client.setHeader("Authorization", `Bearer ${newToken}`);
    // Retry the request
    return await client.get("/protected-endpoint");
  }
  return response;
} catch (error) {
  console.error("Authentication failed:", error);
}
```

#### API Key Authentication

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "X-API-Key": "your-api-key",
    "X-API-Version": "v1"
  }
});

// Rotate API keys
client.setHeader("X-API-Key", "new-api-key");
```

#### Basic Authentication

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Authorization": "Basic " + btoa("username:password")
  }
});
```

### 3. TypeScript Integration

```typescript
// Define your data types
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
  params: { page: 1, limit: 10 }
});

if (usersResponse.success) {
  const { data: users, total, page } = usersResponse.data;
  console.log(`Page ${page}: ${users.length} of ${total} users`);
}
```

### 4. Header Management

```js
// Set headers during initialization
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer initial-token"
  }
});

// Set headers dynamically
client.setHeader("X-API-Key", "your-api-key");
client.setHeader("Authorization", "Bearer new-token");

// Headers are automatically included in all requests
const response = await client.get("/protected-endpoint");

// Override headers for specific requests
const responseWithCustomHeaders = await client.get("/special-endpoint", {
  headers: { "X-Custom-Header": "override-value" }
});
```

### 5. Error Handling

```js
try {
  const response = await client.get("/users/999");
  
  if (response.success) {
    console.log("User found:", response.data);
  } else {
    // Handle different error types
    switch (response.message) {
      case "Resource Not Found":
        console.log("User doesn't exist");
        break;
      case "Unauthorized":
        console.log("Please log in again");
        break;
      case "Network Error":
        console.log("Check your internet connection");
        break;
      case "Bad Request":
        console.log("Invalid request parameters");
        break;
      case "Internal Server Error":
        console.log("Server error, please try again later");
        break;
      default:
        console.error("Unexpected error:", response.message);
    }
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

### 6. Retry Logic Configuration

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  retries: 5, // Retry up to 5 times
  retryDelay: (retryCount) => {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.pow(2, retryCount) * 1000;
  },
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount} for error: ${error.message}`);
    // You could log to monitoring service here
  }
});

// Linear backoff
const linearClient = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000, // 1s, 2s, 3s
});

// Custom retry logic
const customRetryClient = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  retries: 3,
  retryDelay: (retryCount) => {
    if (retryCount === 1) return 1000;  // 1s
    if (retryCount === 2) return 5000;  // 5s
    return 10000; // 10s
  }
});
```

### 7. Timeout Configuration

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  timeout: 10000, // 10 seconds
  retries: 2
});

// For long-running operations, you might want a longer timeout
const longRunningClient = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  timeout: 60000, // 1 minute
  retries: 1
});

// For quick operations
const quickClient = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  timeout: 5000, // 5 seconds
  retries: 0
});
```

### 8. Working with Different Response Types

```js
// JSON responses
const jsonResponse = await client.get("/users");

// File downloads
const fileResponse = await client.get("/files/document.pdf", {
  responseType: "blob"
});

// Form data
const formResponse = await client.post("/upload", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});

// Array buffer responses
const bufferResponse = await client.get("/files/image.jpg", {
  responseType: "arraybuffer"
});

// Stream responses
const streamResponse = await client.get("/files/large-file.zip", {
  responseType: "stream"
});
```

### 9. Advanced Configuration

```js
// Access the underlying axios instance for advanced use cases
const axiosInstance = client.getInstance();

// You can still use axios interceptors
axiosInstance.interceptors.request.use((config) => {
  console.log("Request:", config.method?.toUpperCase(), config.url);
  return config;
});

axiosInstance.interceptors.response.use((response) => {
  console.log("Response:", response.status, response.config.url);
  return response;
});

// Or use axios directly for one-off requests
const directResponse = await axiosInstance.get("/special-endpoint");

// Custom axios configuration
const customAxiosInstance = axios.create({
  baseURL: "https://api.example.com",
  timeout: 15000,
  validateStatus: (status) => status < 500 // Don't reject if status is less than 500
});
```

## Advanced Features

### Request/Response Interceptors

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com"
});

const axiosInstance = client.getInstance();

// Request interceptor for logging
axiosInstance.interceptors.request.use((config) => {
  console.log(`[${new Date().toISOString()}] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for data transformation
axiosInstance.interceptors.response.use((response) => {
  // Transform response data if needed
  if (response.data && response.data.items) {
    response.data = response.data.items;
  }
  return response;
});
```

### Custom Error Handling

```js
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com"
});

const axiosInstance = client.getInstance();

// Custom error interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      // Rate limiting - wait and retry
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(axiosInstance.request(error.config));
        }, 1000);
      });
    }
    return Promise.reject(error);
  }
);
```

## Error Handling

### Understanding Error Responses

All responses follow this consistent structure:

```js
// Success Response
{
  success: true,
  data: T,           // Your actual data
  status: number,    // HTTP status code
  statusText: string, // HTTP status text
  headers: object,   // Response headers
  config: object,    // Request configuration
  request: object    // Request object
}

// Error Response
{
  success: false,
  message: string,   // Human-readable error message
  data?: any,        // Error response data (if available)
  error: any,        // Original error object
  status?: number,   // HTTP status code (if available)
  statusText?: string // HTTP status text (if available)
}
```

### Error Messages

The library provides standardized error messages for common HTTP status codes:

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Resource Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `502` - Bad Gateway
- `503` - Service Unavailable
- `504` - Gateway Timeout
- Network errors and unknown errors are also handled

### Error Handling Patterns

```js
// Pattern 1: Check success flag
const response = await client.get("/users");
if (response.success) {
  return response.data;
} else {
  throw new Error(response.message);
}

// Pattern 2: Try-catch with success check
try {
  const response = await client.get("/users");
  if (response.success) {
    return response.data;
  }
  throw new Error(response.message);
} catch (error) {
  console.error("Failed to fetch users:", error.message);
  throw error;
}

// Pattern 3: Handle specific error types
const response = await client.get("/users");
if (!response.success) {
  switch (response.status) {
    case 401:
      await refreshToken();
      return await client.get("/users");
    case 404:
      return [];
    default:
      throw new Error(response.message);
  }
}
return response.data;
```

## Configuration Options

### Constructor Options

```js
const client = new AxiosApiClient(
  baseUrl,           // Required: Base URL for all requests
  headers,           // Optional: Default headers
  timeout,           // Optional: Request timeout in milliseconds (default: 30000)
  retries,           // Optional: Number of retry attempts (default: 3)
  retryDelay,        // Optional: Function to calculate delay between retries
  onRetry            // Optional: Callback function called on each retry
);
```

### Retry Configuration

```js
// Exponential backoff (recommended)
const exponentialClient = new AxiosApiClient(
  "https://api.example.com",
  {},
  30000,
  3,
  (retryCount) => Math.pow(2, retryCount) * 1000,
  (retryCount, error) => console.log(`Retry ${retryCount}: ${error.message}`)
);

// Linear backoff
const linearClient = new AxiosApiClient(
  "https://api.example.com",
  {},
  30000,
  3,
  (retryCount) => retryCount * 1000
);

// Custom retry logic
const customClient = new AxiosApiClient(
  "https://api.example.com",
  {},
  30000,
  3,
  (retryCount) => {
    if (retryCount === 1) return 1000;
    if (retryCount === 2) return 5000;
    return 10000;
  }
);
```

## Real-World Examples

### Complete User Management Example

```typescript
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
  private client: AxiosApiClient;

  constructor() {
    this.client = new AxiosApiClient({
      baseUrl: "https://api.example.com",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-token"
      },
      retries: 3,
      timeout: 10000
    });
  }

  async getUsers(page: number = 1, limit: number = 10): Promise<User[]> {
    const response = await this.client.get<User[]>("/users", {
      params: { page, limit }
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async getUserById(id: number): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.client.post<User>("/users", userData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, userData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async deleteUser(id: number): Promise<void> {
    const response = await this.client.delete(`/users/${id}`);
    if (!response.success) {
      throw new Error(response.message);
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    const response = await this.client.get<User[]>("/users/search", {
      params: { q: query }
    });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
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
  console.log("Created user:", newUser);
  
  const updatedUser = await userService.updateUser(newUser.id, {
    firstName: "Jane"
  });
  console.log("Updated user:", updatedUser);
  
} catch (error) {
  console.error("User service error:", error.message);
}
```

### E-commerce API Example

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
}

interface Order {
  id: number;
  userId: number;
  products: Array<{ productId: number; quantity: number }>;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: string;
}

class EcommerceAPI {
  private client: AxiosApiClient;

  constructor(apiKey: string) {
    this.client = new AxiosApiClient({
      baseUrl: "https://api.ecommerce.com",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json"
      },
      retries: 3,
      timeout: 15000
    });
  }

  async getProducts(category?: string, page: number = 1): Promise<Product[]> {
    const params: any = { page };
    if (category) params.category = category;
    
    const response = await this.client.get<Product[]>("/products", { params });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async getProduct(id: number): Promise<Product> {
    const response = await this.client.get<Product>(`/products/${id}`);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const response = await this.client.post<Order>("/orders", orderData);
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async updateOrderStatus(orderId: number, status: Order['status']): Promise<Order> {
    const response = await this.client.patch<Order>(`/orders/${orderId}`, { status });
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }
}
```

### File Upload Service

```typescript
interface UploadResponse {
  id: string;
  filename: string;
  size: number;
  url: string;
  uploadedAt: string;
}

class FileUploadService {
  private client: AxiosApiClient;

  constructor() {
    this.client = new AxiosApiClient({
      baseUrl: "https://api.files.com",
      headers: {
        "Authorization": "Bearer your-token"
      },
      timeout: 60000, // Longer timeout for file uploads
      retries: 2
    });
  }

  async uploadFile(file: File, description?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    if (description) {
      formData.append("description", description);
    }

    const response = await this.client.post<UploadResponse>("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async uploadMultipleFiles(files: File[]): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await this.client.post<UploadResponse[]>("/upload/multiple", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }

  async downloadFile(fileId: string): Promise<Blob> {
    const response = await this.client.get(`/files/${fileId}`, {
      responseType: "blob"
    });

    if (response.success) {
      return response.data;
    }
    throw new Error(response.message);
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Network Errors

```js
// Problem: Frequent network errors
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  retries: 5, // Increase retries
  retryDelay: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
  timeout: 30000 // Increase timeout
});
```

#### 2. Authentication Issues

```js
// Problem: Token expiration
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com"
});

// Solution: Implement token refresh
const axiosInstance = client.getInstance();
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const newToken = await refreshToken();
      client.setHeader("Authorization", `Bearer ${newToken}`);
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

#### 3. Rate Limiting

```js
// Problem: 429 Too Many Requests
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000 // Wait 2s, 4s, 6s
});
```

#### 4. Large File Uploads

```js
// Problem: Large files timing out
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com",
  timeout: 300000, // 5 minutes for large uploads
  retries: 1 // Don't retry large uploads
});
```

### Debug Mode

```js
// Enable detailed logging
const client = new AxiosApiClient({
  baseUrl: "https://api.example.com"
});

const axiosInstance = client.getInstance();

// Log all requests
axiosInstance.interceptors.request.use((config) => {
  console.log("🚀 Request:", {
    method: config.method?.toUpperCase(),
    url: config.url,
    headers: config.headers,
    data: config.data
  });
  return config;
});

// Log all responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.log("❌ Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message
    });
    return Promise.reject(error);
  }
);
```

## API Reference

### Constructor

```typescript
new AxiosApiClient(
  baseUrl: string,
  headers?: Headers,
  timeout?: number,
  retries?: number,
  retryDelay?: (retryCount: number) => number,
  onRetry?: (retryCount: number, error: any) => void
)
```

### Methods

#### HTTP Methods

- `get<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>>`
- `post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>>`
- `put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>>`
- `patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>>`
- `delete<T>(url: string, config?: AxiosRequestConfig): Promise<AkadeniaApiResponse<T>>`

#### Utility Methods

- `setHeader(name: string, value: string): void` - Set a header for all future requests
- `getInstance(): AxiosInstance` - Get the underlying axios instance

### Types

```typescript
interface AkadeniaApiSuccessResponse<T = any> extends AxiosResponse<T> {
  success: true;
  message?: string;
}

interface AkadeniaApiErrorResponse {
  success: false;
  message: string;
  data?: any;
  error: any;
  status?: number;
  statusText?: string;
}

type AkadeniaApiResponse<T = any> = AkadeniaApiSuccessResponse<T> | AkadeniaApiErrorResponse;
```

## Best Practices

1. **Always check `response.success`** before accessing `response.data`
2. **Use TypeScript generics** for better type safety
3. **Configure retry logic** for production environments
4. **Set appropriate timeouts** based on your API's response times
5. **Handle errors gracefully** using the standardized error messages
6. **Use header management** for authentication and API keys
7. **Implement exponential backoff** for retry strategies
8. **Use interceptors** for cross-cutting concerns like logging and authentication
9. **Handle rate limiting** with appropriate retry delays
10. **Validate responses** before processing data
11. **Use appropriate response types** for different content (JSON, blob, etc.)
12. **Implement proper error boundaries** in your application
13. **Monitor and log** API performance and errors
14. **Use environment-specific configurations** for different deployment stages

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/akadenia/AkadeniaAPI.git
cd AkadeniaAPI
npm install
npm run build
npm test
```

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for our semantic release process. **We prefer commit messages to include a scope in parentheses** for better categorization and changelog generation.

#### Preferred Format
```
type(scope): description

[optional body]

[optional footer]
```

#### Examples
```bash
# ✅ Preferred - with scope
feat(api): add new retry configuration options
fix(auth): resolve token refresh issue
docs(readme): add troubleshooting section
chore(deps): update axios to latest version

# ❌ Less preferred - without scope
feat: add new retry configuration options
fix: resolve token refresh issue
docs: add troubleshooting section
chore: update axios to latest version
```

#### Common Scopes
- `api` - API client functionality
- `auth` - Authentication and authorization
- `types` - TypeScript type definitions
- `docs` - Documentation updates
- `deps` - Dependency updates
- `test` - Test-related changes
- `build` - Build and build tooling
- `ci` - CI/CD configuration

#### Commit Types
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

