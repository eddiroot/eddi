package handlers

import (
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/lib"
	"github.com/lachlanmacphee/eddy/service"
	"golang.org/x/crypto/bcrypt"
)

func Signup(c *gin.Context) {
	var user model.User
	if err := c.ShouldBindJSON(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Hash the password
	hash, err := bcrypt.GenerateFromPassword([]byte(user.Password), 10)

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to hash password.",
		})
		return
	}

	// Create the user
	createdUser, err := service.CreateUser(user.FirstName, *user.MiddleName, user.LastName, user.Username, string(hash), *user.AvatarUrl)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create user.",
		})
		return
	}

	// Respond
	c.JSON(http.StatusOK, gin.H{"message": "User created successfully", "id": createdUser.ID})
}

func Login(c *gin.Context) {
	// Get email & pass off req body
	var body struct {
		Username string
		Password string
	}

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to read body",
		})

		return
	}

	// Look up for requested user
	user, err := service.GetUserByUsername(body.Username)

	// Failed to find the user
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid username or password",
		})
		return
	}

	// Compare sent in password with saved users password
	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid username or password",
		})
		return
	}

	// Generate a JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID,
		"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
	})

	// Sign and get the complete encoded token as a string using the secret
	tokenString, err := token.SignedString([]byte(os.Getenv(lib.ENV_AUTH_JWT_SECRET_KEY)))

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Failed to create token",
		})
		return
	}

	// Respond
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("Authorization", tokenString, 3600*24*30, "", "", false, true)

	criticalUserDetails := model.User{
		ID:         user.ID,
		FirstName:  user.FirstName,
		MiddleName: user.MiddleName,
		LastName:   user.LastName,
		Username:   user.Username,
		AvatarUrl:  user.AvatarUrl,
	}
	c.JSON(http.StatusOK, criticalUserDetails)
}

func Logout(c *gin.Context) {
	c.SetCookie("Authorization", "", -1, "", "", false, true)
	c.JSON(http.StatusOK, gin.H{})
}