---
title: "Redoed #4: Building the Document CRUD API"
description: "In this post, we implement the CRUD API for managing documents in Redoed. We cover repository functions, HTTP handlers, and routing."
date: "2025-03-03"
tags:
  - go
  - backend
series: Building-Redoed
---

## Redoed #4: Building the Document CRUD API

Now that we have [a database connection](https://heshify.github.io/blog/redoed-database-connection), let's write the APIs to create, retrieve, update, and delete documents.

## Project structure

For this project, I'll use the following folder structure:

```
/redoed
├── cmd
│   └── server
│       └── main.go
├── docker-compose.yml
├── Dockerfile
├── go.mod
├── go.sum
├── internal
│   ├── db
│   │   └── db.go
│   ├── handlers
│   │   └── document_handler.go
│   ├── models
│   │   └── documents.go
│   ├── repository
│   │   └── document_respository.go
│   └── router
│       └── router.go
├── LICENSE
├── README.md
└── utils
    └── utils.go
```

- The `repository` package will serve as the data access layer, meaning all functions that interact with the database will be placed here.
- The `handlers` package will contain our HTTP handlers.
- The `router` package will handle request routing.

Now, let's start by implementing the repository in `repository/document_repository.go`.

## Implementing the Document Repository

`internal/repository/document_repository.go`.

```go
package repository

import (
	"github.com/heshify/redoed/internal/db"
	"github.com/heshify/redoed/internal/models"
)

type DocumentRepository struct{}

func NewDocumentRepository() *DocumentRepository {
	return &DocumentRepository{}
}
```

Here, we:

- Import the db and models packages.
- Define a DocumentRepository struct.
- Provide a constructor function `NewDocumentRepository()` to create an instance of DocumentRepository.

Now, let's implement the CRUD functions for managing documents, starting with document creation.

### Creating a Document

```go
func (r *DocumentRepository) CreateDocument(doc *models.Document) error {
	result := db.DB.Create(doc)
	return result.Error
}
```

This function takes a `Document` object and inserts it into the database. If the operation succeeds, it returns `nil` otherwise, it returns an error.

### Retrieving a Document by ID

Next, we need a function to fetch a document by its ID.

```go
func (r *DocumentRepository) GetDocument(id string) (models.Document, error) {
	var document models.Document
	result := db.DB.First(&document, "id = ?", id)
	return document, result.Error
}
```

This function searches for a document with the given ID. If found, it returns the document along with any potential errors.

### Retrieving All Documents

Now, let's add a function to fetch all documents.

```go
func (r *DocumentRepository) GetDocuments() ([]models.Document, error) {
	var documents []models.Document
	result := db.DB.Find(&documents)
	return documents, result.Error
}
```

Currently, this function retrieves all documents without any restrictions. However, in a real-world scenario, we would implement pagination for better efficiency. Additionally, users should only access their own documents, which we'll enforce after implementing authentication and user management.

### Updating a Document

Next, let's add a function to update a document.

```go
func (r *DocumentRepository) UpdateDocument(id string, doc *models.Document) error {
	var document models.Document
	result := db.DB.Model(&document).Where("id = ?", id).Updates(doc)
	return result.Error
}
```

This function updates an existing document based on its ID using the provided changes.

### Deleting a Document

Finally, let's implement the delete function.

```go
func (r *DocumentRepository) DeleteDocument(id string) error {
	result := db.DB.Delete(&models.Document{}, "id = ?", id)
	return result.Error
}
```

This function removes a document from the database based on its ID.

With these repository functions in place, we can now move on to writing the HTTP handlers that will use them.

But, before doing that, we need some helper functions for JSON handling, validation, and error responses.

## Utility Functions

`utils/utils.go`

```go
package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/heshify/redoed/internal/models"
)

func ValidateDocument(doc models.Document) error {
	if doc.Title == "" {
		return fmt.Errorf("title is required")
	}
	return nil
}

func WriteJSON(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

func ParseJSON(r *http.Request, data any) error {
	if r.Body == nil {
		return fmt.Errorf("missing request body")
	}

	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(data); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}

	if decoder.More() {
		return fmt.Errorf("unexpected extra data in request body")
	}

	return nil
}

func WriteError(w http.ResponseWriter, status int, err error) {
	if err == nil {
		err = errors.New("unknown error")
	}
	WriteJSON(w, status, map[string]string{"error": err.Error()})
}
```

These functions validate documents, parse JSON requests, and send structured responses, reducing boilerplate in handlers. Now, let's move on to implementing the API handlers.

## Setting Up the Document Handler

First, we define a `DocumentHandler` struct, which holds a reference to the `DocumentRepository`. This allows the handler functions to interact with the database.

`internal/handlers/document_handler.go`

```go
type DocumentHandler struct {
	Repo *repository.DocumentRepository
}

func NewDocumentHandler(repo *repository.DocumentRepository) *DocumentHandler {
	return &DocumentHandler{Repo: repo}
}
```

The `NewDocumentHandler` function initializes a new handler instance with a given repository.

### Creating a Document

```go
func (h *DocumentHandler) CreateDocument(w http.ResponseWriter, r *http.Request) {
	var newDocument models.Document

	if err := utils.ParseJSON(r, &newDocument); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if err := utils.ValidateDocument(newDocument); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if err := h.Repo.CreateDocument(&newDocument); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	if err := utils.WriteJSON(w, http.StatusCreated, newDocument); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
}
```

This function handles the creation of a new document. It:

1. Parses the JSON request body.
2. Validates the document fields.
3. Calls the repository function to save the document.
4. Returns the newly created document in the response.

If any step fails, it responds with an appropriate HTTP error code.

### Deleting a Document

```go
func (h *DocumentHandler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("missing document ID"))
		return
	}

	if err := h.Repo.DeleteDocument(id); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to delete document"))
		return
	}

	utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "document deleted"})
}
```

This function removes a document by its ID. If the ID is missing or deletion fails, it returns an error.

### Updating a Document

```go
func (h *DocumentHandler) UpdateDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("missing document ID"))
		return
	}

	_, err := h.Repo.GetDocument(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("document not found"))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to fetch document"))
		}
		return
	}

	var newDocument models.Document

	if err := utils.ParseJSON(r, &newDocument); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if err := utils.ValidateDocument(newDocument); err != nil {
		utils.WriteError(w, http.StatusBadRequest, err)
		return
	}

	if err := h.Repo.UpdateDocument(id, &newDocument); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to update document"))
		return
	}

	if err := utils.WriteJSON(w, http.StatusOK, newDocument); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
}
```

This function updates an existing document:

1. Retrieves the document by ID to ensure it exists.
2. Parses and validates the updated data.
3. Calls the repository to update the document.
4. Returns the updated document.

If the document is missing, it returns a `404 Not Found` response.

### Retrieving a Document by ID

```go
func (h *DocumentHandler) handleGetDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		utils.WriteError(w, http.StatusBadRequest, errors.New("missing document ID"))
		return
	}

	document, err := h.Repo.GetDocument(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.WriteError(w, http.StatusNotFound, errors.New("document not found"))
		} else {
			utils.WriteError(w, http.StatusInternalServerError, errors.New("failed to fetch document"))
		}
		return
	}

	if err := utils.WriteJSON(w, http.StatusOK, document); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
}
```

This function retrieves a document by its ID. If the document is not found, it returns a `404 Not Found` error.

### Retrieving All Documents

```go
func (h *DocumentHandler) GetDocuments(w http.ResponseWriter, r *http.Request) {
	documents, err := h.Repo.GetDocuments()
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}

	if err := utils.WriteJSON(w, http.StatusOK, documents); err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err)
		return
	}
}
```

This function retrieves all documents and returns them as JSON.

> **Note:** Right now, this function fetches all documents without filtering. Later, we will restrict it to return only the authenticated user's documents and implement pagination.

## Setting Up the Router

After defining our HTTP handlers, we now register them with the router to handle incoming API requests. This ensures that each request is routed to the appropriate handler based on its method and endpoint.

```go
package router

import (
	"net/http"

	"github.com/heshify/redoed/internal/handlers"
	"github.com/heshify/redoed/internal/repository"
)

func NewRouter() *http.ServeMux {

	docRepo := repository.NewDocumentRepository()
	docHandler := handlers.NewDocumentHandler(docRepo)

	r := http.NewServeMux()

	r.HandleFunc("POST /api/document", docHandler.CreateDocument)
	r.HandleFunc("GET /api/document", docHandler.GetDocuments)
	r.HandleFunc("GET /api/document/{id}", docHandler.GetDocument)
	r.HandleFunc("PUT /api/document/{id}", docHandler.UpdateDocument)
	r.HandleFunc("DELETE /api/document/{id}", docHandler.DeleteDocument)
	return r
}
```

Here, we initialize the document repository and pass it to the handler, ensuring a clean separation between data access and request handling. Each API route is mapped to its corresponding handler using `http.ServeMux` which dispatches requests based on their method and path.

### **Updating `main.go` and the Dockerfile**

The `main.go` file from [the first post](https://heshify.github.io/blog/redoed-setup-go-http-server), where our server existed, has now been moved to `cmd/server/main.go`, and I’ve made some changes to it.
Our server was initializing database and had a simple "Hello, World!" handler.

Now, we set up CORS, and use our router:

```go
package main

import (
	"log"
	"net/http"

	"github.com/heshify/redoed/internal/db"
	"github.com/heshify/redoed/internal/router"
	"github.com/rs/cors"
)

func init() {
	db.InitDb()
}

func main() {
	r := router.NewRouter()
	port := "8080"
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Change to specific origins if needed
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	handlerWithCors := c.Handler(r)

	log.Printf("Starting server on port %s", port)
	err := http.ListenAndServe(":"+port, handlerWithCors)
	if err != nil {
		log.Fatal(err)
	}
}
```

### **Updating the Dockerfile**

Since `main.go` was moved to `cmd/server/`, we need to update the **Dockerfile** accordingly.

#### **Before ([from the second post](https://heshify.github.io/blog/redoed-setting-up-docker/)):**

```dockerfile
# Build the Go application
RUN go build -o server ./cmd/server
```

#### **After:**

```dockerfile
# Build the Go application
RUN go build -o server ./cmd/server
```

This change ensures that Docker builds and runs the server from the correct location.

With this, our API is fully wired up and ready to handle document operations.

Here's how far we've progressed in Redoed up to this point: [GitHub - document-crud-api branch](https://github.com/heshify/redoed/tree/document-crud-api).

## References

A lot of the structure and best practices in this project were inspired by these awesome resources.

- [Complete Backend API in Golang (JWT, MySQL & Tests) by Tiago](https://youtu.be/7VLmLOiQ3ck?si=kHI49GjsctAhDLCm)
- [11 tips for structuring your Go projects by Alex Edwards](https://www.alexedwards.net/blog/11-tips-for-structuring-your-go-projects)
- https://github.com/golang-standards/project-layout
- Gorm Docs: https://gorm.io/docs/
