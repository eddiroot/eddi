package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/lachlanmacphee/eddy/.gen/eddy/public/model"
	"github.com/lachlanmacphee/eddy/service"
)

func CreateInstitution(c *gin.Context) {
	var institution model.Institution
	if err := c.ShouldBindJSON(&institution); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	createdInstitution, err := service.CreateInstitution(institution.Name, *institution.Continent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Institution created", "id": createdInstitution.ID})
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

	var institution model.Institution
	if err := c.ShouldBindJSON(&institution); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedInstitution, err := service.UpdateInstitution(id, institution.Name, *institution.Continent)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Institution updated", "institution": updatedInstitution})
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