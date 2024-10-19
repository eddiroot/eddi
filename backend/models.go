package main

type Institution struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Continent string `json:"continent"`
}

type Admin struct {
	ID            int    `json:"id"`
	InstitutionID int    `json:"institutionId"`
	Username      string `json:"username"`
	Password      string `json:"password"`
}

type User struct {
	ID         int    `json:"id"`
	FirstName  string `json:"firstName"`
	MiddleName string `json:"middleName"`
	LastName   string `json:"lastName"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	AvatarUrl  string `json:"avatarUrl"`
}

type Course struct {
	ID            int    `json:"id"`
	InstitutionID int    `json:"institutionId"`
	Name          string `json:"name"`
	Description   string `json:"description"`
}
