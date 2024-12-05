package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lachlanmacphee/eddy/database"
	"github.com/lachlanmacphee/eddy/service"
)

func CreateInstitution(c *gin.Context) {
	var institution database.Institution
	if err := c.ShouldBindJSON(&institution); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := service.CreateInstitution(institution.Name, institution.Continent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Institution created", "id": id})
}

func GetInstitutions(c *gin.Context) {
	institutions, err := service.GetInstitutions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, institutions)
}

func GetInstitutionByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid institution ID"})
		return
	}

	institution, err := service.GetInstitutionByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, institution)
}

func UpdateInstitution(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid institution ID"})
		return
	}

	var institution database.Institution
	if err := c.ShouldBindJSON(&institution); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err = service.UpdateInstitution(id, institution.Name, institution.Continent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Institution updated"})
}

func DeleteInstitution(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid institution ID"})
		return
	}

	err = service.DeleteInstitution(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Institution deleted"})
}