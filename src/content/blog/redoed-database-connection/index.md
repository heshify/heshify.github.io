---
title: "Redoed #3: Connecting Go Server to PostgreSQL with GORM"
description: "Integrating PostgreSQL with a Go server using GORM. This post covers setting up the database connection, defining models, running migrations, and ensuring the database is ready when the server starts."
date: "2025-02-27"
tags:
  - go
  - backend
  - postgresql
series: Building-Redoed
---

## Building Redoed : Connecting Go Server to PostgreSQL with GORM

Now that our Go server and PostgreSQL database are running inside Docker containers, it's time to integrate the database with the server. I’ll be using GORM, a popular ORM for Go. Writing raw SQL is always an option if we want to avoid dependencies, but I wanted to experiment with GORM for this project.

## Installing Dependencies

Before we start writing the database logic, let's install the required dependencies:

```sh
go get -u gorm.io/gorm gorm.io/driver/postgres github.com/joho/godotenv github.com/google/uuid
```

With these installed, we're ready to connect to PostgreSQL.

## Setting Up the Database Package

To keep the codebase organized, database logic will live in its own package. Inside `internal/db/db.go`, we'll set up the connection.

### Initializing the Database

The database package will manage the connection and keep it accessible across the application. First, we import the required packages:

```go
package database

import (
  "fmt"
  "log"
  "os"

  "github.com/joho/godotenv"
  "gorm.io/driver/postgres"
  "gorm.io/gorm"
```

This line declares a global `DB` variable that will hold the database connection:

```go
var DB *gorm.DB
```

Keeping it global makes it accessible throughout the app without needing to pass it around. It'll be assigned a connection inside `InitDb()`, so once Initialized, we can use `DB` for queries and migrations.

### Loading Environment Variables

Now, let's write the function that initializes the database. First, we load the database credentials from the `.env` file:

```go
func InitDb() {
  if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}
 //...
}
```

If the `.env` file is missing, the application logs an error and exits, preventing it from running with missing credentials.

### Constructing the Connection String

With the environment variables loaded, we can now construct the PostgreSQL connection string dynamically:

```go
//...
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")

	connectionStr := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		host, user, password, dbname, port,
	)
//...
```

Here, we’re pulling values from the environment and constructing the connection string, which we’ll use to connect to the database.

### Connecting to PostgreSQL

With the connection string ready, GORM provides a simple way to open a connection:

```go
//...
	DB, err = gorm.Open(postgres.Open(connectionStr), &gorm.Config{})
	if err != nil {
		log.Fatalf("ERROR: Failed to initialize database: %v", err)
	}

	log.Println("INFO: Database initialized")
}
```

The `gorm.Open()` function initializes the database connection. It takes `postgres.Open(connectionStr)` as the driver and a configuration struct. If the connection fails due to incorrect credentials or an unreachable database then the app logs the error and exits. Otherwise, we get a confirmation message, and the database is ready to use.

## Connecting the Server to the Database

At this point, the database is set up, but the server doesn’t know about it yet. Let’s initialize the connection when the application starts.

Inside `main.go`, add:

```go
func init() {
  db.InitDb()
}
```

Now, every time the server runs, it ensures that the database is connected and ready to use.

## Defining the Document Model

Now that the database is set up, let;s define the structure for documents.

Inside `internal/models/document.go`

```go
package models

import (
	"time"

	"github.com/google/uuid"
)

type Document struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title     string    `json:"title"`
	Content   string    `json:"content"`
	CreatedAt time.Time
	UpdatedAt time.Time
}
```

Each document will have a title and content along with a unique UUID as its primary key and timestamps to track creation and updates.

## Running Migrations

We can create the `documents` table in the database using GORM’s `AutoMigrate` function. For now, let's add this line inside `InitDb()`:

```go
func InitDb() {
//...
DB.AutoMigrate(&models.Document{})
}
```

This ensures that whenever the application starts, the database schema is up to date.

Now, if we run:

```sh
docker compose up --build
```

It will build our Go code and start both server and database containers.

If there are no errors, we can check the `document` table inside `psql` by running `\dt`:

```
mydb-# \dt
         List of relations
 Schema |   Name    | Type  | Owner
--------+-----------+-------+-------
 public | documents | table | user
(1 row)
```

## Conclusion

With the datbase connected, we're now ready to start building the API.

See you in the next post!
