# Stage 1: Build the Go application
FROM golang:latest AS build

WORKDIR /app

# Copy the Go module files
COPY go.mod go.sum ./

# Download the Go module dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the Go application with optimizations
RUN CGO_ENABLED=0 go build -o /start .

# Stage 2: Create the final, minimal image
FROM alpine:latest

# Copy the compiled application from the build stage
COPY --from=build /start /start

# Set the working directory
WORKDIR /app

# Expose the desired port
EXPOSE 8080

# Run the application
CMD ["/start"]
