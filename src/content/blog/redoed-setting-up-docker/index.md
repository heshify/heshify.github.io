---
title: "Redoed #2: Containerizing the Go Server and PostgreSQL with Docker"
description: "Using Docker Compose to containerize a Go server and PostgreSQL"
date: "2025-02-26"
tags:
  - docker
  - postgresql
series: Building-Redoed
---

## Building Redoed : Containerizing the Go Server and PostgreSQL with Docker

Now that we’ve got a basic HTTP server running, it’s time to add a database. I’ll be using PostgreSQL to store our documents and user data. Instead of setting up PostgreSQL locally, I’m opting to use Docker. Because, Docker helps avoid potential headaches with local setups. It makes everything more portable, and with Docker Compose, I can manage both the Go server and the database in a unified, isolated environment. It also means I won’t have to worry about dealing with different configurations on different machines—what works in my container will work everywhere.

I use Arch **btw**, so I followed [these instructions](https://docs.docker.com/desktop/setup/install/linux/archlinux/) to install and set up Docker on my machine.

## Defining the Go Server Container

The first step in containerizing our Go server is to create a `Dockerfile`. This file will describe how the Go application should be packaged into a container.

```
# Use the official Golang image
FROM golang:1.24-alpine

# Set working directory inside the container
WORKDIR /app

# Copy everything into the container
COPY . .

# Build the Go application
RUN go build -o server .

# Expose port 8080
EXPOSE 8080

# Run the binary
CMD ["./server"]
```

This Dockerfile does the following:

- It starts with the official Golang image, which is based on Alpine Linux for a lightweight container.
- Sets the working directory to `/app`.
- Copies the entire local project directory into the container's `/app` directory.
- Compiles our go code and generates binary named `server`.
- It exposes port 8080, so the server can be accessed externally.
- Specifies the command to run the server binary when the container starts.

## Building and Running the Go Server Docker Container

Now that we have the `Dockerfile`, we can build and run the container.

```sh
docker build -t redoed-server .
```

This will create an image called `redoed-server` based on the instructions in the `Dockerfile`. Once the image is built, we can run it with:

```sh
docker run -p 8080:8080 redoed-server
```

This command starts the container, mapping port 8080 on the host machine to port 8080 inside the container, so we can access the server at `localhost:8080`.

## Setting Up PostgreSQL with Docker Compose

We can start a PostgreSQL container using the `docker run` command like this:

```sh
docker run --name redoed-db -e POSTGRES_PASSWORD=mysecretpassword -d postgres
```

However, since we’re going to use multiple services (our Go server and the PostgreSQL database) It won't be convient to manually start each containers with individual commands, Docker Compose makes things a lot easier. Instead of manually managing each container, Docker Compose allows us to define and run both services from a single configuration file. This file is called `docker-compose.yml`.

```yml
services:
  server:
    build: .
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
        restart: true

  db:
    image: postgres:17-alpine

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

In our `docker-compose.yml` file, we define two services: the Go server (`server`) and the PostgreSQL database (`db`).

- **server**: This container is built from the current directory (`.`). It exposes port 8080 to allow access from the host. The `depends_on` directive ensures that the `server` container waits until the `db` container is healthy before starting. It also restarts automatically if it crashes.
- **db**: This container runs the `postgres:17-alpine` image. The `healthcheck` ensures the database is ready before the server tries to connect. It also defines the necessary environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`) for configuring the database. Port 5432 is exposed to allow communication, and the `pgdata` volume ensures data persists even if the container is restarted.
- **volumes**: The `pgdata` volume ensures that the PostgreSQL data persists even if the container is recreated.

Once everything is set up, We can start both containers with the following command :

```sh
docker compose up --build
```

This will build the Docker images and start both the Go server and PostgreSQL containers. The Go server will be available at `localhost:8080`, and PostgreSQL will be running on `localhost:5432`.

If we want to interact with database, we can do that by running following command:

```sh
docker run -it redoed-db-1 psql -U ${DB_USER} -d ${DB_NAME}
```

This opens an interactive session inside our container and connects to PostgreSQL using the specified user and database.

## Conclusion

We’ve successfully containerized the Go server and PostgreSQL using Docker Compose. With everything set up, the next step is to connect the database to the server. Once that's done, we’ll write the CRUD APIs to interact with the data.

See you in the next post!

## References

- https://docs.docker.com/desktop/setup/install/linux/archlinux/
- https://www.docker.com/blog/how-to-use-the-postgres-docker-official-image/
- https://www.docker.com/blog/how-to-use-the-alpine-docker-official-image/
- https://docs.docker.com/compose/how-tos/startup-order/
