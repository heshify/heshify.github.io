---
title: "Redoed #1: Setting Up a Basic HTTP Server in Go"
description: "This is the first step in building Redoed, a real-time collaborative Markdown editor. Learn how to set up a basic HTTP server in Go using the standard library"
date: "2025-02-24"
tags:
  - go
  - backend
series: Building-Redoed
---

## Building Redoed : Setting up a Basic HTTP Server in Go

I want to build a real-time collaborative Markdown editor in Go, where multiple users can simultaneously edit a document and see each other's changes in real-time. I'm calling this project **Redoed** (**Re**al-time **Do**cument **Ed**itor).

Every project starts somewhere. Before diving into the complexities of real-time collaboration, WebSockets, and Markdown processing, let’s begin with something fundamental: setting up a basic HTTP server in Go. This will be the first step in building **Redoed**.

## Initalizing the Module

A Go project starts with module initialization. For Redoed, I initialized the module with following command :

```sh
go mod init github.com/heshify/redoed
```

This generated a `go.mod` file, which will track dependencies for the project.

Now, we’ll place all our server code inside a `main.go` file.

## Creating the HTTP Server

### Defining the Package

Every Go program starts with a package declaration. Since this is an executable program, we use `package main` at the top of `main.go` :

```go
package main
```

### Importing Required Packages

Go’s standard library provides everything needed to run an HTTP server. We import the necessary packages:

```go
import (
    "fmt"
    "log"
    "net/http"
)
```

- `fmt`: Used for formatting and printing messages.

- `log`: Provides logging functionality to record errors and other information.

- `net/http`: Provides HTTP server and request handling functionality.

### Defining a Request Handler

A handler function processes incoming HTTP requests and sends responses. Let’s define one that responds with `Hello, World!`:

```go
func handler(w http.ResponseWriter, r *http.Request) {
    fmt.Fprintf(w, "Hello, World!\n")
}
```

- This function takes two parameters
  - `w http.ResponseWriter`: Used to send the HTTP response back to the client.
  - `r *http.Request`: Represents the incoming HTTP request.

The `fmt.Fprintf(w, "Hello, World!")` line writes the response body, which is sent back to the client.

### Setting Up the Router and Registering the Handler

We use `http.NewServeMux()` to create a router (multiplexer) that directs incoming requests to the appropriate handlers:

```go
func main() {
    r := http.NewServeMux()
    r.HandleFunc("/", handler)
}
```

- `http.NewServeMux()`: Creates a new request multiplexer (router).

- `r.HandleFunc("/", handler)`: Registers the handler function to handle requests at the root path (`/`).

### Starting the HTTP Server

To start the server, we use `http.ListenAndServe`, which listens for incoming connections on port `8080`:

```go
func main() {
    r := http.NewServeMux()
    r.HandleFunc("/", handler)

    err := http.ListenAndServe(":8080", r)
    if err != nil {
        log.Fatal(err)
    }
}
```

- `http.ListenAndServe(":8080", r)`: Starts the server on port 8080 and routes requests using r.

- `log.Fatal(err)`: Logs any error and exits the program if the server fails to start.

- `ListenAndServe` is a blocking call, meaning it will run indefinitely until manually stopped.

## Testing the Server

### Running the Server

Now, with the router and the server set up, we can run our Go program using:

```sh
go run main.go
```

The server will start listening on port 8080. We can test it by opening a browser and navigating to: http://localhost:8080

Alternatively, we can test the server using **curl** in the terminal:

```sh
curl http://localhost:8080/
```

which should return :

```
Hello, World!
```

## Conclusion

We have successfully set up a basic HTTP server in Go, which serves as the foundation for building Redoed. Next, we’ll set up a database connection to store documents and user data.

Stay tuned!
