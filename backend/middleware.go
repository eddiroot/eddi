package main

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// APIKeyAuthMiddleware checks if the correct API key is provided in the request header
func APIKeyAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        apiKey := c.GetHeader("X-API-Key")
        if apiKey != "your-secret-api-key" { // Replace with your actual key
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
            c.Abort()
            return
        }
        c.Next()
    }
}

// JWTAuthMiddleware checks for a valid JWT in the Authorization header
func JWTAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if !strings.HasPrefix(authHeader, "Bearer ") {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
            c.Abort()
            return
        }

        token := strings.TrimPrefix(authHeader, "Bearer ")
        // Here, add your logic to validate the JWT token
        if token != "your-valid-jwt" { // Replace with actual JWT validation
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired JWT"})
            c.Abort()
            return
        }

        c.Next()
    }
}
