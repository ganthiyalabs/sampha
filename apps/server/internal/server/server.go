package server

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
)

type Server struct {
	port int
}

func NewServer() *Server {
	port, _ := strconv.Atoi(os.Getenv("PORT"))
	if port == 0 {
		port = 8080 // default port
	}
	log.Printf("initializing server components on port %d", port)

	server := &Server{
		port: port,
	}

	log.Println("all server components initialized successfully")
	return server
}

func (s *Server) ListenAndServe() error {
	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", s.port),
		Handler:      s.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}
	return server.ListenAndServe()
}
