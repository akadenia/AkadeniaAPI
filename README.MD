# Akadenia API

An opinionated wrapper around axios library

## Installation

```sh
npm install @akadenia/api
```

## Usage

### Importing the Axios Client
```js
import { AxiosApiClient } from '@akadenia/api'
```

### Instantiating the Axios Client

```js
const headers = {
    "Content-Type": "application/json"
}
const client = new AxiosApiClient('https://baseurl', headers)
```

### Making a GET request

```js
type User = {
    id: number
    firstname: string
    lastname: string
}

const response = await client.get<User>("/users/1")
if (response.success) {
    console.log(response.data.firstname)
    console.log(response.data.lastname)
} else {
    console.log(response.error)
}
```

### Making a POST request

```js
type User = {
    id: number
    firstname: string
    lastname: string
}

const payload = {
    firstname: "John",
    lastname: "Doe"
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
    firstname: "Lisa",
    lastname: "Smith"
}
const response = await client.put("/users/1", payload)
if (response.success) {
    console.log(response.data)
} else {
    console.log(response.error)
}

console.log(response.message)
```

### Making a DELETE request

```js
const response = await client.delete("/users/1")

if (response.success) {
    console.log(response.message)
} else {
    console.log(response.error)
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

## License

[MIT](LICENSE)
