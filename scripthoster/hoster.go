package main

import (
	"io/ioutil"
	"log"
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"
	// "github.com/labstack/echo/v4/middleware"
)

type Script struct {
	Text string
}

var script *Script

func main() {
	script = &Script{Text: ""}
	// Echo instance
	e := echo.New()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"https://localhost"},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept},
	}))
	// Middleware
	// e.Use(middleware.Logger())
	// e.Use(middleware.Recover())

	// Routes
	e.GET("/init", GETInit)
	e.GET("/script", GETScript)

	// Start server
	e.Logger.Fatal(e.Start(":1323"))
}

func GETInit(c echo.Context) error {
	content, err := ioutil.ReadFile("./src/vm/example.64s")

	if err != nil {
		log.Fatal(err)
	}

	script = &Script{Text: string(content)}
	return c.JSON(http.StatusOK, script)
}

func GETScript(c echo.Context) error {
	content, err := ioutil.ReadFile("./src/vm/example.64s")

	if err != nil {
		log.Fatal(err)
	}

	if script.Text == string(content) {
		return c.JSON(http.StatusOK, Script{Text: ""})
	}

	script = &Script{Text: string(content)}
	return c.JSON(http.StatusOK, script)
}
