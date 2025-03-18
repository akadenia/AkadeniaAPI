## Akadenia API

An opinionated wrapper around axios library

## License

[MIT](LICENSE)

## Installation

```sh
npm install @akadenia/api
```

## Usage

### Importing the Axios Client

```js
import { AxiosApiClient } from "@akadenia/api";
```

### Instantiating the Axios Client

```js
const headers = {
  "Content-Type": "application/json",
};
const client = new AxiosApiClient({
  baseUrl: "https://baseurl",
  headers,
});
```

### Making a GET request

```js
type User = {
    id: number
    firstName: string
    lastName: string
}

const response = await client.get<User>("/users/1")
if (response.success) {
    console.log(response.data.firstName)
    console.log(response.data.lastName)
} else {
    console.log(response.error)
}
```

### Making a POST request

```js
type User = {
    id: number
    firstName: string
    lastName: string
}

const payload = {
    firstName: "John",
    lastName: "Doe"
}
const response = await client.post<User>("/users", payload)
if (response.success) {
    console.log(response.data)
} else {
    console.log(response.error)
}

console.log(response.message)
```

### Making a PUT request

```js
const payload = {
  firstName: "Lisa",
  lastName: "Smith",
};
const response = await client.put("/users/1", payload);
if (response.success) {
  console.log(response.data);
} else {
  console.log(response.error);
}

console.log(response.message);
```

### Making a DELETE request

```js
const response = await client.delete("/users/1");

if (response.success) {
  console.log(response.message);
} else {
  console.log(response.error);
}
```

### Default response structure

```js
   {
    success: false
    message: string
    data?: any
    error: any
  }
```

### Configuring Retry Logic

The AxiosApiClient supports configurable retry logic for failed requests based on the [axios-retry](https://github.com/softonic/axios-retry) library. You can customize the retry behavior when instantiating the client:

```js
const client = new AxiosApiClient({
  baseUrl: "https://baseurl",
  retries: 3, // Number of retries
  retryDelay: (retryCount) => retryCount * 1000, // Wait 1 second on first retry, 2 seconds on second retry, etc.
  onRetry: (retryCount, error) => {
    console.log(`Retry attempt ${retryCount} for error: ${error.message}`);
  }, // Callback function to be called on retry
});
```
