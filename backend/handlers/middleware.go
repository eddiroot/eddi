package handlers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/lachlanmacphee/eddy/lib"
	"github.com/lachlanmacphee/eddy/service"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func APIKeyAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey != os.Getenv(lib.ENV_AUTH_ADMIN_API_KEY) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}
		c.Next()
	}
}

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the cookie off the request
		tokenString, err := c.Cookie("Authorization")

		if err != nil {
			c.AbortWithStatus(http.StatusUnauthorized)
		}

		// Decode/validate it
		token, _ := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Don't forget to validate the alg is what you expect:
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			return []byte(os.Getenv(lib.ENV_AUTH_JWT_SECRET_KEY)), nil
		})

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Check the expiry date
			if float64(time.Now().Unix()) > claims["exp"].(float64) {
				c.AbortWithStatus(http.StatusUnauthorized)
			}

			subClaimFloat, ok := claims["sub"].(float64)
			if !ok {
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}

			// Find the user with token Subject
			// Look up for requested user
			user, err := service.GetUserByID(int(subClaimFloat))

			// Failed to find the user
			if err != nil {
				c.AbortWithStatus(http.StatusUnauthorized)
			}

			// Attach the request
			c.Set("user", user)

			//Continue
			c.Next()
		} else {
			c.AbortWithStatus(http.StatusUnauthorized)
		}
	}
}
